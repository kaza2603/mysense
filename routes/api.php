<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

// --- PUBLIC ROUTES (No login required) ---
Route::post('/parents/login', [AuthController::class, 'loginParent']);
Route::post('/students/login', [AuthController::class, 'loginStudent']);
Route::post('/teachers/login', [AuthController::class, 'loginTeacher']);
// Fetching Schools and Classes
Route::get('/schools', [App\Http\Controllers\Api\SchoolController::class, 'index']);
Route::get('/schools/{id}', [App\Http\Controllers\Api\SchoolController::class, 'getSchool']);
Route::get('/classes/school/{schoolId}', [App\Http\Controllers\Api\SchoolController::class, 'getClassesBySchool']);
Route::get('/classes/{id}', [App\Http\Controllers\Api\SchoolController::class, 'getClass']);
// Everyone should be able to trigger a logout, so we leave it public
Route::post('/logout', [AuthController::class, 'logout']);


// --- PROTECTED ROUTES (Must be logged in) ---

// 1. PARENT VIP ROOM (Only logged-in parents allowed in here!)
Route::middleware('auth:parent')->group(function () {

    // Fetching the children
    Route::get('/students/parent/{email}', [AuthController::class, 'getStudentsByParent']);

    // --- NEW: Student Performance Routes ---
    Route::get('/student-performance/analytics/{studentId}', [App\Http\Controllers\Api\StudentPerformanceController::class, 'getAnalytics']);
    Route::get('/student-performance/all-attempts/{studentId}', [App\Http\Controllers\Api\StudentPerformanceController::class, 'getAllAttempts']);
    Route::get('/student-performance/recent-activity/{studentId}', [App\Http\Controllers\Api\StudentPerformanceController::class, 'getRecentActivity']);

});

// 2. STUDENT VIP ROOM
Route::middleware('auth:student')->group(function () {
    // Future student routes will go here!
});

// 3. TEACHER VIP ROOM
Route::middleware('auth:teacher')->group(function () {
    // Future teacher routes will go here!
});
