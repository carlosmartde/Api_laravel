<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImportacionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'bl' => $this->bl,
            'referencia' => $this->referencia,
            'proveedor_id' => $this->proveedor_id,
            'proveedor' => $this->proveedor,
            'material' => $this->material,
            'transportista' => $this->transportista,
            'origen' => $this->origen,
            'puerto_destino' => $this->puerto_destino,
            'incoterm' => $this->incoterm,
            'fecha_estimada_arribo' => $this->fecha_estimada_arribo?->format('Y-m-d'),
            'estado' => $this->estado,
            'prioridad' => $this->prioridad,
            'progreso' => $this->progreso,
            'contenedor' => $this->contenedor,
            'bultos' => $this->bultos,
            'destino_planta' => $this->destino_planta,
            'ubicacion_id' => $this->ubicacion_id,
            'responsable_id' => $this->responsable_id,
            'duca' => $this->duca,
            'estado_aduanal' => $this->estado_aduanal,
            'factura' => $this->factura,
            'valor_usd' => $this->valor_usd,
            'creada_en' => $this->created_at?->toISOString(),
            'actualizada_en' => $this->updated_at?->toISOString(),
            'ultimo_evento_en' => $this->ultimo_evento_en?->toISOString(),
            'recibida_en' => $this->recibida_en?->toISOString(),
            'documentos_count' => $this->whenCounted('documentos'),
            'tareas_pendientes_count' => $this->when(
                isset($this->tareas_pendientes_count),
                $this->tareas_pendientes_count,
            ),
            'incidencias_abiertas_count' => $this->when(
                isset($this->incidencias_abiertas_count),
                $this->incidencias_abiertas_count,
            ),
        ];
    }
}
