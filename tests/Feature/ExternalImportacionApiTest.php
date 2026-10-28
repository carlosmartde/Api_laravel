<?php

namespace Tests\Feature;

use App\Models\Importacion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExternalImportacionApiTest extends TestCase
{
    use RefreshDatabase;

    private const API_TOKEN = 'token-seguro-para-pruebas';

    private const CONSUMER_TOKEN = 'token-consumidor-para-pruebas';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'external-api.admin_token' => self::API_TOKEN,
            'external-api.consumer_token' => self::CONSUMER_TOKEN,
            'cors.allowed_origins' => ['https://cliente.example'],
        ]);
    }

    public function test_el_endpoint_de_salud_es_publico(): void
    {
        $this->getJson('/api/v1/salud')
            ->assertOk()
            ->assertJson([
                'estado' => 'ok',
                'version' => 'v1',
                'base_de_datos' => 'disponible',
            ]);
    }

    public function test_el_crud_requiere_un_token_valido(): void
    {
        $this->getJson('/api/v1/importaciones')
            ->assertUnauthorized()
            ->assertHeader('WWW-Authenticate', 'Bearer')
            ->assertJsonPath('message', 'Credenciales de API inválidas.');

        $this->withToken('token-incorrecto')
            ->getJson('/api/v1/importaciones')
            ->assertUnauthorized();
    }

    public function test_limita_las_solicitudes_por_consumidor(): void
    {
        config(['external-api.rate_limit_per_minute' => 1]);

        $this->withToken(self::API_TOKEN)
            ->getJson('/api/v1/importaciones')
            ->assertOk();

        $this->withToken(self::API_TOKEN)
            ->getJson('/api/v1/importaciones')
            ->assertTooManyRequests()
            ->assertJsonPath(
                'message',
                'Se alcanzó el límite de solicitudes. Inténtalo de nuevo más tarde.',
            );
    }

    public function test_puede_listar_y_filtrar_importaciones(): void
    {
        Importacion::factory()->create(['estado' => 'Recibida', 'proveedor' => 'ALFA LAVAL']);
        Importacion::factory()->create(['estado' => 'En tránsito', 'proveedor' => 'SIEMENS']);

        $this->withToken(self::API_TOKEN)
            ->getJson('/api/v1/importaciones?estado=Recibida&buscar=ALFA&per_page=10')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.proveedor', 'ALFA LAVAL')
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 1);
    }

    public function test_lista_contenedores_pendientes_por_fecha(): void
    {
        Importacion::factory()->create([
            'estado' => 'En tránsito',
            'fecha_estimada_arribo' => '2026-11-12',
            'contenedor' => 'CONTENEDOR-002',
        ]);
        Importacion::factory()->create([
            'estado' => 'En altamar',
            'fecha_estimada_arribo' => '2026-11-05',
            'contenedor' => 'CONTENEDOR-001',
        ]);
        Importacion::factory()->create([
            'estado' => 'Documentación',
            'fecha_estimada_arribo' => '2026-11-03',
            'contenedor' => null,
        ]);
        Importacion::factory()->create([
            'estado' => 'Proceso aduanal',
            'fecha_estimada_arribo' => '2026-11-01',
            'contenedor' => 'YA-ARRIBADO',
        ]);
        Importacion::factory()->create([
            'estado' => 'Recibida',
            'fecha_estimada_arribo' => '2026-11-02',
            'contenedor' => 'RECIBIDO',
        ]);

        $this->withToken(self::CONSUMER_TOKEN)
            ->getJson('/api/v1/importaciones?pendiente_arribo=1&con_contenedor=1&fecha_desde=2026-11-01&fecha_hasta=2026-11-30&orden_fecha=asc')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.contenedor', 'CONTENEDOR-001')
            ->assertJsonPath('data.1.contenedor', 'CONTENEDOR-002')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_token_consumidor_solo_puede_consultar_y_crear(): void
    {
        $importacion = Importacion::factory()->create();

        $this->withToken(self::CONSUMER_TOKEN)
            ->getJson("/api/v1/importaciones/{$importacion->id}")
            ->assertOk();

        $this->withToken(self::CONSUMER_TOKEN)
            ->postJson('/api/v1/importaciones', $this->datosValidos())
            ->assertCreated();

        $this->withToken(self::CONSUMER_TOKEN)
            ->patchJson("/api/v1/importaciones/{$importacion->id}", ['progreso' => 50])
            ->assertForbidden()
            ->assertJsonPath('message', 'Esta credencial solo permite consultar y registrar importaciones.');

        $this->withToken(self::CONSUMER_TOKEN)
            ->deleteJson("/api/v1/importaciones/{$importacion->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('importaciones', ['id' => $importacion->id]);
    }

    public function test_puede_crear_una_importacion(): void
    {
        $this->withToken(self::API_TOKEN)
            ->postJson('/api/v1/importaciones', $this->datosValidos())
            ->assertCreated()
            ->assertJsonPath('data.bl', 'TEST-123456789')
            ->assertJsonPath('data.progreso', 25);

        $this->assertDatabaseHas('importaciones', [
            'bl' => 'TEST-123456789',
            'proveedor' => 'Proveedor de prueba',
        ]);
    }

    public function test_rechaza_datos_invalidos(): void
    {
        $this->withToken(self::API_TOKEN)
            ->postJson('/api/v1/importaciones', [
                'bl' => '',
                'progreso' => 120,
                'estado' => 'Desconocido',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['bl', 'referencia', 'estado', 'progreso']);
    }

    public function test_puede_consultar_actualizar_y_eliminar_una_importacion(): void
    {
        $importacion = Importacion::factory()->create();

        $this->withToken(self::API_TOKEN)
            ->getJson("/api/v1/importaciones/{$importacion->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $importacion->id);

        $this->withToken(self::API_TOKEN)
            ->putJson("/api/v1/importaciones/{$importacion->id}", [
                'estado' => 'Recibida',
                'progreso' => 100,
            ])
            ->assertOk()
            ->assertJsonPath('data.estado', 'Recibida')
            ->assertJsonPath('data.progreso', 100);

        $this->withToken(self::API_TOKEN)
            ->deleteJson("/api/v1/importaciones/{$importacion->id}")
            ->assertOk()
            ->assertJsonPath('mensaje', 'Importación eliminada correctamente.');

        $this->assertDatabaseMissing('importaciones', ['id' => $importacion->id]);
    }

    public function test_responde_a_preflight_cors_para_un_origen_permitido(): void
    {
        $this->call('OPTIONS', '/api/v1/importaciones', [], [], [], [
            'HTTP_ORIGIN' => 'https://cliente.example',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'authorization, content-type',
        ])
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'https://cliente.example');
    }

    private function datosValidos(): array
    {
        return [
            'bl' => 'TEST-123456789',
            'referencia' => 'IMP-TEST-001',
            'proveedor' => 'Proveedor de prueba',
            'material' => 'Repuestos industriales',
            'transportista' => 'Naviera de prueba',
            'origen' => 'Hamburgo, Alemania',
            'puerto_destino' => 'Puerto Santo Tomás',
            'incoterm' => 'CIF Puerto Santo Tomás',
            'fecha_estimada_arribo' => '2026-09-15',
            'estado' => 'En tránsito',
            'progreso' => 25,
            'contenedor' => 'TEST 123456-7',
            'valor_usd' => 12500.50,
        ];
    }
}
