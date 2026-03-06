<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    protected $table = 'schools';
    protected $primaryKey = 'school_id';
    public $incrementing = false; // Because it uses UUIDs
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['school_id', 'name', 'address', 'phone', 'created_at'];
}
