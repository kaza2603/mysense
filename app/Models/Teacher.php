<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Teacher extends Authenticatable
{
    use Notifiable;

    protected $table = 'teachers';
    protected $primaryKey = 'teacher_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['teacher_id', 'teacher_email', 'teacher_username', 'teacher_name', 'teacher_experience', 'teacher_phone', 'password', 'school_id', 'class_id', 'created_at'];
    protected $hidden = ['password'];
}
