<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ubicacion extends Model
{
    protected $table = 'ubicaciones';

    protected $fillable = ['codigo', 'area', 'detalle', 'capacidad', 'unidad', 'activa'];

    protected function casts(): array
    {
        return ['capacidad' => 'decimal:2', 'activa' => 'boolean'];
    }

    public function importaciones(): HasMany
    {
        return $this->hasMany(Importacion::class);
    }
}
