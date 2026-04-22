<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Service categories
        Schema::create('service_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Dhaka neighborhoods
        Schema::create('neighborhoods', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('corporation', ['DNCC', 'DSCC']);
            $table->string('zone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Provider profiles
        Schema::create('provider_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('business_name');
            $table->string('business_slug')->unique();
            $table->foreignId('category_id')->constrained('service_categories');
            $table->foreignId('neighborhood_id')->constrained('neighborhoods');
            $table->text('address');
            $table->string('phone', 20);
            $table->string('whatsapp', 20)->nullable();
            $table->text('description')->nullable();
            $table->string('cover_image')->nullable();
            $table->json('gallery_images')->nullable();
            $table->enum('approval_status', ['pending', 'approved', 'rejected', 'suspended'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->decimal('average_rating', 3, 2)->default(0.00);
            $table->integer('total_reviews')->default(0);
            $table->integer('total_bookings')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('working_hours')->nullable(); // {mon: {open: "09:00", close: "18:00", closed: false}, ...}
            $table->timestamps();
            $table->softDeletes();

            $table->index('business_slug');
            $table->index('approval_status');
            $table->index('category_id');
            $table->index('neighborhood_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_profiles');
        Schema::dropIfExists('neighborhoods');
        Schema::dropIfExists('service_categories');
    }
};
