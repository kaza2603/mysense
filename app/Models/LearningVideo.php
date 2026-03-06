<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class LearningVideo extends Model
{
    protected $table = 'learning_videos';
    protected $primaryKey = 'learning_video_id';
    public $incrementing = false; // Using UUIDs
    protected $keyType = 'string';
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null; // Your DB doesn't have an updated_at column here

    protected $fillable = [
        'learning_video_id', 'teacher_id', 'class_id',
        'school_id', 'youtube_link', 'title', 'description', 'created_at'
    ];
}
