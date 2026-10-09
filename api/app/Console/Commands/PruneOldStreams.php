<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Stream; // Import your Stream model
use Carbon\Carbon; // Import Carbon for date comparison
use Illuminate\Support\Facades\Log; // Import Log facade

class PruneOldStreams extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'streams:prune-old';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete old scraped streams 120 minutes after their scheduled start time';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for old streams to prune...');
        Log::info('Cron: Checking for old streams to prune...');

        // Calculate the cutoff time (120 minutes ago)
        $cutoffTime = Carbon::now()->subMinutes(150);

        $streamsToDelete = Stream::whereNotNull('stream_url') // Only scraped streams
                                ->whereNotNull('fixture_id')
                                ->where('status', 'live')
                                ->where('scheduled_start_time', '<=', $cutoffTime); // And are older than 2 hours

        $count = $streamsToDelete->count();

        if ($count > 0) {
            $streamsToDelete->delete();

            $this->info("Successfully deleted {$count} old streams.");
            Log::info("Cron: Successfully deleted {$count} old streams.");
        } else {
            $this->info('No old streams to delete.');
            Log::info('Cron: No old streams to delete.');
        }

        return 0;
    }
}
