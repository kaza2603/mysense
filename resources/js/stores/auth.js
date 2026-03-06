import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/lib/api"; // Your custom Axios instance

export const useAuthStore = defineStore("auth", () => {
    const isAuthenticated = ref(
        localStorage.getItem("isAuthenticated") === "true",
    );
    const isParentAuthenticated = ref(
        localStorage.getItem("isParentAuthenticated") === "true",
    );
    const isStudentAuthenticated = ref(
        localStorage.getItem("isStudentAuthenticated") === "true",
    );
    const isTeacherAuthenticated = ref(
        localStorage.getItem("isTeacherAuthenticated") === "true",
    );
    const authError = ref("");
    const currentUser = ref(JSON.parse(localStorage.getItem("currentUser")));
    const currentStudent = ref(
        JSON.parse(localStorage.getItem("currentStudent")),
    );
    const currentTeacher = ref(
        JSON.parse(localStorage.getItem("currentTeacher")),
    );

    // --- LARAVEL SANCTUM HELPER ---
    // Call this before logins to establish a secure session
    const initSanctum = async () => {
        await api.get("/sanctum/csrf-cookie");
    };

    // --- ADMIN LOGIN (Keeping your bypass logic for now) ---
    const login = async (email, password) => {
        authError.value = "";
        const allowedAdminEmails = [
            "irfpann@student.usm.my",
            "admin@test.com",
            "admin@admin.com",
            "test@test.com",
        ];

        if (!allowedAdminEmails.includes(email)) {
            authError.value = "E-mel atau kata laluan tidak sah";
            return false;
        }

        try {
            isAuthenticated.value = true;
            localStorage.setItem("isAuthenticated", "true");

            const adminUser = {
                email: email,
                role: "admin",
                authenticated_at: new Date().toISOString(),
            };
            localStorage.setItem("adminUser", JSON.stringify(adminUser));

            authError.value = "";
            console.log("Admin logged in successfully (BYPASSED):", email);
            return true;
        } catch (error) {
            console.error("Admin login error:", error);
            authError.value = "Ralat semasa log masuk. Sila cuba lagi.";
            return false;
        }
    };

    // --- PARENT LOGIN ---
    const loginParent = async (email, password) => {
        authError.value = "";
        try {
            await initSanctum(); // Request CSRF cookie
            const response = await api.post("/parents/login", {
                email,
                password,
            });
            if (response.data && response.data.user) {
                isParentAuthenticated.value = true;
                response.data.user.token = "sanctum-cookie-auth";
                currentUser.value = response.data.user;
                localStorage.setItem("isParentAuthenticated", "true");
                localStorage.setItem(
                    "currentUser",
                    JSON.stringify(response.data.user),
                );
                return true;
            }
            throw new Error("Invalid response");
        } catch (error) {
            authError.value =
                error.response?.data?.message ||
                "E-mel atau kata laluan tidak sah";
            isParentAuthenticated.value = false;
            currentUser.value = null;
            return false;
        }
    };

    // --- STUDENT LOGIN ---
    const loginStudent = async (email, password) => {
        authError.value = "";
        try {
            await initSanctum(); // Request CSRF cookie
            const response = await api.post("/students/login", {
                email,
                password,
            });
            if (response.data && response.data.student) {
                isStudentAuthenticated.value = true;
                response.data.student.token = "sanctum-cookie-auth";
                currentStudent.value = response.data.student;
                localStorage.setItem("isStudentAuthenticated", "true");
                localStorage.setItem(
                    "currentStudent",
                    JSON.stringify(response.data.student),
                );
                return true;
            }
            throw new Error("Invalid response");
        } catch (error) {
            authError.value =
                error.response?.data?.message ||
                "E-mel atau kata laluan tidak sah";
            isStudentAuthenticated.value = false;
            currentStudent.value = null;
            return false;
        }
    };

    // --- TEACHER LOGIN ---
    const loginTeacher = async (email, password) => {
        authError.value = "";
        try {
            await initSanctum(); // Request CSRF cookie
            const response = await api.post("/teachers/login", {
                email,
                password,
            });
            if (response.data && response.data.teacher) {
                isTeacherAuthenticated.value = true;
                response.data.teacher.token = "sanctum-cookie-auth";
                currentTeacher.value = response.data.teacher;
                localStorage.setItem("isTeacherAuthenticated", "true");
                localStorage.setItem(
                    "currentTeacher",
                    JSON.stringify(response.data.teacher),
                );
                return true;
            }
            throw new Error("Invalid response");
        } catch (error) {
            authError.value =
                error.response?.data?.message ||
                "E-mel atau kata laluan tidak sah";
            isTeacherAuthenticated.value = false;
            currentTeacher.value = null;
            return false;
        }
    };

    // --- REGISTRATIONS ---
    const registerParent = async (parentData) => {
        authError.value = "";
        try {
            const response = await api.post("/parents/register", parentData);
            return !!(response.data && response.data.parent);
        } catch (error) {
            authError.value =
                error.response?.data?.message || "Pendaftaran gagal";
            return false;
        }
    };

    const registerStudentBackend = async (studentData) => {
        authError.value = "";
        const payload = {
            student_username:
                studentData.student_username || studentData.username,
            student_name: studentData.student_name || studentData.name,
            student_password:
                studentData.student_password || studentData.password,
            school_id: studentData.school_id || studentData.schoolId,
            class_id: studentData.class_id || studentData.classId,
            parent_email: studentData.parent_email || studentData.parentEmail,
            student_email: studentData.student_email || studentData.email,
        };

        try {
            const response = await api.post("/students/register", payload);
            return !!(response.data && response.data.student);
        } catch (error) {
            authError.value =
                error.response?.data?.message || "Pendaftaran pelajar gagal";
            return false;
        }
    };

    const registerTeacherBackend = async (teacherData) => {
        authError.value = "";
        try {
            const response = await api.post("/teachers/register", teacherData);
            return !!(response.data && response.data.teacher);
        } catch (error) {
            authError.value =
                error.response?.data?.message || "Pendaftaran guru gagal";
            return false;
        }
    };

    // --- LOGOUTS ---
    const logout = async () => {
        try {
            await api.post("/logout");
        } catch (e) {} // Tell Laravel to destroy session
        isAuthenticated.value = false;
        isParentAuthenticated.value = false;
        currentUser.value = null;
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("isParentAuthenticated");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("adminUser");
    };

    const logoutStudent = async () => {
        try {
            await api.post("/logout");
        } catch (e) {}
        isStudentAuthenticated.value = false;
        currentStudent.value = null;
        localStorage.removeItem("isStudentAuthenticated");
        localStorage.removeItem("currentStudent");
    };

    const logoutTeacher = async () => {
        try {
            await api.post("/logout");
        } catch (e) {}
        isTeacherAuthenticated.value = false;
        currentTeacher.value = null;
        localStorage.removeItem("isTeacherAuthenticated");
        localStorage.removeItem("currentTeacher");
    };

    // --- PASSWORD RESET (Converted from Supabase to Laravel API) ---
    const forgotPassword = async (email) => {
        authError.value = "";
        try {
            await initSanctum();
            await api.post("/forgot-password", { email });
            return true;
        } catch (error) {
            authError.value =
                error.response?.data?.message ||
                "Ralat semasa menghantar e-mel tetapan semula.";
            return false;
        }
    };

    const resetPasswordForEmail = forgotPassword; // Alias to match your old naming

    // Laravel expects token, email, password, and password_confirmation for resets
    const resetPassword = async (
        email,
        token,
        newPassword,
        newPasswordConfirmation,
    ) => {
        authError.value = "";
        try {
            await api.post("/reset-password", {
                email: email,
                token: token,
                password: newPassword,
                password_confirmation: newPasswordConfirmation,
            });
            return true;
        } catch (error) {
            authError.value =
                error.response?.data?.message ||
                "Ralat mengemaskini kata laluan.";
            return false;
        }
    };

    const updatePassword = resetPassword; // Alias to match your old naming

    // Laravel handles token verification automatically on the reset POST, so we can mock this or check an endpoint
    const verifyResetToken = async (email, token) => {
        // In standard Laravel, you don't usually verify the token via API before submitting the new password.
        // The token is verified when the user submits the actual password reset form.
        return true;
    };

    const verifyResetSession = verifyResetToken;

    return {
        isAuthenticated,
        isParentAuthenticated,
        authError,
        currentUser,
        login,
        loginParent,
        loginStudent,
        loginTeacher,
        isStudentAuthenticated,
        currentStudent,
        registerParent,
        logout,
        logoutStudent,
        isTeacherAuthenticated,
        currentTeacher,
        logoutTeacher,
        registerStudentBackend,
        registerTeacherBackend,
        forgotPassword,
        verifyResetSession,
        resetPassword,
        resetPasswordForEmail,
        updatePassword,
        verifyResetToken,
    };
});
