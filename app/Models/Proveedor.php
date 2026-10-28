<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proveedor extends Model
{
    protected $table = 'proveedores';

    protected $fillable = ['nombre', 'categoria', 'pais', 'contacto', 'email', 'telefono', 'estado', 'calificacion'];

    protected function casts(): array
    {
        return ['calificacion' => 'decimal:2'];
    }

    public function importaciones(): HasMany
    {
        return $this->hasMany(Importacion::class);
    }
}
