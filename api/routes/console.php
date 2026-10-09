<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// Artisan::command('inspire', function () {
//     $this->comment(Inspiring::quote());
// })->purpose('Display an inspiring quote');

Schedule::command('streams:manage')->everyMinute();
Schedule::command('scrape:nobarsoccer')->everyFifteenMinutes();
Schedule::command('scrape:nobarbasket')->everyFifteenMinutes();
Schedule::command('scrape:streamed-pk')->everyFifteenMinutes();
//Schedule::command('scrape:tigoallive')->everyThirtyMinutes();
Schedule::command('streams:prune-old')->everyThirtyMinutes();
