<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';

use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Http\Request;

// Get kernel
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);

// Create authenticated request
$request = Request::create('/dashboard', 'GET');

// Manually authenticate as user 2 (tenant 3 owner)
$user = User::find(2);
echo "User: " . $user->email . " | Tenant: " . $user->tenant_id . "\n";

// Set auth in request
$request->setUserResolver(function() use ($user) {
    return $user;
});

// Check subscription
$sub = $user->tenant->subscription;
echo "Subscription status: " . $sub->status . " | Trial ends: " . $sub->trial_ends_at . "\n";

// Get route
$router = $app->make('router');
$route = $router->getRoutes()->match($request);
echo "Route name: " . $route->getName() . "\n";

// Simulate middleware execution
$middleware = new \App\Http\Middleware\SubscriptionAccessMiddleware();
try {
    $response = $middleware->handle($request, function() {
        return new \Illuminate\Http\Response('dashboard content');
    });
    echo "Middleware response status: " . $response->status() . "\n";
    if ($response->status() === 302) {
        echo "Redirect to: " . $response->headers->get('location') . "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
