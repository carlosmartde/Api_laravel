<?php

namespace Tests\Feature;

use App\Models\Importacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Passport;
use Tests\TestCase;

class ImportacionApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Passport::actingAs(
            User::factory()->create(['role' => 'admin']),
            ['admin'],
        );
    }

    public function test_puede_listar_y_filtrar_importaciones(): void
    {
        Importacion::factory()->create(['estado' => 'Recibida', 'proveedor' => 'ALFA LAVAL']);
        Importacion::factory()->create(['estado' => 'En tránsito', 'proveedor' => 'SIEMENS']);

        $this->getJson('/api/importaciones?estado=Recibida&buscar=ALFA')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.proveedor', 'ALFA LAVAL');
    }

    public function test_el_crud_requiere_autenticacion(): void
    {
        auth('api')->forgetUser();

        $this->getJson('/api/importaciones')->assertUnauthorized();
    }

    public function test_login_devuelve_usuario_y_permisos_segun_su_rol(): void
    {
        $cliente = app(ClientRepository::class)
            ->createPasswordGrantClient('Cliente web de pruebas', 'users', true);

        config([
            'services.passport.password_client_id' => $cliente->id,
            'services.passport.password_client_secret' => $cliente->plainSecret,
        ]);

        $usuario = User::factory()->create([
            'email' => 'operador@refineryimport.test',
            'password' => Hash::make('Refinery2026!'),
            'role' => 'operador',
        ]);

        $respuesta = $this->postJson('/api/login', [
            'email' => $usuario->email,
            'password' => 'Refinery2026!',
        ]);

        $respuesta
            ->assertOk()
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonPath('user.role', 'operador')
            ->assertJsonPath('user.email', $usuario->email)
            ->assertJsonPath('user.permissions.0', 'importaciones.read')
            ->assertJsonPath('user.permissions.1', 'importaciones.write')
            ->assertJsonStructure(['access_token', 'refresh_token', 'expires_in']);

        auth('api')->forgetUser();

        $this->withToken($respuesta->json('access_token'))
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.email', $usuario->email);
    }

    public function test_login_rechaza_credenciales_incorrectas(): void
    {
        User::factory()->create([
            'email' => 'lector@refineryimport.test',
            'password' => Hash::make('ClaveCorrecta!'),
        ]);

        $this->postJson('/api/login', [
            'email' => 'lector@refineryimport.test',
            'password' => 'ClaveIncorrecta!',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'El correo o la contraseña no son correctos.');
    }

    public function test_puede_crear_una_importacion(): void
    {
        $this->postJson('/api/importaciones', $this->datosValidos())
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
        $this->postJson('/api/importaciones', [
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

        $this->getJson("/api/importaciones/{$importacion->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $importacion->id);

        $this->putJson("/api/importaciones/{$importacion->id}", [
            'estado' => 'Recibida',
            'progreso' => 100,
        ])
            ->assertOk()
            ->assertJsonPath('data.estado', 'Recibida')
            ->assertJsonPath('data.progreso', 100);

        $this->deleteJson("/api/importaciones/{$importacion->id}")
            ->assertOk()
            ->assertJsonPath('mensaje', 'Importación eliminada correctamente.');

        $this->assertDatabaseMissing('importaciones', ['id' => $importacion->id]);
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
