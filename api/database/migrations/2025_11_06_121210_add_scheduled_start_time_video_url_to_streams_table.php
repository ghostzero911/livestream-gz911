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
            $table->dateTime('scheduled_start_time')->nullable()->after('category');
            $table->string('video_url')->nullable()->after('thumbnail_url');
            $table->string('stream_url')->nullable()->change();
            $table->string('stream_key')->nullable()->change();
            $table->string('secret_token')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('streams', function (Blueprint $table) {
            $table->dropColumn('scheduled_start_time');
            $table->dropColumn('video_url');
            $table->dropColumn('stream_url');
            $table->dropColumn('stream_key');
            $table->dropColumn('secret_token');
        });
    }
};
