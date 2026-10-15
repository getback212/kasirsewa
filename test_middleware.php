<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);

// Simulate request
$request = \Illuminate\Http\Request::create('/dashboard', 'GET');
$request->setUserResolver(function() {
    return \App\Models\User::find(2); // tenant 3 owner
});

$response = $kernel->handle($request);
echo "Status: " . $response->status() . "\n";
echo "Headers: " . json_encode($response->headers->all()) . "\n";
echo "Content preview: " . substr($response->getContent(), 0, 200) . "\n";
