<?php

namespace App\Models;

use Database\Factories\ImportacionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'proveedor',
        'material',
        'transportista',
        'origen',
        'puerto_destino',
        'incoterm',
        'fecha_estimada_arribo',
        'estado',
        'progreso',
        'contenedor',
        'bultos',
        'destino_planta',
        'duca',
        'factura',
        'valor_usd',
    ];

    protected function casts(): array
    {
        return [
            'fecha_estimada_arribo' => 'date:Y-m-d',
            'progreso' => 'integer',
            'valor_usd' => 'decimal:2',
        ];
    }
}
