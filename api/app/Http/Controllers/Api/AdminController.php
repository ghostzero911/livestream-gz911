<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Models\User;
use App\Models\Stream;
use App\Models\AdPlacement;

class AdminController extends Controller
{
    public function dashboardStats()
    {
        $liveStreamCount = Stream::where('status', 'live')->count();
        $totalUsers = User::count();
        $totalStreams = Stream::count();

        return response()->json([
            'liveStreams' => $liveStreamCount,
            'totalUsers' => $totalUsers,
            'totalStreams' => $totalStreams,
        ]);
    }

    // --- Stream Management ---
    /**
     * List all streams.
     */
    public function listStreams(Request $request)
    {
        $streams = Stream::orderBy('created_at', 'desc')
            ->get();
        return response()->json($streams);
    }

    /**
     * Create a new stream
     */
    public function createStream(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'thumbnail_url' => 'nullable|url',
            'host' => 'required|string|max:255',
            'scheduled_start_time' => 'nullable|date',
            'video_url' => 'nullable|url',
            'stream_url' => 'nullable|url',
            'fixture_id' => 'nullable|string',
            'details' => 'nullable|array',
            'is_restreaming' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $data = $validator->validated();
        $data['slug'] = Str::slug($data['title']) . '_' . Str::random(12);

        if (empty($data['video_url'])) {
            $data['stream_key'] = $data['slug'];
            $data['secret_token'] = env('SRS_SECRET_TOKEN');
            $data['status'] = 'offline';
        } else {
            $data['status'] = 'live';
        }

        try {
            $stream = Stream::create($data);

            return response()->json([
                'message' => 'Stream berhasil dibuat.',
                'stream' => $stream,
                // 'stream_key' => $stream->streamKey . '?secret=' . $stream->secretToken,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal buat stream.', 'details' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a stream.
     */
    public function deleteStream(Request $request, $id)
    {
        $stream = Stream::find($id);
        if (!$stream) {
            return response()->json(['error' => 'Stream not found'], 404);
        }

        // Optional: Add logic here to stop the stream if it's live before deleting?
        $stream->delete();
        return response()->json(null, 204);
    }

    /**
     * Update an existing stream.
     */
    public function updateStream(Request $request, $id)
    {
        $stream = Stream::find($id);
        if (!$stream) {
            return response()->json(['error' => 'Stream not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'thumbnail_url' => 'nullable|url',
            'host' => 'required|string|max:255',
            'stream_url' => 'nullable|url',
            'scheduled_start_time' => 'nullable|date',
            'video_url' => 'nullable|url',
            'fixture_id' => 'nullable|string|max:255',
            'details' => 'nullable|array',
            'is_restreaming' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $data = $validator->validated();
        $data['slug'] = Str::slug($data['title']) . '_' . Str::random(12);

        if (!empty($data['video_url'])) {
            $data['stream_key'] = null;
            $data['scheduled_start_time'] = null;
            $data['status'] = 'live';
        } else {
            $data['video_url'] = null;
        }

        $stream->update($data);

        return response()->json($stream);
    }

    /**
     * Manually set a stream's status to 'live'.
     */
    public function setStreamLive(Request $request, $stream_id)
    {
        $stream = Stream::find($stream_id);
        if (!$stream) {
            return response()->json(['error' => 'Stream not found'], 404);
        }

        $stream->update(['status' => 'live']);
        return response()->json(['message' => 'Stream set to live.', 'stream' => $stream]);
    }

    /**
     * Manually set a stream's status to 'offline'.
     */
    public function setStreamOffline(Request $request, $stream_id)
    {
        $stream = Stream::find($stream_id);
        if (!$stream) {
            return response()->json(['error' => 'Stream not found'], 404);
        }

        $stream->update(['status' => 'offline']);
        return response()->json(['message' => 'Stream set to offline.', 'stream' => $stream]);
    }
    
    /**
     * List all users.
     */
    public function listUsers(Request $request)
    {
        $users = User::orderBy('name', 'asc')->get();
        // Avoid sending sensitive info like password hash
        $users->makeHidden(['password', 'remember_token']);
        return response()->json($users);
    }

    /**
     * Create a new user.
     */
    public function createUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'is_admin' => 'boolean',
            'stream_key' => 'nullable|string|max:255|unique:users',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $data = $validator->validated();
        $data['password'] = Hash::make($data['password']); // Hash the password

        $user = User::create($data);
        $user->makeHidden(['password', 'remember_token']);

        return response()->json($user, 201);
    }

    /**
     * Update an existing user.
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'is_admin' => 'boolean',
            'stream_key' => ['nullable', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8', // Make password optional
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $data = $validator->validated();

        // Only update password if a new one is provided
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']); // Don't update password if field is empty
        }

        $user->update($data);
        $user->makeHidden(['password', 'remember_token']);

        return response()->json($user);
    }

    /**
     * Delete a user.
     */
    public function deleteUser(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // Prevent an admin from deleting their own account
        if ($request->user()->id == $id) {
            return response()->json(['error' => 'You cannot delete your own account.'], 403);
        }

        $user->delete();

        // Invalidate tokens if needed (optional)
        // $user->tokens()->delete();

        return response()->json(null, 204); // 204 No Content
    }

    /**
     * List all ADS.
     */
    public function listAds()
    {
        $ads = AdPlacement::orderBy('name')->get();
        return response()->json($ads);
    }

    /**
     * Create ADS.
     */
    public function createAd(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:ad_placements,name',
            'ad_code' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $ad = AdPlacement::create($validated);
        return response()->json($ad, 201);
    }

    /**
     * Delete an ADS placement.
     */
    public function deleteAd(Request $request, $id)
    {
        $ad = AdPlacement::find($id);
        if (!$ad) {
            return response()->json(['error' => 'Ad placement not found'], 404);
        }

        $ad->delete();

        // 204 No Content is a standard successful deletion response
        return response()->json(null, 204);
    }

    /**
     * Update an existing ADS placement.
     */
    public function updateAd(Request $request, $id)
    {
        $ad = AdPlacement::find($id);
        if (!$ad) {
            return response()->json(['error' => 'Ad placement not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            // Ensure name is unique, but ignore the current ad's ID
            'name' => ['required', 'string', 'max:255', Rule::unique('ad_placements')->ignore($ad->id)],
            'ad_code' => 'required|string',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $ad->update($validator->validated());

        return response()->json($ad);
    }
}