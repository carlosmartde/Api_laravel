<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('importaciones', function (Blueprint $table): void {
            $table->id();
            $table->string('bl', 50)->unique();
            $table->string('referencia', 50)->unique();
            $table->string('proveedor', 150);
            $table->string('material');
            $table->string('transportista', 150);
            $table->string('origen', 150);
            $table->string('puerto_destino', 150);
            $table->string('incoterm', 100);
            $table->date('fecha_estimada_arribo');
            $table->string('estado', 50);
            $table->unsignedTinyInteger('progreso')->default(0);
            $table->string('contenedor', 100)->nullable();
            $table->string('bultos', 150)->nullable();
            $table->string('destino_planta', 200)->nullable();
            $table->string('duca', 150)->nullable();
            $table->string('factura', 100)->nullable();
            $table->decimal('valor_usd', 14, 2)->nullable();
            $table->timestamps();

            $table->index('estado');
            $table->index('proveedor');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('importaciones');
    }
};
