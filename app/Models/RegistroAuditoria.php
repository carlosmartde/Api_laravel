<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegistroAuditoria extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'registros_auditoria';

    protected $fillable = ['usuario_id', 'accion', 'entidad_tipo', 'entidad_id', 'descripcion', 'datos_anteriores', 'datos_nuevos', 'ip', 'user_agent'];

    protected function casts(): array
    {
        return ['datos_anteriores' => 'array', 'datos_nuevos' => 'array'];
    }
}
