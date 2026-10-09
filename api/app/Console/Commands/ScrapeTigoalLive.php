<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\Stream;
use GuzzleHttp\Client;
use Carbon\Carbon;
class ScrapeTigoalLive extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scrape:tigoallive';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scrape Tigoals215 for live stream';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting stream scrape...');
        Log::info('Starting stream scrape...');

        $client = new Client();

        try {
            $scheduleUrl = 'https://www.808fubo11.com/livestream.html';
            $html = $client->request('GET', $scheduleUrl)->getBody()->getContents();
            $crawler = new Crawler($html);

            $links = $crawler->filter('a.item')->each(function ($node) {
                return $node->attr('href');
            });

            $this->info(count($links) . ' potential streams found.');

            foreach ($links as $path) {
                try {
                    if (preg_match('/\/football\/(\d+)-/', $path, $matches)) {
                        $matchId = $matches[1];
                    }

                    if (preg_match('/\/basketball\/(\d+)-/', $path, $matches)) {
                        $matchId = $matches[1];
                    }

                    if (empty($matchId))
                        continue;

                    $existingStream = Stream::where('details->source_id', $matchId)->first();
                    if ($existingStream) {
                        $this->line("Skipping stream (already exists): " . $matchId);
                        continue;
                    }
                    
                    $vidUrl = "https://www.808fubo11.com{$path}";
                    $vidHtml = $client->request('GET', $vidUrl)->getBody()->getContents();
                    $vidCrawler = new Crawler($vidHtml);

                    $vidLink = $vidCrawler->filter('iframe')->each(function ($node) {
                        return $node->attr('src');
                    });

                    $title = $vidCrawler->filter('title')->text();
                    $league = $vidCrawler->filter('div.league-name')->text();

                    Stream::create([
                        'title' => $title,
                        'category' => 'soccer',
                        'video_url' => $vidLink,
                        'thumbnail_url' => 'https://cfstatic.lwymapi852.com/img/player/icon-player-holder-football.jpg' ?? null,
                        'host' => $league,
                        'status' => 'live',
                        'details' => json_encode(['source_id' => $matchId, 'league' => $league ?? null])
                    ]);

                    $this->info("Created new stream: " . $title);
                } catch (\Exception $e) {

                    $this->error("Failed to save stream {$matchId}: " . $e->getMessage());
                    Log::error("Failed to save stream {$matchId}: " . $e->getMessage());
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
