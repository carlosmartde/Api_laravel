<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Incidencia extends Model
{
    protected $fillable = ['importacion_id', 'reportada_por', 'asignada_a', 'categoria', 'titulo', 'descripcion', 'severidad', 'estado', 'abierta_en', 'cerrada_en'];

    protected function casts(): array
    {
        return ['abierta_en' => 'datetime', 'cerrada_en' => 'datetime'];
    }

    public function importacion(): BelongsTo
    {
        return $this->belongsTo(Importacion::class);
    }
}
