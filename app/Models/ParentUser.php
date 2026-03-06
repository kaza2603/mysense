<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class ParentUser extends Authenticatable
{
    use Notifiable;

    protected $table = 'parents';
    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['user_id', 'parent_name', 'parent_phone', 'parent_address', 'parent_email', 'password', 'created_at'];
    protected $hidden = ['password'];

    // ADD THIS NEW FUNCTION:
    public function students()
    {
        // This says: "Look in the Student model. Find students where their 'parent_email' matches my 'parent_email'."
        return $this->hasMany(Student::class, 'parent_email', 'parent_email');
    }
}
