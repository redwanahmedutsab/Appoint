<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Services offered by providers
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('provider_profiles')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('duration_minutes'); // e.g. 30, 60, 90
            $table->boolean('is_active')->default(true);
            $table->string('image')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('provider_id');
            $table->index('is_active');
        });

        // Provider availability slots
        Schema::create('availability_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('provider_profiles')->onDelete('cascade');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_booked')->default(false);
            $table->boolean('is_blocked')->default(false); // admin/provider can block
            $table->timestamps();

            $table->index(['provider_id', 'date']);
            $table->unique(['provider_id', 'date', 'start_time']);
        });

        // Bookings
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_reference')->unique(); // e.g. APT-20260421-XXXX
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('provider_id')->constrained('provider_profiles');
            $table->foreignId('service_id')->constrained('services');
            $table->foreignId('slot_id')->constrained('availability_slots');
            $table->date('booking_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->decimal('service_price', 10, 2);
            $table->decimal('commission_amount', 10, 2)->default(0); // 5% of service_price
            $table->enum('status', [
                'pending',      // just booked
                'confirmed',    // provider confirmed
                'completed',    // service delivered
                'cancelled',    // cancelled by user or provider
                'no_show'       // user didn't show up
            ])->default('pending');
            $table->enum('cancelled_by', ['user', 'provider', 'admin'])->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('notes')->nullable(); // user notes for provider
            $table->timestamps();
            $table->softDeletes();

            $table->index('booking_reference');
            $table->index(['user_id', 'status']);
            $table->index(['provider_id', 'status']);
            $table->index('booking_date');
        });

        // Ratings and reviews
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('provider_id')->constrained('provider_profiles')->onDelete('cascade');
            $table->tinyInteger('rating'); // 1-5
            $table->text('review_text')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->unique('booking_id'); // one review per booking
            $table->index(['provider_id', 'is_visible']);
        });

        // Favorite providers
        Schema::create('favorite_providers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('provider_id')->constrained('provider_profiles')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['user_id', 'provider_id']);
        });

        // Commission tracking for admin weekly reports
        Schema::create('commission_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->onDelete('cascade');
            $table->foreignId('provider_id')->constrained('provider_profiles');
            $table->decimal('service_amount', 10, 2);
            $table->decimal('commission_rate', 5, 2)->default(5.00);
            $table->decimal('commission_amount', 10, 2);
            $table->enum('settlement_status', ['pending', 'settled'])->default('pending');
            $table->date('week_start')->nullable();
            $table->date('week_end')->nullable();
            $table->timestamp('settled_at')->nullable();
            $table->foreignId('settled_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->index(['provider_id', 'settlement_status']);
            $table->index('week_start');
        });

        // Disputes / complaints
        Schema::create('disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained();
            $table->foreignId('raised_by')->constrained('users');
            $table->text('description');
            $table->enum('status', ['open', 'under_review', 'resolved', 'closed'])->default('open');
            $table->text('resolution')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disputes');
        Schema::dropIfExists('commission_records');
        Schema::dropIfExists('favorite_providers');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('availability_slots');
        Schema::dropIfExists('services');
    }
};
