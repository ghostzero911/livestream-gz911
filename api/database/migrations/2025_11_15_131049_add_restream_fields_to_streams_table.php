<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('streams', function (Blueprint $table) {
            $table->json('restream_config')->nullable(); // The scraper logic info (e.g. "source": "alpha", "id": "xyz")
            $table->boolean('is_restreaming')->default(false); // Master switch
            $table->integer('ffmpeg_pid')->nullable(); // To track the process
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('streams', function (Blueprint $table) {
            $table->dropColumn('restream_config');
            $table->dropColumn('is_restreaming');
            $table->dropColumn('ffmpeg_pid');
        });
    }
};
