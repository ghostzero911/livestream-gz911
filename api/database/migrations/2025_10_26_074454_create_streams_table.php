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
        Schema::create('streams', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->string('stream_key')->unique(); // Stream key must be unique
            $table->string('secret_token')->nullable(); // Keep the secret here
            $table->string('host')->nullable(); // Streamer/Host name or ID
            $table->string('category')->index();
            //$table->foreignId('fixture_id')->nullable()->constrained('fixtures')->onDelete('set null'); // Link to fixtures, optional
            $table->json('details')->nullable(); // For extra stream info
            $table->string('thumbnail_url')->nullable(); // Thumbnail specific to the stream
            $table->enum('status', ['live', 'offline'])->default('offline'); // Stream status
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('streams');
    }
};
