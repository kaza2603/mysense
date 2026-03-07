<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StudentController extends Controller
{
    public function index() {
        // Kita gunakan 'AS' untuk menukar nama lajur pangkalan data
        // supaya sepadan tepat dengan apa yang Vue Frontend (mapStudentToFrontend) cari
        $students = Student::leftJoin('schools', 'students.school_id', '=', 'schools.school_id')
            ->leftJoin('classes', 'students.class_id', '=', 'classes.class_id')
            ->select(
                'students.user_id as id',
                'students.student_username as username',
                'students.student_name as name',
                'students.student_email as email',
                'students.parent_email as parentEmail',
                'schools.name as school',
                'students.school_id as schoolId',
                'classes.class_name as class',
                'students.class_id as classId'
            )
            ->get();

        return response()->json(['students' => $students]);
    }

    public function getStudentsByTeacherClass() {
        $teacher = Auth::guard('teacher')->user();
        if (!$teacher) return response()->json(['message' => 'Guru tidak dikenalpasti'], 401);

        $students = Student::where('class_id', $teacher->class_id)->get();
        return response()->json(['students' => $students]);
    }

    public function store(Request $request) {
        $student = new Student();
        $student->user_id = Str::uuid()->toString();
        $student->student_username = $request->student_username;
        $student->student_name = $request->student_name;
        $student->password = Hash::make($request->student_password);
        $student->school_id = $request->school_id;
        $student->class_id = $request->class_id;
        $student->parent_email = $request->parent_email;
        $student->student_email = $request->student_email;
        $student->created_at = now();
        $student->save();

        return response()->json(['student' => $student], 201);
    }

    public function update(Request $request, $id) {
        $student = Student::find($id);
        if ($student) {
            $student->update($request->only(['student_name', 'student_username', 'school_id', 'class_id', 'parent_email', 'student_email']));
        }
        return response()->json(['student' => $student]);
    }

    public function destroy($id) {
        $student = Student::find($id);
        if ($student) $student->delete();
        return response()->json(['success' => true]);
    }

    public function getProfile($id) {
        return response()->json(['student' => Student::find($id)]);
    }

    public function getProfileByUsername($username) {
        return response()->json(['student' => Student::where('student_username', $username)->first()]);
    }
}
