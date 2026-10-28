<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventoSeguimiento extends Model
{
    protected $table = 'eventos_seguimiento';

    protected $fillable = ['importacion_id', 'usuario_id', 'tipo', 'estado', 'titulo', 'descripcion', 'ubicacion', 'ocurrido_en', 'metadata'];

    protected function casts(): array
    {
        return ['ocurrido_en' => 'datetime', 'metadata' => 'array'];
    }

    public function importacion(): BelongsTo
    {
        return $this->belongsTo(Importacion::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
