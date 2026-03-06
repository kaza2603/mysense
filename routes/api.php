<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

// --- PUBLIC ROUTES (No login required) ---
Route::post('/parents/login', [AuthController::class, 'loginParent']);
Route::post('/students/login', [AuthController::class, 'loginStudent']);
Route::post('/teachers/login', [AuthController::class, 'loginTeacher']);
// Everyone should be able to trigger a logout, so we leave it public
Route::post('/logout', [AuthController::class, 'logout']);

// Fetching Schools and Classes
Route::get('/schools', [App\Http\Controllers\Api\SchoolController::class, 'index']);
Route::get('/schools/{id}', [App\Http\Controllers\Api\SchoolController::class, 'getSchool']);
Route::get('/classes/school/{schoolId}', [App\Http\Controllers\Api\SchoolController::class, 'getClassesBySchool']);
Route::get('/classes/{id}', [App\Http\Controllers\Api\SchoolController::class, 'getClass']);

// NEW: Fetching Quizzes
Route::get('/quizzes', [App\Http\Controllers\Api\QuizController::class, 'index']);
Route::get('/quizzes/{id}', [App\Http\Controllers\Api\QuizController::class, 'show']);



// --- PROTECTED ROUTES (Must be logged in) ---

// 1. PARENT VIP ROOM
Route::middleware('auth:parent')->group(function () {
    Route::get('/students/parent/{email}', [AuthController::class, 'getStudentsByParent']);
});

// 2. SHARED VIP ROOM (Parents, Students, AND Teachers)
Route::middleware('auth:parent,student,teacher')->group(function () {
    Route::get('/student-performance/analytics/{studentId}', [App\Http\Controllers\Api\StudentPerformanceController::class, 'getAnalytics']);
    Route::get('/student-performance/all-attempts/{studentId}', [App\Http\Controllers\Api\StudentPerformanceController::class, 'getAllAttempts']);
    Route::get('/student-performance/recent-activity/{studentId}', [App\Http\Controllers\Api\StudentPerformanceController::class, 'getRecentActivity']);

    // --- NEW: View Videos ---
    Route::get('/videos', [App\Http\Controllers\Api\VideoController::class, 'index']);
});

// 3. STUDENT VIP ROOM
Route::middleware('auth:student')->group(function () {
    Route::post('/quiz-attempts', [App\Http\Controllers\Api\QuizAttemptController::class, 'store']);
});

// 4. TEACHER VIP ROOM
Route::middleware('auth:teacher')->group(function () {
    // --- NEW: Manage Videos ---
    Route::post('/videos', [App\Http\Controllers\Api\VideoController::class, 'store']);
    Route::put('/videos/{id}', [App\Http\Controllers\Api\VideoController::class, 'update']);
    Route::delete('/videos/{id}', [App\Http\Controllers\Api\VideoController::class, 'destroy']);
});
