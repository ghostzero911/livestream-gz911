<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Stream;
use Illuminate\Support\Facades\Http;

class ManageRestreams extends Command
{
    protected $signature = 'streams:manage';
    protected $description = 'Auto-heal and manage FFmpeg restreams';
    public function handle()
    {
        $this->info("--- Starting Stream Manager ---");
        $activeStreams = Stream::where('is_restreaming', true)->get();

        $this->info("Found " . $activeStreams->count() . " streams marked for re-streaming.");
        foreach ($activeStreams as $stream) {
            $this->info("Checking stream: {$stream->title} (ID: {$stream->id})");
            // If PID exists, check if the process is actually running
            if ($stream->ffmpeg_pid) {
                $this->info("  - Has PID: {$stream->ffmpeg_pid}");
                if (file_exists("/proc/{$stream->ffmpeg_pid}")) {
                    $this->info("  - Process is running. Skipping.");
                    return;
                } else {
                    $this->warn("  - Process dead. Restarting...");
                }
                // If PID file missing, it crashed. Reset and restart.
                $this->error("Stream {$stream->title} crashed. Restarting...");
            } else {
                $this->info("  - No PID. Starting fresh.");
            }
            $this->checkAndStartStream($stream);
        }
        $this->info("--- Manager Finished ---");

        // Get all streams that SHOULD be stopped (but have a PID)
        $stoppedStreams = Stream::where('is_restreaming', false)
            ->whereNotNull('ffmpeg_pid')
            ->get();

        foreach ($stoppedStreams as $stream) {
            $this->killProcess($stream);
        }
    }

    private function checkAndStartStream($stream)
    {
        if ($stream->ffmpeg_pid && file_exists("/proc/{$stream->ffmpeg_pid}")) {
            return;
        }
        $this->info("  -> Attempting to resolve URL...");

        $m3u8Url = $this->resolveStreamUrl($stream);

        if (!$m3u8Url) {
            $this->error("  -> FAILED: Could not resolve M3U8 URL. Check details column.");
            return;
        }

        $this->info("  -> URL Resolved: " . substr($m3u8Url, 0, 30) . "...");

        // --- START FFMPEG ---
        $localKey = $stream->stream_key;
        if (!$localKey) {
            $this->error("  -> FAILED: No stream_key found.");
            return;
        }

        $headers = '-headers "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -headers "Referer: https://embedsports.top/"';

        // Command Breakdown:
        // -re          : Read input at native frame rate (Crucial for live)
        // -i URL       : The fresh .m3u8 we just found
        // -c copy      : Copy mode (Zero CPU encoding)
        // -f flv       : Output format for Oryx/RTMP
        // rtmp://...   : Local Oryx ingest URL
        $cmd = "nohup ffmpeg {$headers} -re -i \"{$m3u8Url}\" -c copy -f flv rtmp://127.0.0.1:1935/live/{$localKey}";
        //$cmd = "nohup ffmpeg -re -i \"{$m3u8Url}\" -c copy -f flv rtmp://127.0.0.1/live/{$localKey} > /dev/null 2>&1 & echo $!";

        $this->info("---------------------------------------------------");
        $this->info("TRY RUNNING THIS COMMAND MANUALLY:");
        $this->info($cmd);
        $this->info("---------------------------------------------------");

        $finalCmd = "nohup {$cmd} > /dev/null 2>&1 & echo $!";

        $pid = exec($finalCmd);

        if ($pid) {
            $stream->update([
                'ffmpeg_pid' => $pid,
                'status' => 'live' // Update DB so frontend shows the player
            ]);
            $this->info("Started: {$stream->title} (PID: $pid)");
        } else {
            $this->error("  -> FAILED: Exec command returned no PID.");
        }
    }

    private function resolveStreamUrl($stream)
    {
        $details = $stream->details;

        $source = $details['scraper_source'] ?? null;
        $id = $details['scraper_id'] ?? null;

        if (!$source || !$id) {
            $this->warn("  -> Missing scraper_source or scraper_id in details.");
            return $stream->source_m3u8_url ?? null;
        }

        try {
            $apiUrl = "https://streamed.pk/api/stream/{$source}/{$id}";
            $this->info("  -> Fetching API: $apiUrl");

            $apiRes = Http::get($apiUrl);
            $data = $apiRes->json();

            $embedUrl = null;

            if (is_array($data) && isset($data[0]['embedUrl'])) {
                // Option A: Just take the first one (Stream 1)
                $embedUrl = $data[0]['embedUrl'];

                // Option B (Advanced): Loop to find "English" and "HD" specifically
                // foreach ($data as $s) {
                //    if ($s['language'] === 'English' && $s['hd'] === true) {
                //        $embedUrl = $s['embedUrl'];
                //        break;
                //    }
                // }
            } elseif (isset($data['embedUrl'])) {
                $embedUrl = $data['embedUrl'];
            }

            if (!$embedUrl) {
                $this->error("  -> API returned no embedUrl.");
                return null;
            }

            $this->info("  -> Found Embed URL: $embedUrl");
            $this->getFreshM3u8($embedUrl);

        } catch (\Exception $e) {
            $this->error("  -> Exception: " . $e->getMessage());
            return null;
        }
    }

    private function getFreshM3u8($embedUrl)
    {
        $html = Http::withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
            'Referer' => 'https://embedsports.top/'
        ])->get($embedUrl)->body();

        // Find the hidden m3u8
        preg_match('/https?:\/\/[^"\'\s]+\.m3u8[^\s"\'<>]+/', $html, $matches);

        //return $matches[0] ?? null;

        if (isset($matches[0])) {
            return $matches[0];
        } else {
            // --- DEBUGGING: Save HTML to a file to inspect it ---
            // Since the HTML is huge, save it to storage/logs/debug.html
            file_put_contents(storage_path('logs/debug_stream.html'), $html);
            $this->error("  -> Regex failed. HTML saved to storage/logs/debug_stream.html");

            // Also try a looser regex just in case (sometimes it's inside a variable)
            // Look for ANY string ending in .m3u8 inside quotes
            preg_match('/["\']([^"\']+\.m3u8[^"\']*)["\']/', $html, $backupMatches);
            if (isset($backupMatches[1])) {
                $this->info("  -> Backup regex found match!");
                return $backupMatches[1];
            }
        }
    }

    private function killProcess($stream)
    {
        if ($stream->ffmpeg_pid) {
            exec("kill -9 {$stream->ffmpeg_pid}");
            $stream->update(['ffmpeg_pid' => null, 'status' => 'offline']);
            $this->info("Stopped: {$stream->title}");
        }
    }
}