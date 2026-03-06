<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Carbon\Carbon; // We use this for handling dates

class StudentPerformanceController extends Controller
{
    // 1. Fetch all attempts (Used in the full history table)
    public function getAllAttempts($studentId)
    {
        $attempts = QuizAttempt::with('quizzes')
            ->where('student_id', $studentId)
            ->orderBy('completed_at', 'desc')
            ->get();

        return response()->json(['attempts' => $attempts]);
    }

    // 2. Fetch recent activity
    public function getRecentActivity(Request $request, $studentId)
    {
        $limit = $request->query('limit', 10);
        $attempts = QuizAttempt::with('quizzes')
            ->where('student_id', $studentId)
            ->orderBy('completed_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json(['recentActivity' => $attempts]);
    }

    // 3. The main Analytics Dashboard endpoint
    public function getAnalytics($studentId)
    {
        // Get all attempts and include the Quiz details
        $attempts = QuizAttempt::with('quizzes')->where('student_id', $studentId)->get();

        $totalQuizzes = $attempts->count();
        $averageScore = $totalQuizzes > 0 ? $attempts->avg('score') : 0;

        // --- CALCULATE TOPIC PROGRESS ---
        $progress = [];
        // Group the attempts by the Quiz Unit (e.g., "Unit 1", "Unit 2")
        $groupedByUnit = $attempts->groupBy(function($attempt) {
            return $attempt->quizzes ? $attempt->quizzes->quiz_unit : 'Unknown';
        });

        foreach ($groupedByUnit as $unitString => $unitAttempts) {
            // Your DB says "Unit 1", but Vue expects the number "1". We extract it here:
            $unitNumber = (int) filter_var($unitString, FILTER_SANITIZE_NUMBER_INT);
            if ($unitNumber === 0) $unitNumber = $unitString; // Fallback

            $progress[] = [
                'unit' => $unitNumber,
                'completedQuizzes' => $unitAttempts->count(),
                'averageScore' => round($unitAttempts->avg('score')),
                'progressPercentage' => 100, // Simplification for now
                'lastActivity' => $unitAttempts->max('completed_at')
            ];
        }

        // --- CALCULATE WEEKLY ACTIVITY (Last 7 Days) ---
        $weeklyActivity = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');

            // Find quizzes taken on this specific day
            $dayAttempts = $attempts->filter(function($attempt) use ($date) {
                return Carbon::parse($attempt->completed_at)->format('Y-m-d') === $date;
            });

            $weeklyActivity[] = [
                'day' => Carbon::now()->subDays($i)->format('D'), // e.g., "Mon", "Tue"
                'date' => $date,
                'timeSpent' => $dayAttempts->count() * 15, // Estimate 15 mins per quiz
                'activitiesCompleted' => $dayAttempts->count(),
                'topicsStudied' => $dayAttempts->groupBy(function($a) {
                    return $a->quizzes->quiz_unit ?? 'Unknown';
                })->count()
            ];
        }

        // Return the perfectly formatted JSON that Vue expects!
        return response()->json([
            'summary' => [
                'totalQuizzes' => $totalQuizzes,
                'averageScore' => round($averageScore),
                'averageCompletionTime' => 15,
                'preferredLearningStyle' => 'Visual'
            ],
            'progress' => array_values($progress),
            'learningStyle' => [
                'visual' => ['percentage' => 60],
                'kinestetik' => ['percentage' => 30],
                'auditori' => ['percentage' => 10],
                'recommendation' => 'Pelajar menunjukkan prestasi yang sangat baik dalam visual.'
            ],
            'weeklyActivity' => $weeklyActivity,
            'recentActivity' => $attempts->sortByDesc('completed_at')->take(5)->values()
        ]);
    }
}
