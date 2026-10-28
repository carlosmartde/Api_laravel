<?php

namespace App\Services;

use App\Models\RegistroAuditoria;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditService
{
    public static function record(
        Request $request,
        string $action,
        Model $entity,
        string $description,
        ?array $before = null,
        ?array $after = null,
    ): void {
        RegistroAuditoria::create([
            'usuario_id' => $request->user()?->id,
            'accion' => $action,
            'entidad_tipo' => $entity->getMorphClass(),
            'entidad_id' => $entity->getKey(),
            'descripcion' => $description,
            'datos_anteriores' => $before,
            'datos_nuevos' => $after,
            'ip' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 500),
        ]);
    }
}
