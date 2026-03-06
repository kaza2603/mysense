<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    // Fetch quizzes (with optional filters from Vue)
    public function index(Request $request)
    {
        $query = Quiz::query();

        // Vue sends these exact parameters to find the right quiz
        if ($request->has('quiz_unit')) {
            $query->where('quiz_unit', $request->quiz_unit);
        }
        if ($request->has('no_activity')) {
            $query->where('no_activity', $request->no_activity);
        }
        if ($request->has('quiz_type')) {
            $query->where('quiz_type', $request->quiz_type);
        }

        // Return the raw array that Vue expects
        return response()->json($query->get());
    }

    // Fetch a specific quiz by ID
    public function show($id)
    {
        $quiz = Quiz::find($id);

        if (!$quiz) {
            return response()->json(['message' => 'Quiz not found'], 404);
        }

        return response()->json($quiz);
    }
}
