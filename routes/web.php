<?php
use Illuminate\Support\Facades\Route;

// This route catches EVERYTHING and sends it to your Vue app
Route::get('/{any}', function () {
    return view('app'); // Notice we are loading 'app' instead of 'welcome'
})->where('any', '.*');
