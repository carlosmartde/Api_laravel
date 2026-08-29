<?php

namespace Database\Seeders;

use App\Models\Importacion;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->firstOrCreate(
            ['email' => 'admin@refineryimport.test'],
            [
                'name' => 'Administrador de Refinería',
                'password' => Hash::make('Refinery2026!'),
                'email_verified_at' => now(),
            ],
        );

        $importaciones = [
            [
                'bl' => 'MAEU-254781963',
                'referencia' => 'IMP-2026-018',
                'proveedor' => 'ALFA LAVAL',
                'material' => 'Separador centrífugo y repuestos',
                'transportista' => 'Maersk Line',
                'origen' => 'Gotemburgo, Suecia',
                'puerto_destino' => 'Puerto Santo Tomás',
                'incoterm' => 'CIF Puerto Santo Tomás',
                'fecha_estimada_arribo' => '2026-07-28',
                'estado' => 'En tránsito',
                'progreso' => 72,
                'contenedor' => 'MSKU 784210-5',
                'bultos' => '8 cajas / 4,260 kg',
                'destino_planta' => 'Edificio de Refinería · Almacén técnico',
                'duca' => 'DUCA-GT 158421 · Rect. 01',
                'factura' => 'INV-SE-10482',
                'valor_usd' => 286450,
            ],
            [
                'bl' => 'ONEY-468201756',
                'referencia' => 'IMP-2026-021',
                'proveedor' => 'KBK CHEM-ENGINEERING',
                'material' => 'Sistema de blanqueo y tubería',
                'transportista' => 'Ocean Network Express',
                'origen' => 'Mumbai, India',
                'puerto_destino' => 'Puerto Quetzal',
                'incoterm' => 'FOB Nhava Sheva',
                'fecha_estimada_arribo' => '2026-08-05',
                'estado' => 'En altamar',
                'progreso' => 44,
                'contenedor' => 'ONEU 321954-2',
                'bultos' => '12 bultos / 18,740 kg',
                'destino_planta' => 'Edificio de Refinería · Patio de montaje',
                'duca' => 'Pendiente de transmisión',
                'factura' => 'KBK-EXP-7781',
                'valor_usd' => 412800,
            ],
            [
                'bl' => 'HLCU-903184725',
                'referencia' => 'IMP-2026-009',
                'proveedor' => 'SIEMENS',
                'material' => 'Variadores y tableros eléctricos',
                'transportista' => 'Hapag-Lloyd',
                'origen' => 'Hamburgo, Alemania',
                'puerto_destino' => 'Puerto Santo Tomás',
                'incoterm' => 'DAP Refinería',
                'fecha_estimada_arribo' => '2026-07-20',
                'estado' => 'Proceso aduanal',
                'progreso' => 88,
                'contenedor' => 'HLXU 551020-8',
                'bultos' => '6 pallets / 2,930 kg',
                'destino_planta' => 'Edificio de Utilidades · Bodega eléctrica',
                'duca' => 'DUCA-GT 157902 · Rect. 02',
                'factura' => 'DE-INV-88310',
                'valor_usd' => 134920,
            ],
            [
                'bl' => 'CMDU-715908342',
                'referencia' => 'IMP-2026-004',
                'proveedor' => 'VEOLIA WATER TECHNOLOGIES',
                'material' => 'Bombas y membranas para WTP',
                'transportista' => 'CMA CGM',
                'origen' => 'Rotterdam, Países Bajos',
                'puerto_destino' => 'Puerto Santo Tomás',
                'incoterm' => 'CIP Refinería',
                'fecha_estimada_arribo' => '2026-07-18',
                'estado' => 'Recibida',
                'progreso' => 100,
                'contenedor' => 'CMAU 440875-1',
                'bultos' => '10 cajas / 6,120 kg',
                'destino_planta' => 'WTP · Bodega de repuestos',
                'duca' => 'DUCA-GT 156734 · Definitiva',
                'factura' => 'VWT-2026-3190',
                'valor_usd' => 98600,
            ],
            [
                'bl' => 'MEDU-662140389',
                'referencia' => 'IMP-2026-023',
                'proveedor' => 'PALM TRADING PTE.',
                'material' => 'Aceite crudo de palma (CPO)',
                'transportista' => 'MSC',
                'origen' => 'Cartagena, Colombia',
                'puerto_destino' => 'Terminal marítima',
                'incoterm' => 'CFR Terminal marítima',
                'fecha_estimada_arribo' => '2026-08-12',
                'estado' => 'Documentación',
                'progreso' => 18,
                'contenedor' => 'Carga a granel · Lote CPO-2608',
                'bultos' => '4,850 toneladas métricas',
                'destino_planta' => 'Tank Farm · Tanque CPO-01',
                'duca' => 'En preparación',
                'factura' => 'CPO-260812',
                'valor_usd' => 4520000,
            ],
        ];

        foreach ($importaciones as $importacion) {
            Importacion::query()->updateOrCreate(
                ['bl' => $importacion['bl']],
                $importacion,
            );
        }
    }
}
