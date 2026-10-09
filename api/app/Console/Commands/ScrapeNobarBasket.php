<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;
use App\Models\Stream;
use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log; // For logging errors

class ScrapeNobarBasket extends Command
{
    /**
     * The name and signature of the console command.
     * @var string
     */
    protected $signature = 'scrape:nobarbasket'; // This is how you call it

    /**
     * The console command description.
     * @var string
     */
    protected $description = 'Scrapes the source website for new streams and adds them to the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting basket stream scrape...');
        Log::info('Starting basket stream scrape...');

        $client = new Client();

        try {
            $scheduleUrl = 'https://nobartv.cloud/basketball';
            $html = $client->request('GET', $scheduleUrl)->getBody()->getContents();
            $crawler = new Crawler($html);

            $links = $crawler->filter('a.is_hot')->each(function ($node) {
                return $node->attr('href');
            });

            $this->info(count($links) . ' potential streams found.');
            Log::info(count($links) . ' potential streams found.');

            foreach ($links as $url) {
                try {
                    // --- Get the JSON ID ---
                    $path = parse_url($url, PHP_URL_PATH);
                    $slug = basename($path);
                    $parts = explode('-', $slug);
                    $jsonId = end($parts);

                    if (empty($jsonId))
                        continue;

                    // --- Check for Duplicates ---
                    $existingStream = Stream::where('details->source_id', $jsonId)->first();
                    if ($existingStream) {
                        $this->info("Skipping stream (already exists): " . $jsonId);
                        Log::info("Skipping stream (already exists): " . $jsonId);
                        continue;
                    }

                    // --- Fetch the Stream's JSON Data ---
                    $jsonUrl = "https://streamdata.apk150.pro/streamdata/{$jsonId}.json";
                    $jsonResponse = $client->request('GET', $jsonUrl)->getBody()->getContents();
                    $streamData = json_decode($jsonResponse, true);

                    if (!$streamData) {
                        $this->info("Stream data not found");
                        Log::info("Stream data not found");
                        continue;
                    }

                    // --- Find the matching fixture ---
                    $apiUrl = env('APP_URL') . "/api/available-matches/basket";
                    $apiResponse = $client->request('GET', $apiUrl)->getBody()->getContents();
                    $matchData = json_decode($apiResponse, true);

                    $fixtureIds = collect($matchData)
                        ->filter(fn($value) => 
                                $value['home_team_name'] == $streamData['homedata']['name'] &&
                                $value['away_team_name'] == $streamData['awaydata']['name']
                        )
                        ->pluck('id')
                        ->all();
                    $this->info("Found " . count($fixtureIds) . " match related to this stream: " . $jsonId);
                    Log::info("Found " . count($fixtureIds) . " match related to this stream: " . $jsonId);

                    // --- Transform and Create Stream ---
                    $title = $streamData['homedata']['name'] . ' VS ' . $streamData['awaydata']['name'];
                    $videoUrl = $streamData['sources'][0]['source'] ?? null;

                    if (!$videoUrl) {
                        $this->warn("Skipping {$title} (no HLS source found).");
                        continue;
                    }

                    $scheduledTime = isset($streamData['kickoff']) ? Carbon::createFromTimestamp($streamData['kickoff']) : null;
                    $cutoffTime = Carbon::now()->subHours(2);

                    $status = ($scheduledTime && $scheduledTime < $cutoffTime) ? 'offline' : 'live';

                    Stream::create([
                        'title' => $title,
                        'slug' => Str::slug($title) . '_' . Str::random(12),
                        'category' => 'basket',
                        'stream_url' => $videoUrl,
                        'fixture_id' => $fixtureIds ? $fixtureIds[0] : '',
                        'scheduled_start_time' => $scheduledTime,
                        'thumbnail_url' => 'https://nbafiles.com/wp-content/uploads/2025/08/NBA-Season-2025-26.webp',
                        'host' => $streamData['liga'],
                        'status' => $status,
                        'details' => ['source_id' => $streamData['id'], 'league' => $streamData['liga'] ?? null]
                    ]);

                    $this->info("Created new stream: " . $title);
                    Log::info("Created new stream: " . $title);
                } catch (\Exception $e) {

                    $this->error("Failed to save stream {$jsonId}: " . $e->getMessage());
                    Log::error("Failed to save stream {$jsonId}: " . $e->getMessage());
                }
            }

        } catch (\Exception $e) {
            $this->error("Scrape failed: " . $e->getMessage());
            Log::error("Scrape failed: " . $e->getMessage());
        }

        $this->info('Stream scrape finished.');
        Log::info('Stream scrape finished.');
    }
}