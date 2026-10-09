<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stream;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\DomCrawler\Crawler;
use GuzzleHttp\Client;
use Carbon\Carbon;


class ScrapeController extends Controller
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

    public function fetchLiveList()
    {
        $url = 'https://nobartv.my';

        try {
            // --- Use Guzzle to fetch the HTML ---
            $client = new Client();
            $response = $client->request('GET', $url);
            $html = $response->getBody()->getContents();

            // --- Use DomCrawler to parse the HTML ---
            $crawler = new Crawler($html);

            // --- Extract data (same logic as before) ---
            // $scraped_data = [];
            $links = $crawler->filter('a.is_hot')->each(function ($node) {
                $url = $node->attr('href');
                $path = parse_url($url, PHP_URL_PATH);
                $slug = basename($path);
                $parts = explode('-', $slug);
                return end($parts);
            });
            // $crawler->filter('div.list-match-sport-live-stream')->each(function ($node) use (&$scraped_data) {

            //     $text = $node->filter('a.item-match is_hot')->attr('href');
            //     $author = $node->filter('small.author')->text();

            //     $scraped_data[] = [
            //         'quote_text' => $text,
            //         'author' => $author
            //     ];
            // });

            return response()->json($links);

        } catch (\Exception $e) {
            // Handle exceptions (e.g., Guzzle 404 error, network error)
            return response()->json(['error' => 'Failed to scrape the page.', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Fetch JSON data from an external URL.
     * The {id} from the route is automatically passed here.
     */
    public function fetchStreamData($id)
    {
        $url = "https://streamdata.apk150.pro/streamdata/{$id}.json";

        try {
            $client = new Client();
            $response = $client->request('GET', $url);

            $data = json_decode($response->getBody()->getContents());
            return response()->json($data);

        } catch (\Exception $e) {
            // Handle errors (e.g., 404, connection timed out)
            return response()->json(['error' => 'Failed to fetch external JSON.', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Scrapes a JSON URL and creates a new stream.
     */
    public function scrapeAndCreateStream($id, Request $request)
    {
        // Fetch the external JSON data
        $url = "https://streamdata.apk150.pro/streamdata/{$id}.json";

        try {
            $client = new Client();
            $response = $client->request('GET', $url);

            $data = json_decode($response->getBody()->getContents(), true); // 'true' for assoc array
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch or parse stream data.'], 500);
        }

        $sourceId = $data['id'] ?? null;
        if ($sourceId) {
            // Use details->source_id JSON field to track the original ID
            $existingStream = Stream::where('details->source_id', $sourceId)->first();
            if ($existingStream) {
                return response()->json(['message' => 'Stream already exists.', 'stream' => $existingStream], 409); // 409 Conflict
            }
        }

        // Transform the data
        $title = $data['homedata']['name'] . ' vs ' . $data['awaydata']['name'] . ' - ' . $data['liga'];
        $videoUrl = $data['sources'][0]['source'] ?? null; // Get the first HLS source

        // Map 'football' to 'soccer', or use the sport as-is
        // $category = strtolower($data['sport'] ?? 'general');
        // if ($category === 'football') {
        //     $category = 'soccer';
        // }

        $scheduledTime = null;
        if (isset($data['kickoff'])) {
            $scheduledTime = Carbon::createFromTimestamp($data['kickoff']);
        }

        // Check if we got the essential data
        if (!$videoUrl) {
            return response()->json(['error' => 'No HLS source was found in the JSON data.'], 400);
        }

        // Create the stream
        try {
            $stream = Stream::create([
                'title' => $title,
                'category' => 'sports',
                'video_url' => $videoUrl, // We save it as a VOD/Embed link
                'scheduled_start_time' => $scheduledTime,
                'thumbnail_url' => $data['homedata']['logo'] ?? null, // Use home team logo as thumb
                'status' => 'live', // We assume it's live if we're scraping it
                'details' => json_encode([ // Store extra info
                    'source_id' => $sourceId,
                    'league' => $data['liga'] ?? null
                ])
            ]);

            return response()->json($stream, 201); // 201 Created

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to save stream to database.', 'details' => $e->getMessage()], 500);
        }
    }
}
