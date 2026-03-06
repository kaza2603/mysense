<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class QuizAttemptController extends Controller
{
    public function store(Request $request)
    {
        // Create a new attempt in the database
        $attempt = new QuizAttempt();

        // Generate a new UUID for this specific attempt
        $attempt->id = Str::uuid()->toString();

        $attempt->student_id = $request->student_id;
        $attempt->quiz_id = $request->quiz_id;
        $attempt->score = $request->score;

        // Laravel automatically converts JSON arrays to text because of the $casts we set in the Model earlier
        $attempt->answers = $request->answers;

        // Format the dates securely
        $attempt->started_at = date('Y-m-d H:i:s', strtotime($request->started_at));
        $attempt->completed_at = now(); // Mark it completed right now
        $attempt->status = 'completed';

        $attempt->save();

        // Vue expects response.data.attempt.id to be returned!
        return response()->json([
            'message' => 'Berjaya disimpan!',
            'attempt' => $attempt
        ]);
    }
}
