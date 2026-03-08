<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuizAttempt;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class StudentPerformanceController extends Controller
{
    // SMART RESOLVER: Converts a username into their actual database UUID
    private function resolveStudentId($id)
    {
        if (Str::isUuid($id)) {
            return $id;
        }
        $student = Student::where('student_username', $id)->first();
        return $student ? $student->user_id : $id;
    }

    public function getAllAttempts($studentId)
    {
        $realId = $this->resolveStudentId($studentId);

        $attempts = QuizAttempt::with('quizzes')
            ->where('student_id', $realId)
            ->orderBy('completed_at', 'desc')
            ->get();

        return response()->json(['attempts' => $attempts]);
    }

    public function getRecentActivity(Request $request, $studentId)
    {
        $realId = $this->resolveStudentId($studentId);
        $limit = $request->query('limit', 10);

        $attempts = QuizAttempt::with('quizzes')
            ->where('student_id', $realId)
            ->orderBy('completed_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json(['recentActivity' => $attempts]);
    }

    public function getAnalytics($studentId)
    {
        $realId = $this->resolveStudentId($studentId);

        $attempts = QuizAttempt::with('quizzes')->where('student_id', $realId)->get();

        $totalQuizzes = $attempts->count();
        $averageScore = $totalQuizzes > 0 ? $attempts->avg('score') : 0;

        $progress = [];
        $groupedByUnit = $attempts->groupBy(function($attempt) {
            return $attempt->quizzes ? $attempt->quizzes->quiz_unit : 'Unknown';
        });

        foreach ($groupedByUnit as $unitString => $unitAttempts) {
            $unitNumber = (int) filter_var($unitString, FILTER_SANITIZE_NUMBER_INT);
            if ($unitNumber === 0) $unitNumber = $unitString;

            $progress[] = [
                'unit' => $unitNumber,
                'completedQuizzes' => $unitAttempts->count(),
                'averageScore' => round($unitAttempts->avg('score')),
                'progressPercentage' => 100,
                'lastActivity' => $unitAttempts->max('completed_at')
            ];
        }

        $weeklyActivity = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');

            $dayAttempts = $attempts->filter(function($attempt) use ($date) {
                return Carbon::parse($attempt->completed_at)->format('Y-m-d') === $date;
            });

            $weeklyActivity[] = [
                'day' => Carbon::now()->subDays($i)->format('D'),
                'date' => $date,
                'timeSpent' => $dayAttempts->count() * 15,
                'activitiesCompleted' => $dayAttempts->count(),
                'topicsStudied' => $dayAttempts->groupBy(function($a) {
                    return $a->quizzes->quiz_unit ?? 'Unknown';
                })->count()
            ];
        }

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
