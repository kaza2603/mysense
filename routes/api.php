<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

// --- AUTHENTICATION ROUTES ---
// Notice how these perfectly match the URLs your auth.js is trying to use!
Route::post('/parents/login', [AuthController::class, 'loginParent']);
Route::post('/students/login', [AuthController::class, 'loginStudent']);
Route::post('/teachers/login', [AuthController::class, 'loginTeacher']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// A test route to make sure the API is alive
Route::get('/ping', function () {
    return response()->json(['message' => 'Laravel API is alive and kicking!']);
});
// Fetch students belonging to a specific parent email
Route::get('/students/parent/{email}', [AuthController::class, 'getStudentsByParent']);
