<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Models\Stream;
use App\Models\AdPlacement;
use Carbon\Carbon;
use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;

class SiteController extends Controller
{
    private $apiUrls = [
        'soccer' => 'https://api.4fnt.com/api/football/match/home/list/v1',
        'basket' => 'https://api.4fnt.com/api/basketball/match/home/list',
    ];

    private const STATUS_UPCOMING = 1;
    private const STATUS_LIVE = [2, 3, 4, 5, 6, 7, 8, 13];
    private const STATUS_FINISHED = 10;

    /**
     * Fetch scores from external API, merging multiple days for timezone safety,
     * and injecting internal stream IDs if available.
     */
    public function getTodayMatches(Request $request, $category)
    {
        if (!isset($this->apiUrls[$category])) {
            return response()->json(['error' => 'Invalid category'], 404);
        }
        $apiUrl = $this->apiUrls[$category];

        $now = Carbon::now('America/New_York');
        $datesToFetch = [
            $now->format('Y-m-d'),           // Today in NY
            $now->copy()->subDay()->format('Y-m-d') // Yesterday in NY
        ];

        $client = new Client(['verify' => false]);
        $allMatches = [];

        // Loop through dates and fetch
        foreach ($datesToFetch as $date) {
            try {
                $response = $client->request('POST', $apiUrl, [
                    'json' => ['start_time' => $date, 'filter' => 1]
                ]);
                $data = json_decode($response->getBody()->getContents(), true);
                $list = $data['data']['list'] ?? [];

                if (!empty($list)) {
                    if (array_is_list($list)) {
                        $allMatches = array_merge($allMatches, $list);
                    } else {
                        foreach ($list as $league) {
                            $allMatches = array_merge($allMatches, $league);
                        }
                    }
                }
            } catch (\Exception $e) {
                // Log error but continue to next date
                Log::error("Failed to fetch live scores for date {$date}: " . $e->getMessage());
                continue;
            }
        }

        $validStatuses = [1, 2, 3, 4, 5, 6, 7, 8, 13];
        $activeMatches = collect($allMatches)
            ->unique('id') // Remove duplicates from multi-day fetch
            ->filter(function ($match) use ($validStatuses) {
                return in_array($match['status_id'], $validStatuses);
            })
            ->values();

        // Extract External IDs for Database Matching
        $externalIds = $activeMatches->pluck('id')->toArray();

        $ourStreams = Stream::whereIn('fixture_id', $externalIds)
            ->get(['id', 'fixture_id']);
        $streamMap = $ourStreams->pluck('id', 'fixture_id');

        $finalData = $activeMatches->map(function ($match) use ($streamMap, $allMatches) {
            // Clean URLs
            // $match['home_team_logo'] = $cleanUrl($match['home_team_logo'] ?? null);
            // $match['away_team_logo'] = $cleanUrl($match['away_team_logo'] ?? null);
            // $match['competition_logo'] = $cleanUrl($match['competition_logo'] ?? null);
            // $match['country_logo'] = $cleanUrl($match['country_logo'] ?? null);

            // Inject Stream ID
            $match['internal_stream_id'] = $streamMap[$match['id']] ?? null;

            return $match;
        });

        return response()->json($finalData);
    }
    // Transform and Return
    //$transformedData = $this->transformData($allMatches, $streamMap, $isArrayData);

    //return response()->json($transformedData);


    /**
     * Transforms raw API data into frontend-ready structure.
     */
    private function transformData($list, $streamMap, $isArrayData)
    {
        $results = ['live' => [], 'upcoming' => [], 'finished' => []];
        $leagueMap = ['live' => [], 'upcoming' => [], 'finished' => []];

        // Helper to clean image URLs
        // $cleanUrl = function ($url) {
        //     return $url ? explode('!', $url)[0] : $url;
        // };

        // If Basketball (Array), group by league first
        if ($isArrayData) {
            // Deduplicate matches based on ID
            $uniqueMatches = collect($list)->unique('id')->all();

            $groupedList = [];
            foreach ($uniqueMatches as $match) {
                $leagueName = $match['competition_name'] ?? 'Unknown League';
                $groupedList[$leagueName][] = $match;
            }
            $list = $groupedList;
        } else {
            // Soccer (Object): Deduplicate matches inside each league
            foreach ($list as $leagueName => $matches) {
                $list[$leagueName] = collect($matches)->unique('id')->all();
            }
        }

        // Process the grouped list
        foreach ($list as $leagueName => $matches) {
            foreach ($matches as $match) {
                $statusKey = null;
                if ($match['status_id'] == self::STATUS_UPCOMING)
                    $statusKey = 'upcoming';
                elseif (in_array($match['status_id'], self::STATUS_LIVE))
                    $statusKey = 'live';
                elseif ($match['status_id'] == self::STATUS_FINISHED)
                    $statusKey = 'finished';

                if ($statusKey) {
                    // Initialize league group
                    if (!isset($leagueMap[$statusKey][$leagueName])) {
                        $leagueMap[$statusKey][$leagueName] = [
                            'league_name' => $leagueName,
                            //'competition_logo' => $cleanUrl($match['competition_logo'] ?? null),
                            'matches' => [],
                        ];
                    }

                    // Clean match image URLs
                    // $match['home_team_logo'] = $cleanUrl($match['home_team_logo'] ?? null);
                    // $match['away_team_logo'] = $cleanUrl($match['away_team_logo'] ?? null);
                    // $match['country_logo'] = $cleanUrl($match['country_logo'] ?? null);

                    // Inject Internal Stream ID
                    $externalId = $match['id'];
                    $match['internal_stream_id'] = $streamMap[$externalId] ?? null;

                    $leagueMap[$statusKey][$leagueName]['matches'][] = $match;
                }
            }
        }

        $results['live'] = array_values($leagueMap['live']);
        $results['upcoming'] = array_values($leagueMap['upcoming']);
        $results['finished'] = array_values($leagueMap['finished']);

        return $results;
    }

    /**
     * Fetch available ads that is set for specific placement
     */
    public function getAdPlacement(Request $request, $name)
    {
        // Find an active ad by its unique name
        $ad = AdPlacement::where('name', $name)
            ->where('is_active', true)
            ->first();

        if ($ad) {
            // Only return the necessary fields
            return response()->json([
                'id' => $ad->id,
                'name' => $ad->name,
                'ad_code' => $ad->ad_code,
            ]);
        } else {
            // Return empty if no active ad found for that name
            return response()->json(null, 204); // 204 No Content
        }
    }

    /**
     * Fetch Live Score Widget Data
     */
    public function getLiveScoreWidget(Request $request)
    {
        $client = new Client();

        try {
            $widgetUrl = 'https://ls.soccersapi.com/2025-11-19';
            $html = $client->request('GET', $widgetUrl)->getBody()->getContents();
            $crawler = new Crawler($html);

            $headNode = $crawler->filter('head')->first()->getNode(0);
            $doc = $headNode->ownerDocument;

            $jqueryScript = $doc->createElement('script');
                $jqueryScript->setAttribute('src', "https://code.jquery.com/jquery-3.7.1.min.js");
                $jqueryScript->setAttribute('integrity', "sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=");
                $jqueryScript->setAttribute('crossorigin', "anonymous");
                $headNode->appendChild($jqueryScript);

            $oldNode = $crawler->filter('script[src="https://ws.soccersapi.com/javascripts/c-core.js"]')->first()->getNode(0);
            // $domElement->setAttribute('src', "/c-core.js");
            $parentNode = $oldNode ? $oldNode->parentNode : null;

            if ($oldNode && $parentNode) {
                // Get the owner document to create the new element
                $doc = $oldNode->ownerDocument;

                // Create the new <script> element using DOMDocument::createElement
                $newScript = $doc->createElement('script');
                $newScript->setAttribute('src', "/c-core.js");

                // Replace the old node with the new one
                // Syntax: $parentNode->replaceChild($newNode, $oldNode);
                $parentNode->replaceChild($newScript, $oldNode);
            }

            // Remove toolbar header
            // $crawler->filter('.custom_banner, header, a[data-mg="mygames"], .day-txt')->each(function (Crawler $htmlPage) {
            //     // DomCrawler doesn't have a remove() method, so we access the DOMNode directly
            //     foreach ($htmlPage as $node) {
            //         $node->parentNode->removeChild($node);
            //     }
            // });

            $cleanHtml = $crawler->filter('body')->html();
            echo $cleanHtml;
        } catch (\Exception $e) {
            Log::error("Scrape failed: " . $e->getMessage());
        }
    }
}
