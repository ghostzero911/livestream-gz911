<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Stream;

class StreamController extends Controller
{
    /**
     * Get LiveStream by its ID.
     */
    public function showLiveStream($slug)
    {
        $stream = Stream::where('slug', $slug)
            ->where('status', 'live')
            ->firstOrFail();

        return response()->json($stream);
    }

    /**
     * Get the list of available LiveStreams.
     */
    public function getLiveStreams(Request $request)
    {
        $category = $request->input('category');

        $streams = Stream::where('status', 'live')
            ->when($category, fn($query) => $query->where('category', $category))
            ->orderByRaw('video_url IS NOT NULL DESC')
            ->oldest()
            ->get();

        // might need to adjust the data structure before sending it to React
        // to match what the frontend expects (e.g., extracting team names).

        return response()->json($streams);
    }

    /**
     * Get the respective stream ID based on the fixture_id.
     */
    public function getStreamId(Request $request)
    {
        $ids = $request->input('ids');
        if (empty($ids)) {
            return response()->json([]);
        }
        $ids = array_map('strval', $ids);

        $streams = Stream::whereIn('fixture_id', $ids)
                         ->get(['fixture_id', 'slug']);

        $map = [];
        foreach ($streams as $stream) {

            if ($stream->fixture_id) {
                $map[(string) $stream->fixture_id] = $stream->slug;
            }
        }
        return response()->json($map);
    }
}
