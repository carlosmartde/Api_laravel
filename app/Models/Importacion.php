<?php

namespace App\Models;

use Database\Factories\ImportacionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Importacion extends Model
{
    /** @use HasFactory<ImportacionFactory> */
    use HasFactory;

    public const ESTADOS = [
        'Documentación',
        'En tránsito',
        'En altamar',
        'Proceso aduanal',
        'Recibida',
    ];

    public const ESTADOS_PENDIENTES_ARRIBO = [
        'Documentación',
        'En tránsito',
        'En altamar',
    ];

    protected $table = 'importaciones';

    protected $fillable = [
        'bl',
        'referencia',
        'proveedor_id',
        'proveedor',
        'material',
        'transportista',
        'origen',
        'puerto_destino',
        'incoterm',
        'fecha_estimada_arribo',
        'estado',
        'prioridad',
        'progreso',
        'contenedor',
        'bultos',
        'destino_planta',
        'ubicacion_id',
        'responsable_id',
        'duca',
        'estado_aduanal',
        'ultimo_evento_en',
        'recibida_en',
        'factura',
        'valor_usd',
    ];

    protected function casts(): array
    {
        return [
            'fecha_estimada_arribo' => 'date:Y-m-d',
            'progreso' => 'integer',
            'valor_usd' => 'decimal:2',
            'ultimo_evento_en' => 'datetime',
            'recibida_en' => 'datetime',
        ];
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(EventoSeguimiento::class)->latest('ocurrido_en');
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(DocumentoImportacion::class);
    }

    public function tareas(): HasMany
    {
        return $this->hasMany(TareaOperativa::class);
    }

    public function recepciones(): HasMany
    {
        return $this->hasMany(Recepcion::class);
    }

    public function incidencias(): HasMany
    {
        return $this->hasMany(Incidencia::class);
    }

    public function proveedorCatalogo(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class);
    }
}
