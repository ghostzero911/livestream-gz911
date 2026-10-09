<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use App\Models\Stream;
use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;
use Carbon\Carbon;


class ScrapeNobarSoccer extends Command
{
    /**
     * The name and signature of the console command.
     * @var string
     */
    protected $signature = 'scrape:nobarsoccer'; // This is how you call it

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
        $this->info('Starting soccer stream scrape...'); // Log to console
        Log::info('Starting soccer stream scrape...'); // Log to file

        $client = new Client();

        try {

            $scheduleUrl = 'https://nobartv.cloud/football';
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
                        $this->line("Skipping stream (already exists): " . $jsonId);
                        Log::info("Skipping stream (already exists): " . $jsonId);
                        continue;
                    }

                    // --- Fetch the Stream's JSON Data ---
                    $jsonUrl = "https://streamdata.apk150.pro/streamdata/{$jsonId}.json";
                    $jsonResponse = $client->request('GET', $jsonUrl)->getBody()->getContents();
                    $data = json_decode($jsonResponse, true);

                    if (!$data) {
                        $this->info("Stream data not found");
                        Log::info("Stream data not found");
                        continue;
                    }

                    // --- Find the matching fixture ---
                    $apiUrl = env('APP_URL') . "/api/available-matches/soccer";
                    $apiResponse = $client->request('GET', $apiUrl)->getBody()->getContents();
                    $matchData = json_decode($apiResponse, true);

                    $fixtureIds = collect($matchData)
                        ->filter(fn($value) => 
                                $value['home_team_name'] == $data['homedata']['name'] &&
                                $value['away_team_name'] == $data['awaydata']['name']
                        )
                        ->pluck('id')
                        ->all();

                    $this->info("Found " . count($fixtureIds) . " match related to this stream: " . $jsonId);
                    Log::info("Found " . count($fixtureIds) . " match related to this stream: " . $jsonId);

                    // --- Transform and Create Stream ---
                    $title = $data['homedata']['name'] . ' VS ' . $data['awaydata']['name'];
                    $videoUrl = $data['sources'][0]['source'] ?? null;

                    if (!$videoUrl) {
                        $this->warn("Skipping {$title} (no HLS source found).");
                        continue;
                    }

                    // $category = strtolower($data['sport'] ?? 'general');
                    // if ($category === 'football') $category = 'soccer';

                    $scheduledTime = isset($data['kickoff']) ? Carbon::createFromTimestamp($data['kickoff']) : null;
                    $cutoffTime = Carbon::now()->subHours(2);

                    $status = ($scheduledTime && $scheduledTime < $cutoffTime) ? 'offline' : 'live';

                    Stream::create([
                        'title' => $title,
                        'slug' => Str::slug($title) . '_' . Str::random(12),
                        'category' => 'soccer',
                        'stream_url' => $videoUrl,
                        'scheduled_start_time' => $scheduledTime,
                        'fixture_id' => $fixtureIds ? $fixtureIds[0] : '',
                        'thumbnail_url' => 'https://cfstatic.lwymapi852.com/img/player/icon-player-holder-football.jpg' ?? null,
                        'host' => $data['liga'],
                        'status' => $status,
                        'details' => ['source_id' => $data['id'], 'league' => $data['liga'] ?? null]
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