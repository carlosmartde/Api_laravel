<?php

namespace Database\Factories;

use App\Models\Importacion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Importacion>
 */
class ImportacionFactory extends Factory
{
    protected $model = Importacion::class;

    public function definition(): array
    {
        return [
            'bl' => fake()->unique()->bothify('????-#########'),
            'referencia' => fake()->unique()->numerify('IMP-2026-###'),
            'proveedor' => fake()->company(),
            'material' => fake()->sentence(4),
            'transportista' => fake()->company(),
            'origen' => fake()->city().', '.fake()->country(),
            'puerto_destino' => fake()->randomElement(['Puerto Santo Tomás', 'Puerto Quetzal']),
            'incoterm' => fake()->randomElement(['CIF', 'FOB', 'CIP', 'DAP', 'CFR']),
            'fecha_estimada_arribo' => fake()->dateTimeBetween('now', '+3 months')->format('Y-m-d'),
            'estado' => fake()->randomElement(Importacion::ESTADOS),
            'progreso' => fake()->numberBetween(0, 100),
            'contenedor' => fake()->bothify('???? ######-#'),
            'bultos' => fake()->numberBetween(1, 20).' bultos',
            'destino_planta' => fake()->randomElement(['Refinería', 'Utilidades', 'WTP', 'ETP', 'Tank Farm']),
            'duca' => fake()->optional()->numerify('DUCA-GT ######'),
            'factura' => fake()->optional()->bothify('INV-??-#####'),
            'valor_usd' => fake()->randomFloat(2, 1000, 500000),
        ];
    }
}
