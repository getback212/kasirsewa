<?php

use App\Models\User;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);

// Simulate request
$request = Request::create('/dashboard', 'GET');
$request->setUserResolver(function () {
    return User::find(2); // tenant 3 owner
});

$response = $kernel->handle($request);
echo 'Status: '.$response->status()."\n";
echo 'Headers: '.json_encode($response->headers->all())."\n";
echo 'Content preview: '.substr($response->getContent(), 0, 200)."\n";
