<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\ScrapedMatch;
use App\Models\Stream;

class ScrapedMatchController extends Controller
{
    public function index()
    {
        // Return matches that haven't been promoted yet, sorted by time
        return ScrapedMatch::where('is_promoted', false)
            ->orderBy('match_time', 'asc')
            ->get();
    }

    /**
     * Creates a stream record for a given fixture and returns stream keys.
     */
    public function activateStream(Request $request)
    {
        // Get the raw data from the scraper table
        $scraped = ScrapedMatch::findOrFail($request->input('scraped_id'));

        // Create the Production Stream
        $stream = Stream::create([
            'title' => $scraped->title,
            'category' => $scraped->category,
            'scheduled_start_time' => $scraped->match_time,
            'status' => 'offline', // Starts offline until FFmpeg kicks in

            // Generate a clean slug for your internal HLS url
            'stream_key' => Str::slug($scraped->title) . '-' . Str::random(4),

            // Save the info needed to find the m3u8 later
            // We typically take the first available source
            'restream_config' => $scraped->source_info[0] ?? null,

            // Turn it on immediately? (Or let admin toggle it later)
            'is_restreaming' => true,
        ]);

        return response()->json($stream);
    }

}
