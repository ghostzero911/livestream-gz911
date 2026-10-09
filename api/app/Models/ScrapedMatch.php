<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScrapedMatch extends Model
{
    protected $guarded = [];
    protected $casts = [
        'match_time' => 'datetime',
        'source_info' => 'array',
        'is_promoted' => 'boolean',
    ];
}
