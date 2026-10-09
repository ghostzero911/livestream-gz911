<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\StreamController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\SiteController;
use App\Http\Controllers\Api\ScrapedMatchController;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/stream/{slug}', [StreamController::class, 'showLiveStream']);
Route::get('/streams/live', [StreamController::class, 'getLiveStreams']);
Route::post('/streams/find-by-source-ids', [StreamController::class, 'getStreamId']);

Route::get('/available-matches/{category}', [SiteController::class, 'getTodayMatches']);
Route::get('/ads/{name}', [SiteController::class, 'getAdPlacement']);
Route::get('/livescore-widget', [SiteController::class,'getLiveScoreWidget']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'updateProfile']);
});

Route::prefix('admin')->middleware(['auth:sanctum', 'is_admin'])->group(function () {
    Route::get('/dashboard-stats', [AdminController::class, 'dashboardStats']);

    // User Management Routes
    Route::get('/users', [AdminController::class, 'listUsers']);
    Route::post('/users', [AdminController::class, 'createUser']);
    Route::put('/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);

    // ADS Management Routes
    Route::get('/ads', [AdminController::class, 'listAds']);
    Route::post('/ads', [AdminController::class, 'createAd']);
    Route::put('/ads/{id}', [AdminController::class, 'updateAd']);
    Route::delete('/ads/{id}', [AdminController::class, 'deleteAd']);

    // Stream Management Routes
    Route::get('/streams', [AdminController::class, 'listStreams']);
    Route::post('/streams', [AdminController::class, 'createStream']);
    Route::put('/streams/{id}', [AdminController::class, 'updateStream']);
    Route::delete('/streams/{id}', [AdminController::class, 'deleteStream']);
    Route::patch('/streams/{stream_id}/live', [AdminController::class, 'setStreamLive']);
    Route::patch('/streams/{stream_id}/offline', [AdminController::class, 'setStreamOffline']);

    // Scrape Management Routes
    Route::get('/scraper/list', [ScrapedMatchController::class, 'index']);
    //Route::post('/scraper/activate-stream', [ScrapedMatchController::class, 'activateStream']);
});

