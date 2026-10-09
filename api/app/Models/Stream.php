<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Stream extends Model
{
    protected $fillable = [
        'title',
        'category',
        'host',
        'thumbnail_url',
        'stream_key',
        'secret_token',
        'video_url',
        'stream_url',
        'scheduled_start_time',
        'fixture_id',
        'slug',
        'status',
        'details',
        'is_restreaming',   // <--- Make sure this is fillable
        'ffmpeg_pid'
    ];
     protected $casts = [
         'details' => 'array',
         'scheduled_start_time' => 'datetime',
        'is_restreaming' => 'boolean',
     ];

    // public function fixture()
    // {
    //     return $this->belongsTo(Fixture::class);
    // }
}
