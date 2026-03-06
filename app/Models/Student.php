<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Student extends Authenticatable
{
    use Notifiable;

    protected $table = 'students';
    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['user_id', 'student_username', 'student_name', 'parent_email', 'student_email', 'password', 'class_id', 'school_id', 'created_at'];
    protected $hidden = ['password'];
    public function parent()
    {
        return $this->belongsTo(ParentUser::class, 'parent_email', 'parent_email');
    }
}
