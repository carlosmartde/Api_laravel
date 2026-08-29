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
            'proveedor' => $this->proveedor,
            'material' => $this->material,
            'transportista' => $this->transportista,
            'origen' => $this->origen,
            'puerto_destino' => $this->puerto_destino,
            'incoterm' => $this->incoterm,
            'fecha_estimada_arribo' => $this->fecha_estimada_arribo?->format('Y-m-d'),
            'estado' => $this->estado,
            'progreso' => $this->progreso,
            'contenedor' => $this->contenedor,
            'bultos' => $this->bultos,
            'destino_planta' => $this->destino_planta,
            'duca' => $this->duca,
            'factura' => $this->factura,
            'valor_usd' => $this->valor_usd,
            'creada_en' => $this->created_at?->toISOString(),
            'actualizada_en' => $this->updated_at?->toISOString(),
        ];
    }
}
