<?php

namespace App\Http\Requests;

use App\Models\Importacion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GuardarImportacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $importacion = $this->route('importacion');
        $esActualizacion = $importacion instanceof Importacion;
        $presencia = $esActualizacion ? 'sometimes' : 'required';

        return [
            'bl' => [$presencia, 'string', 'max:50', Rule::unique('importaciones', 'bl')->ignore($importacion)],
            'referencia' => [$presencia, 'string', 'max:50', Rule::unique('importaciones', 'referencia')->ignore($importacion)],
            'proveedor' => [$presencia, 'string', 'max:150'],
            'material' => [$presencia, 'string', 'max:255'],
            'transportista' => [$presencia, 'string', 'max:150'],
            'origen' => [$presencia, 'string', 'max:150'],
            'puerto_destino' => [$presencia, 'string', 'max:150'],
            'incoterm' => [$presencia, 'string', 'max:100'],
            'fecha_estimada_arribo' => [$presencia, 'date_format:Y-m-d'],
            'estado' => [$presencia, 'string', Rule::in(Importacion::ESTADOS)],
            'progreso' => [$presencia, 'integer', 'between:0,100'],
            'contenedor' => ['sometimes', 'nullable', 'string', 'max:100'],
            'bultos' => ['sometimes', 'nullable', 'string', 'max:150'],
            'destino_planta' => ['sometimes', 'nullable', 'string', 'max:200'],
            'duca' => ['sometimes', 'nullable', 'string', 'max:150'],
            'factura' => ['sometimes', 'nullable', 'string', 'max:100'],
            'valor_usd' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:999999999999.99'],
        ];
    }

    public function messages(): array
    {
        return [
            'required' => 'El campo :attribute es obligatorio.',
            'unique' => 'El valor del campo :attribute ya está registrado.',
            'fecha_estimada_arribo.date_format' => 'La fecha estimada de arribo debe usar el formato AAAA-MM-DD.',
            'estado.in' => 'El estado seleccionado no es válido.',
            'progreso.between' => 'El progreso debe estar entre 0 y 100.',
        ];
    }
}
