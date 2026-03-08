<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function loginParent(Request $request)
    {
        $credentials = [
            'parent_email' => $request->email,
            'password' => $request->password
        ];

        if (Auth::guard('parent')->attempt($credentials)) {
            $request->session()->regenerate();
            $parent = Auth::guard('parent')->user();

            // MAPPING: We translate the database columns into the exact
            // format your Vue frontend expects (email instead of parent_email)
            return response()->json([
                'user' => [
                    'id' => $parent->user_id,
                    'name' => $parent->parent_name,
                    'email' => $parent->parent_email,
                    'phone' => $parent->parent_phone,
                    'address' => $parent->parent_address,
                ]
            ]);
        }

        return response()->json(['message' => 'E-mel atau kata laluan tidak sah'], 401);
    }

   public function loginStudent(Request $request)
    {
        // Smart Check: Did the student type an email address or a username?
        $loginField = filter_var($request->email, FILTER_VALIDATE_EMAIL) ? 'student_email' : 'student_username';

        $credentials = [
            $loginField => $request->email,
            'password' => $request->password
        ];

        if (Auth::guard('student')->attempt($credentials)) {
            $request->session()->regenerate();
            $student = Auth::guard('student')->user();

            return response()->json([
                'student' => [
                    // We send BOTH the new mapped names AND the old database column names
                    // This ensures complete compatibility with all your Vue files!
                    'id' => $student->user_id,
                    'user_id' => $student->user_id,
                    'student_id' => $student->user_id,

                    'username' => $student->student_username,
                    'student_username' => $student->student_username,

                    'name' => $student->student_name,
                    'student_name' => $student->student_name,

                    'email' => $student->student_email,
                    'student_email' => $student->student_email,

                    'parentEmail' => $student->parent_email,
                    'schoolId' => $student->school_id,
                    'classId' => $student->class_id,
                ]
            ]);
        }

        return response()->json(['message' => 'E-mel/Username atau kata laluan tidak sah'], 401);
    }

    public function loginTeacher(Request $request)
    {
        $credentials = [
            'teacher_email' => $request->email,
            'password' => $request->password
        ];

        if (Auth::guard('teacher')->attempt($credentials)) {
            $request->session()->regenerate();
            return response()->json([
                'teacher' => Auth::guard('teacher')->user()
            ]);
        }

        return response()->json(['message' => 'E-mel atau kata laluan tidak sah'], 401);
    }
    public function loginAdmin(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (Auth::guard('admin')->attempt($credentials)) {
            $request->session()->regenerate();
            $admin = Auth::guard('admin')->user();

            return response()->json([
                'user' => $admin,
                'role' => 'admin'
            ]);
        }

        return response()->json(['message' => 'E-mel atau kata laluan tidak sah'], 401);
    }

    public function logout(Request $request)
    {
        // Log out whoever is currently logged in
        Auth::guard('parent')->logout();
        Auth::guard('student')->logout();
        Auth::guard('teacher')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Berjaya log keluar']);
    }
    public function getStudentsByParent($email)
        {
            // We use the same 'AS' aliases here so the parent dashboard
            // gets the text names for schools and classes!
            $students = \App\Models\Student::where('students.parent_email', $email)
                ->leftJoin('schools', 'students.school_id', '=', 'schools.school_id')
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
    }
