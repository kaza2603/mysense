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
    // ─────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────

    /**
     * Converts a username OR UUID into the actual database UUID.
     */
    private function resolveStudentId(string $id): string
    {
        if (Str::isUuid($id)) {
            return $id;
        }
        $student = Student::where('student_username', $id)->first();
        return $student ? $student->user_id : $id;
    }

    /**
     * Returns the Malay name for a given day-of-week index (0 = Sunday).
     */
    private function getMalayDayName(int $dayOfWeek): string
    {
        return ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'][$dayOfWeek];
    }

    /**
     * Calculates the average completion time (in minutes) from a collection of attempts.
     * Returns 0 if no attempt has both started_at and completed_at.
     */
    private function calcAverageCompletionTime($attempts): float
    {
        $times = $attempts
            ->filter(fn($a) => $a->started_at && $a->completed_at)
            ->map(function ($a) {
                $start = Carbon::parse($a->started_at);
                $end   = Carbon::parse($a->completed_at);
                return $end->diffInSeconds($start) / 60; // minutes
            });

        return $times->count() > 0
            ? round($times->avg(), 2)
            : 0;
    }

    /**
     * Builds the learning-style breakdown from a collection of attempts.
     * Returns percentages, strengths, and a recommendation string.
     */
    private function buildLearningStyleData($attempts): array
    {
        $styles = ['visual' => [], 'kinestetik' => [], 'auditori' => []];

        foreach ($attempts as $attempt) {
            $type = $attempt->quizzes->quiz_type ?? null;
            if ($type && array_key_exists($type, $styles)) {
                $styles[$type][] = (float) $attempt->score;
            }
        }

        $result   = [];
        $styleNames = [
            'visual'     => 'Visual',
            'kinestetik' => 'Kinestetik',
            'auditori'   => 'Auditori',
        ];

        foreach ($styles as $style => $scores) {
            if (empty($scores)) {
                $result[$style] = [
                    'percentage' => 0,
                    'strength'   => 'Belum Diuji',
                    'attempts'   => 0,
                ];
                continue;
            }

            $avg        = array_sum($scores) / count($scores);
            $percentage = min(100, round($avg, 1));

            if ($percentage >= 85)      $strength = 'Sangat Kuat';
            elseif ($percentage >= 70)  $strength = 'Kuat';
            elseif ($percentage >= 60)  $strength = 'Sederhana';
            else                        $strength = 'Perlu Diperbaiki';

            $result[$style] = [
                'percentage' => $percentage,
                'strength'   => $strength,
                'attempts'   => count($scores),
            ];
        }

        // Determine top style and build recommendation
        $sorted   = collect($result)->sortByDesc('percentage');
        $topKey   = $sorted->keys()->first();
        $topValue = $sorted->first();

        $recommendation = $topValue['percentage'] > 0
            ? "Gaya pembelajaran {$styleNames[$topKey]} adalah yang paling sesuai untuk anda dengan skor purata {$topValue['percentage']}%."
            : 'Sila lengkapkan lebih banyak kuiz untuk mendapat analisis gaya pembelajaran yang tepat.';

        return array_merge($result, ['recommendation' => $recommendation]);
    }

    // ─────────────────────────────────────────────
    //  ENDPOINTS
    // ─────────────────────────────────────────────

    /**
     * GET /student-performance/analytics/{studentId}
     * Bundles summary + progress + learningStyle + weeklyActivity + recentActivity
     * in a single response (used by fetchStudentAnalytics in the Pinia store).
     */
    public function getAnalytics(string $studentId)
    {
        $realId   = $this->resolveStudentId($studentId);
        $attempts = QuizAttempt::with('quizzes')
            ->where('student_id', $realId)
            ->where('status', 'completed')
            ->get();

        return response()->json([
            'summary'        => $this->buildSummary($attempts),
            'progress'       => $this->buildProgress($attempts),
            'learningStyle'  => $this->buildLearningStyleData($attempts),
            'weeklyActivity' => $this->buildWeeklyActivity($attempts),
            'recentActivity' => $attempts->sortByDesc('completed_at')->take(5)->values(),
            'fetchedAt'      => now()->toISOString(),
        ]);
    }

    /**
     * GET /student-performance/summary/{studentId}
     */
    public function getPerformanceSummary(string $studentId)
    {
        $realId   = $this->resolveStudentId($studentId);
        $attempts = QuizAttempt::with('quizzes')
            ->where('student_id', $realId)
            ->where('status', 'completed')
            ->get();

        return response()->json([
            'studentId' => $studentId,
            'summary'   => $this->buildSummary($attempts),
            'fetchedAt' => now()->toISOString(),
        ]);
    }

    /**
     * GET /student-performance/progress/{studentId}
     */
    public function getProgressByUnit(string $studentId)
    {
        $realId   = $this->resolveStudentId($studentId);
        $attempts = QuizAttempt::with('quizzes')
            ->where('student_id', $realId)
            ->where('status', 'completed')
            ->orderBy('completed_at')
            ->get();

        $progress = $this->buildProgress($attempts);

        return response()->json([
            'studentId'  => $studentId,
            'progress'   => $progress,
            'totalUnits' => count($progress),
            'fetchedAt'  => now()->toISOString(),
        ]);
    }

    /**
     * GET /student-performance/learning-style/{studentId}
     */
    public function getLearningStyleAnalysis(string $studentId)
    {
        $realId   = $this->resolveStudentId($studentId);
        $attempts = QuizAttempt::with('quizzes')
            ->where('student_id', $realId)
            ->where('status', 'completed')
            ->get();

        return response()->json([
            'studentId'     => $studentId,
            'learningStyle' => $this->buildLearningStyleData($attempts),
            'fetchedAt'     => now()->toISOString(),
        ]);
    }

    /**
     * GET /student-performance/weekly-activity/{studentId}
     */
    public function getWeeklyActivity(string $studentId)
    {
        $realId   = $this->resolveStudentId($studentId);
        $attempts = QuizAttempt::with('quizzes')
            ->where('student_id', $realId)
            ->where('status', 'completed')
            ->where('completed_at', '>=', Carbon::now()->subDays(7)->toDateString())
            ->orderBy('completed_at')
            ->get();

        $weeklyActivity = $this->buildWeeklyActivity($attempts);

        return response()->json([
            'studentId'      => $studentId,
            'weeklyActivity' => $weeklyActivity,
            'daysCount'      => count($weeklyActivity),
            'fetchedAt'      => now()->toISOString(),
        ]);
    }

    /**
     * GET /student-performance/recent-activity/{studentId}?limit=10
     */
    public function getRecentActivity(Request $request, string $studentId)
    {
        $realId  = $this->resolveStudentId($studentId);
        $limit   = (int) $request->query('limit', 10);

        $attempts = QuizAttempt::with('quizzes')
            ->where('student_id', $realId)
            ->where('status', 'completed')
            ->orderBy('completed_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'studentId'      => $studentId,
            'recentActivity' => $attempts,
            'count'          => $attempts->count(),
            'fetchedAt'      => now()->toISOString(),
        ]);
    }

    /**
     * GET /student-performance/all-attempts/{studentId}
     */
    public function getAllAttempts(string $studentId)
    {
        $realId = $this->resolveStudentId($studentId);

        $attempts = QuizAttempt::with('quizzes')
            ->where('student_id', $realId)
            ->where('status', 'completed')
            ->orderBy('completed_at', 'desc')
            ->get();

        return response()->json([
            'studentId'     => $studentId,
            'attempts'      => $attempts,
            'totalAttempts' => $attempts->count(),
            'fetchedAt'     => now()->toISOString(),
        ]);
    }

    /**
     * GET /student-performance/comparison/{studentId}?compareWith=class
     * Stub — comparison with class/school averages for future implementation.
     */
    public function getPerformanceComparison(Request $request, string $studentId)
    {
        $realId      = $this->resolveStudentId($studentId);
        $compareWith = $request->query('compareWith', 'individual');

        $attempts = QuizAttempt::with('quizzes')
            ->where('student_id', $realId)
            ->where('status', 'completed')
            ->get();

        return response()->json([
            'studentId'  => $studentId,
            'performance' => $this->buildSummary($attempts),
            'comparison' => [
                'type'    => $compareWith,
                'message' => 'Comparison feature will be implemented in future updates',
            ],
            'fetchedAt'  => now()->toISOString(),
        ]);
    }

    // ─────────────────────────────────────────────
    //  PRIVATE BUILDERS (reused across endpoints)
    // ─────────────────────────────────────────────

    /**
     * Builds the summary array from a completed-attempts collection.
     */
    private function buildSummary($attempts): array
    {
        $totalQuizzes = $attempts->count();

        if ($totalQuizzes === 0) {
            return [
                'totalQuizzes'           => 0,
                'averageScore'           => 0,
                'averageCompletionTime'  => 0,
                'preferredLearningStyle' => null,
            ];
        }

        $averageScore          = round($attempts->avg('score'), 2);
        $averageCompletionTime = $this->calcAverageCompletionTime($attempts);

        // Preferred learning style = style with highest average score
        $styleScores = ['visual' => [], 'kinestetik' => [], 'auditori' => []];
        foreach ($attempts as $attempt) {
            $type = $attempt->quizzes->quiz_type ?? null;
            if ($type && isset($styleScores[$type])) {
                $styleScores[$type][] = (float) $attempt->score;
            }
        }

        $bestStyle = null;
        $bestScore = 0;
        foreach ($styleScores as $style => $scores) {
            if (!empty($scores)) {
                $avg = array_sum($scores) / count($scores);
                if ($avg > $bestScore) {
                    $bestScore = $avg;
                    $bestStyle = $style;
                }
            }
        }

        return [
            'totalQuizzes'           => $totalQuizzes,
            'averageScore'           => $averageScore,
            'averageCompletionTime'  => $averageCompletionTime,
            'preferredLearningStyle' => $bestStyle,
        ];
    }

    /**
     * Builds the per-unit progress array from a completed-attempts collection.
     */
    private function buildProgress($attempts): array
    {
        $groupedByUnit = $attempts->groupBy(fn($a) => $a->quizzes->quiz_unit ?? 'Unknown');

        $progress = [];
        foreach ($groupedByUnit as $unit => $unitAttempts) {
            $scores       = $unitAttempts->map(fn($a) => (float) $a->score);
            $avgScore     = round($scores->avg(), 2);
            $completed    = $unitAttempts->count();

            // 4 activities assumed per unit (matches Group 2 logic)
            $progressPct  = min(100, round(($completed / 4) * 100));

            $progress[] = [
                'unit'               => is_numeric($unit) ? (int) $unit : $unit,
                'completedQuizzes'   => $completed,
                'averageScore'       => $avgScore,
                'progressPercentage' => $progressPct,
                'lastActivity'       => $unitAttempts->max('completed_at'),
            ];
        }

        // Sort by unit number ascending
        usort($progress, fn($a, $b) => $a['unit'] <=> $b['unit']);

        return $progress;
    }

    /**
     * Builds the 7-day weekly activity array from a completed-attempts collection.
     */
    private function buildWeeklyActivity($attempts): array
    {
        // Pre-index attempts by date string for O(1) lookup
        $byDate = $attempts->groupBy(fn($a) => Carbon::parse($a->completed_at)->format('Y-m-d'));

        $weeklyActivity = [];
        for ($i = 6; $i >= 0; $i--) {
            $day        = Carbon::now()->subDays($i);
            $dateStr    = $day->format('Y-m-d');
            $dayAttempts = $byDate->get($dateStr, collect());

            // Real time spent: sum of per-attempt durations in minutes
            $timeSpent = $dayAttempts
                ->filter(fn($a) => $a->started_at && $a->completed_at)
                ->sum(function ($a) {
                    return Carbon::parse($a->started_at)
                        ->diffInSeconds(Carbon::parse($a->completed_at)) / 60;
                });

            $weeklyActivity[] = [
                'day'                  => $this->getMalayDayName($day->dayOfWeek),
                'date'                 => $dateStr,
                'activitiesCompleted'  => $dayAttempts->count(),
                'timeSpent'            => round($timeSpent, 1),
                'topicsStudied'        => $dayAttempts
                    ->pluck('quizzes.quiz_unit')
                    ->filter()
                    ->unique()
                    ->count(),
            ];
        }

        return $weeklyActivity;
    }
}
