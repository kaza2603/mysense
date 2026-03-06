<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    // 1. Fetch ALL schools
    public function index()
    {
        $schools = School::all();
        // Vue expects a raw array: response.data
        return response()->json($schools);
    }

    // 2. Fetch a specific school by ID (and include its classes)
    public function getSchool($id)
    {
        $school = School::find($id);

        if (!$school) {
            return response()->json(['error' => 'School not found'], 404);
        }

        // The Vue app looks for schoolData.classes, so we grab the classes for this school
        $classes = SchoolClass::where('school_id', $id)->get();

        // We append the classes array directly to the school object before returning it
        $school->classes = $classes;

        // Vue expects the raw object: response.data.school_id
        return response()->json($school);
    }

    // 3. Fetch ALL classes for a specific school
    public function getClassesBySchool($schoolId)
    {
        $classes = SchoolClass::where('school_id', $schoolId)->get();
        // Vue expects a raw array: response.data
        return response()->json($classes);
    }

    // 4. Fetch a specific class by ID
    public function getClass($id)
    {
        $class = SchoolClass::find($id);

        if (!$class) {
            return response()->json(['error' => 'Class not found'], 404);
        }

        // Vue expects the raw object: response.data.class_id
        return response()->json($class);
    }
}
