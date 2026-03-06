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

                // Get the logged-in parent
                $parent = Auth::guard('parent')->user();

                // MAGIC ALERT: This automatically fetches all associated students!
                $parent->load('students');

                return response()->json([
                    'user' => $parent
                ]);
            }

            return response()->json(['message' => 'E-mel atau kata laluan tidak sah'], 401);
        }

    public function loginStudent(Request $request)
    {
        // Students might log in with student_email or student_username.
        // Based on your frontend code, let's assume email for now.
        $credentials = [
            'student_email' => $request->email,
            'password' => $request->password
        ];

        if (Auth::guard('student')->attempt($credentials)) {
            $request->session()->regenerate();
            return response()->json([
                'student' => Auth::guard('student')->user()
            ]);
        }

        return response()->json(['message' => 'E-mel atau kata laluan tidak sah'], 401);
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
        // 1. Fetch all students where the parent_email matches the requested email
        // We use the Student model we created earlier
        $students = \App\Models\Student::where('parent_email', $email)->get();

        // 2. Return the data exactly how your Vue frontend expects it:
        // response.data.students
        return response()->json([
            'students' => $students
        ]);
    }
}
