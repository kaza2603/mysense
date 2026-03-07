<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TeacherController extends Controller
{
    public function index() {
        // Same here, we join the tables for the frontend
        $teachers = Teacher::leftJoin('schools', 'teachers.school_id', '=', 'schools.school_id')
            ->leftJoin('classes', 'teachers.class_id', '=', 'classes.class_id')
            ->select('teachers.*', 'schools.name as school_name', 'classes.class_name as class_name')
            ->get();

        return response()->json(['teachers' => $teachers]);
    }

    public function store(Request $request) {
        $teacher = new Teacher();
        $teacher->teacher_id = Str::uuid()->toString();
        $teacher->teacher_email = $request->teacher_email;
        $teacher->teacher_username = $request->teacher_username;
        $teacher->password = Hash::make($request->teacher_password);
        $teacher->teacher_name = $request->teacher_name;
        $teacher->school_id = $request->school_id;
        $teacher->class_id = $request->class_id;
        $teacher->teacher_experience = $request->teacher_experience ?? 0;
        $teacher->teacher_phone = $request->teacher_phone ?? '';
        $teacher->created_at = now();
        $teacher->save();

        return response()->json(['teacher' => $teacher], 201);
    }

    public function update(Request $request, $id) {
        $teacher = Teacher::find($id);
        if ($teacher) {
            $teacher->update($request->only(['teacher_name', 'school_id', 'class_id', 'teacher_experience', 'teacher_phone']));
        }
        return response()->json(['teacher' => $teacher]);
    }

    public function destroy($id) {
        $teacher = Teacher::find($id);
        if ($teacher) $teacher->delete();
        return response()->json(['success' => true]);
    }
}
