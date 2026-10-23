<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('external-api', function (Request $request): Limit {
            return Limit::perMinute(
                max(1, (int) config('external-api.rate_limit_per_minute', 60)),
            )->by((string) $request->ip())->response(fn (Request $request, array $headers) => response()->json([
                'message' => 'Se alcanzó el límite de solicitudes. Inténtalo de nuevo más tarde.',
            ], 429, $headers));
        });
    }
}
