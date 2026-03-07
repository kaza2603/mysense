<?php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Admin extends Authenticatable
{
    use Notifiable;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['id', 'name', 'email', 'password'];
    protected $hidden = ['password'];
}
