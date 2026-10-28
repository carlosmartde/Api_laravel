<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proveedores', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre', 150)->unique();
            $table->string('categoria', 120)->nullable();
            $table->string('pais', 80)->nullable();
            $table->string('contacto', 120)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('telefono', 50)->nullable();
            $table->string('estado', 20)->default('Activo')->index();
            $table->decimal('calificacion', 3, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('ubicaciones', function (Blueprint $table): void {
            $table->id();
            $table->string('codigo', 40)->unique();
            $table->string('area', 120);
            $table->string('detalle', 200)->nullable();
            $table->decimal('capacidad', 14, 2)->nullable();
            $table->string('unidad', 30)->nullable();
            $table->boolean('activa')->default(true)->index();
            $table->timestamps();
        });

        Schema::table('importaciones', function (Blueprint $table): void {
            $table->foreignId('proveedor_id')->nullable()->after('referencia')->constrained('proveedores')->nullOnDelete();
            $table->foreignId('ubicacion_id')->nullable()->after('destino_planta')->constrained('ubicaciones')->nullOnDelete();
            $table->foreignId('responsable_id')->nullable()->after('ubicacion_id')->constrained('users')->nullOnDelete();
            $table->string('prioridad', 20)->default('Media')->after('estado')->index();
            $table->string('estado_aduanal', 50)->nullable()->after('duca')->index();
            $table->timestamp('ultimo_evento_en')->nullable()->after('estado_aduanal');
            $table->timestamp('recibida_en')->nullable()->after('ultimo_evento_en');
        });

        Schema::create('eventos_seguimiento', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('importacion_id')->constrained('importaciones')->cascadeOnDelete();
            $table->foreignId('usuario_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('tipo', 40)->default('Actualización');
            $table->string('estado', 50)->nullable();
            $table->string('titulo', 160);
            $table->text('descripcion')->nullable();
            $table->string('ubicacion', 160)->nullable();
            $table->timestamp('ocurrido_en');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['importacion_id', 'ocurrido_en']);
        });

        Schema::create('documentos_importacion', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('importacion_id')->constrained('importaciones')->cascadeOnDelete();
            $table->foreignId('subido_por')->nullable()->constrained('users')->nullOnDelete();
            $table->string('tipo', 80);
            $table->string('nombre_original');
            $table->string('version', 40)->default('1.0');
            $table->string('estado', 30)->default('Pendiente')->index();
            $table->string('ruta');
            $table->string('mime', 120)->nullable();
            $table->unsignedBigInteger('tamano')->default(0);
            $table->timestamp('vence_en')->nullable();
            $table->timestamps();
            $table->index(['importacion_id', 'tipo']);
        });

        Schema::create('tareas_operativas', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('importacion_id')->nullable()->constrained('importaciones')->cascadeOnDelete();
            $table->foreignId('asignada_a')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('creada_por')->nullable()->constrained('users')->nullOnDelete();
            $table->string('titulo', 180);
            $table->text('descripcion')->nullable();
            $table->string('prioridad', 20)->default('Media')->index();
            $table->string('estado', 30)->default('Pendiente')->index();
            $table->timestamp('vence_en')->nullable()->index();
            $table->timestamp('completada_en')->nullable();
            $table->timestamps();
        });

        Schema::create('recepciones', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('importacion_id')->constrained('importaciones')->cascadeOnDelete();
            $table->foreignId('recibida_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('recibida_en');
            $table->unsignedInteger('bultos_esperados')->nullable();
            $table->unsignedInteger('bultos_recibidos')->nullable();
            $table->string('condicion', 30)->default('Conforme')->index();
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });

        Schema::create('incidencias', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('importacion_id')->constrained('importaciones')->cascadeOnDelete();
            $table->foreignId('reportada_por')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('asignada_a')->nullable()->constrained('users')->nullOnDelete();
            $table->string('categoria', 60);
            $table->string('titulo', 180);
            $table->text('descripcion');
            $table->string('severidad', 20)->default('Media')->index();
            $table->string('estado', 30)->default('Abierta')->index();
            $table->timestamp('abierta_en');
            $table->timestamp('cerrada_en')->nullable();
            $table->timestamps();
            $table->index(['importacion_id', 'estado']);
        });

        Schema::create('registros_auditoria', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('usuario_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('accion', 40)->index();
            $table->string('entidad_tipo', 100)->index();
            $table->unsignedBigInteger('entidad_id')->nullable()->index();
            $table->string('descripcion', 255);
            $table->json('datos_anteriores')->nullable();
            $table->json('datos_nuevos')->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registros_auditoria');
        Schema::dropIfExists('incidencias');
        Schema::dropIfExists('recepciones');
        Schema::dropIfExists('tareas_operativas');
        Schema::dropIfExists('documentos_importacion');
        Schema::dropIfExists('eventos_seguimiento');

        Schema::table('importaciones', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('proveedor_id');
            $table->dropConstrainedForeignId('ubicacion_id');
            $table->dropConstrainedForeignId('responsable_id');
            $table->dropColumn(['prioridad', 'estado_aduanal', 'ultimo_evento_en', 'recibida_en']);
        });

        Schema::dropIfExists('ubicaciones');
        Schema::dropIfExists('proveedores');
    }
};
