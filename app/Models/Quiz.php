<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    protected $table = 'quizzes';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'quiz_unit', 'no_activity', 'quiz_type',
        'title', 'description', 'instructions', 'is_active'
    ];
}
