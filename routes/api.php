<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\VideoController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\QuizAttemptController;
use App\Http\Controllers\Api\StudentPerformanceController;

// --- PUBLIC ROUTES (Logins & Public Data) ---
Route::post('/parents/login', [AuthController::class, 'loginParent']);
Route::post('/students/login', [AuthController::class, 'loginStudent']);
Route::post('/teachers/login', [AuthController::class, 'loginTeacher']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::post('/admin/login', [AuthController::class, 'loginAdmin']); // <-- Add this!

Route::get('/schools', [SchoolController::class, 'index']);
Route::get('/schools/{id}', [SchoolController::class, 'getSchool']);
Route::get('/classes/school/{schoolId}', [SchoolController::class, 'getClassesBySchool']);
Route::get('/classes/{id}', [SchoolController::class, 'getClass']);

Route::get('/quizzes', [QuizController::class, 'index']);
Route::get('/quizzes/{id}', [QuizController::class, 'show']);

// --- ADMIN / GENERIC CRUD ROUTES ---
// (We leave these mostly open right now so your Vue Admin panel can easily manage users)
Route::post('/schools/register', [SchoolController::class, 'registerSchool']);
Route::put('/schools/{id}', [SchoolController::class, 'updateSchool']);

Route::get('/teachers', [TeacherController::class, 'index']);
Route::post('/teachers/register', [TeacherController::class, 'store']);
Route::put('/teachers/{id}', [TeacherController::class, 'update']);
Route::delete('/teachers/{id}', [TeacherController::class, 'destroy']);

Route::get('/students', [StudentController::class, 'index']);
Route::post('/students/register', [StudentController::class, 'store']);
Route::put('/students/{id}', [StudentController::class, 'update']);
Route::delete('/students/{id}', [StudentController::class, 'destroy']);
Route::get('/students/profile/{id}', [StudentController::class, 'getProfile']);
Route::get('/students/profile/username/{username}', [StudentController::class, 'getProfileByUsername']);

Route::get('/parents', [ParentController::class, 'index']);
Route::post('/parents/register', [ParentController::class, 'store']);
Route::put('/parents/{id}', [ParentController::class, 'update']);
Route::delete('/parents/{id}', [ParentController::class, 'destroy']);


// --- PROTECTED APP ROUTES ---

// 1. PARENT VIP ROOM
Route::middleware('auth:parent')->group(function () {
    Route::get('/students/parent/{email}', [AuthController::class, 'getStudentsByParent']);
});

// 2. SHARED VIP ROOM (Parents, Students, AND Teachers)
Route::middleware('auth:parent,student,teacher')->group(function () {
    Route::get('/student-performance/analytics/{studentId}', [StudentPerformanceController::class, 'getAnalytics']);
    Route::get('/student-performance/all-attempts/{studentId}', [StudentPerformanceController::class, 'getAllAttempts']);
    Route::get('/student-performance/recent-activity/{studentId}', [StudentPerformanceController::class, 'getRecentActivity']);
    Route::get('/videos', [VideoController::class, 'index']);
});

// 3. STUDENT VIP ROOM
Route::middleware('auth:student')->group(function () {
    Route::post('/quiz-attempts', [QuizAttemptController::class, 'store']);
});

// 4. TEACHER VIP ROOM
Route::middleware('auth:teacher')->group(function () {
    Route::post('/videos', [VideoController::class, 'store']);
    Route::put('/videos/{id}', [VideoController::class, 'update']);
    Route::delete('/videos/{id}', [VideoController::class, 'destroy']);
    Route::get('/students/teacher-class', [StudentController::class, 'getStudentsByTeacherClass']);
});

// 5. ADMIN VIP ROOM
Route::middleware('auth:admin')->group(function () {
    // We can move your generic CRUD routes (Schools, Teachers, etc.) in here later!
});
