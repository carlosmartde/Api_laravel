<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Recepcion extends Model
{
    protected $table = 'recepciones';

    protected $fillable = ['importacion_id', 'recibida_por', 'recibida_en', 'bultos_esperados', 'bultos_recibidos', 'condicion', 'observaciones'];

    protected function casts(): array
    {
        return ['recibida_en' => 'datetime'];
    }

    public function importacion(): BelongsTo
    {
        return $this->belongsTo(Importacion::class);
    }
}
