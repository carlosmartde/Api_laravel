<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentoImportacion extends Model
{
    protected $table = 'documentos_importacion';

    protected $fillable = ['importacion_id', 'subido_por', 'tipo', 'nombre_original', 'version', 'estado', 'ruta', 'mime', 'tamano', 'vence_en'];

    protected function casts(): array
    {
        return ['vence_en' => 'datetime', 'tamano' => 'integer'];
    }

    public function importacion(): BelongsTo
    {
        return $this->belongsTo(Importacion::class);
    }
}
