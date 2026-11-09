<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_number')->unique();

            // Reporter info
            $table->string('reporter_name');
            $table->enum('reporter_gender', ['laki-laki', 'perempuan'])->nullable();
            $table->integer('reporter_age')->nullable();
            $table->string('reporter_occupation')->nullable();

            // Case info
            $table->foreignId('category_id')->constrained();
            $table->foreignId('subcategory_id')->constrained();
            $table->decimal('material_loss', 15, 2)->default(0);
            $table->date('incident_date');
            $table->date('report_date');
            $table->text('description')->nullable();
            $table->enum('status', ['laporan_masuk', 'dalam_penyelidikan', 'dalam_penyidikan', 'p21', 'sp3', 'selesai'])->default('laporan_masuk');

            // Officer
            $table->foreignId('officer_id')->nullable()->constrained('users');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cases');
    }
};
