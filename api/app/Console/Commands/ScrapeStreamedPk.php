<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\ScrapedMatch;
use Carbon\Carbon;

class ScrapeStreamedPk extends Command
{
    protected $signature = 'scrape:streamed-pk';
    protected $description = 'Scrape matches from Streamed.pk';

    public function handle()
    {
        $this->info('Clearing old restream list...');
        ScrapedMatch::truncate();

        $this->info("Scraping Streamed.pk...");
        try {
            $response = Http::get('https://streamed.pk/api/matches/live');
            
            if ($response->successful()) {
                $matches = $response->json();

                foreach ($matches as $match) {
                    // Parse Date (API uses Milliseconds, Carbon uses Seconds)
                    $matchTime = Carbon::createFromTimestampMs($match['date']);

                    ScrapedMatch::updateOrCreate(
                        ['external_id' => $match['id']],
                        [
                            'title' => $match['title'],
                            'category' => $match['category'],
                            'match_time' => $matchTime,
                            // Use a default image if none provided, or scrape one if available
                            'thumbnail_url' => $match['poster'] ?? null, 
                            'source_info' => $match['sources'] ?? [],
                        ]
                    );
                }
                $this->info("Processed " . count($matches) . " matches.");
            }
        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
        }
    }
}