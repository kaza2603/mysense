<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SchoolController extends Controller
{
    public function index() { return response()->json(School::all()); }

    public function getSchool($id) {
        $school = School::find($id);
        if (!$school) return response()->json(['error' => 'School not found'], 404);
        $school->classes = SchoolClass::where('school_id', $id)->get();
        return response()->json($school);
    }

    public function getClassesBySchool($schoolId) {
        return response()->json(SchoolClass::where('school_id', $schoolId)->get());
    }

    public function getClass($id) {
        $class = SchoolClass::find($id);
        if (!$class) return response()->json(['error' => 'Class not found'], 404);
        return response()->json($class);
    }

    // --- NEW: From your old Node.js schoolController.js ---
    public function registerSchool(Request $request) {
        $school = new School();
        $school->school_id = Str::uuid()->toString();
        $school->name = $request->name;
        $school->address = $request->address;
        $school->phone = $request->phone;
        $school->created_at = now();
        $school->save();

        $createdClasses = [];
        foreach ($request->classes as $className) {
            $class = new SchoolClass();
            $class->class_id = Str::uuid()->toString();
            $class->class_name = $className;
            $class->school_id = $school->school_id;
            $class->created_at = now();
            $class->save();
            $createdClasses[] = $class;
        }

        return response()->json(['school' => $school, 'classes' => $createdClasses, 'success' => true]);
    }

    public function updateSchool(Request $request, $id) {
        $school = School::find($id);
        if ($school) {
            $school->update($request->only(['name', 'address', 'phone']));
        }
        return response()->json(['school' => $school, 'success' => true]);
    }
    // --- NEW: Class Management Endpoints ---

    public function getAllClasses() {
        return response()->json(SchoolClass::all());
    }

    public function createClass(Request $request) {
        $class = new SchoolClass();
        $class->class_id = Str::uuid()->toString();
        $class->class_name = $request->class_name;
        $class->school_id = $request->school_id;
        $class->created_at = now();
        $class->save();

        return response()->json($class, 201);
    }

    public function updateClass(Request $request, $id) {
        $class = SchoolClass::find($id);
        if ($class) {
            $class->update([
                'class_name' => $request->class_name,
                'school_id' => $request->school_id
            ]);
        }
        return response()->json($class);
    }

    public function deleteClass($id) {
        $class = SchoolClass::find($id);
        if ($class) $class->delete();

        return response()->json(['message' => 'Class deleted successfully']);
    }
}
