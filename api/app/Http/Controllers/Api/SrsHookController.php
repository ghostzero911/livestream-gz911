<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Stream;

class SrsHookController extends Controller
{
    public function handleSrsHook(Request $request)
    {
        $publicKey = $request->input('stream');
        $receivedToken = $request->input('token');
        $secretToken = env('SRS_SECRET_TOKEN');

        if (!$secretToken || $receivedToken !== $secretToken) {
            return response()->json(['code' => 1, 'message' => 'Invalid hook token']);
        }

        // Find the stream by its public key
        $stream = Stream::where('stream_key', $publicKey)->first();
        if ($stream) {
            // Update stream status to 'live' when they connect
            $stream->update(['status' => 'live']);
            return response()->json(['code' => 0, 'message' => 'Authentication successful']);
        }

        return response()->json(['code' => 1, 'message' => 'Invalid stream key']);
    }
}