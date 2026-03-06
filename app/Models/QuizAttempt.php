<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class QuizAttempt extends Model
{
    protected $table = 'quiz_attempts';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'student_id', 'quiz_id', 'score',
        'answers', 'started_at', 'completed_at', 'status'
    ];

    protected $casts = [
        'answers' => 'array', // Automatically decodes your JSON answers!
    ];

    // Note: We named this "quizzes" because your Vue frontend expects "attempt.quizzes.title"
    public function quizzes()
    {
        return $this->belongsTo(Quiz::class, 'quiz_id', 'id');
    }
}
