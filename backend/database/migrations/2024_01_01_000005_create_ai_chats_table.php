<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_chats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('session_id');
            $table->enum('role', ['user', 'assistant']);
            $table->text('message');
            $table->string('context_type')->nullable(); // 'product', 'builder', 'compatibility', 'general'
            $table->unsignedBigInteger('context_id')->nullable(); // product_id if context is product
            $table->timestamps();
            $table->index('session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_chats');
    }
};
