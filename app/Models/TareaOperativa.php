<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TareaOperativa extends Model
{
    protected $table = 'tareas_operativas';

    protected $fillable = ['importacion_id', 'asignada_a', 'creada_por', 'titulo', 'descripcion', 'prioridad', 'estado', 'vence_en', 'completada_en'];

    protected function casts(): array
    {
        return ['vence_en' => 'datetime', 'completada_en' => 'datetime'];
    }

    public function importacion(): BelongsTo
    {
        return $this->belongsTo(Importacion::class);
    }
}
