<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('scraped_matches', function (Blueprint $table) {
            $table->id();
            $table->string('external_id')->unique(); // e.g. "sassuolo-w-vs-ternana-w"
            $table->string('title');
            $table->string('category');
            $table->dateTime('match_time');
            $table->string('thumbnail_url')->nullable();
            $table->json('source_info')->nullable(); // Store the 'sources' array here
            $table->boolean('is_promoted')->default(false); // True if admin already made it a stream
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scraped_matches');
    }
};
