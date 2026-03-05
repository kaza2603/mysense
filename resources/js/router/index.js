import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'
import PenyumbangBahan from '@/views/PenyumbangBahan.vue'
import MotivasiView from '@/views/MotivasiView.vue'
import AdminLoginView from '@/views/admin/AdminLoginView.vue'
import AdminDashboardView from '@/views/admin/AdminDashboardView.vue'
import StudentLoginView from '@/views/student/LoginView.vue'
import TeacherLayout from '@/components/TeacherLayout.vue'
import TeacherDashboardView from '@/views/teacher/DashboardView.vue'
import UploadVideoView from '@/views/teacher/UploadVideoView.vue'
import TeacherLoginView from '@/views/teacher/LoginView.vue' // Import the new login view
import KenaliSayaQuiz from '@/views/student/Kuiz/KenaliSayaQuiz.vue'
import BendaHidupQuiz from '@/views/student/Kuiz/BendaHidupQuiz.vue'
import YangManaSatuQuiz from '@/views/student/Kuiz/YangManaSatuQuiz.vue'
import DeriaOrganQuiz from '@/views/student/Kuiz/DeriaOrganQuiz.vue'
import DeriaOrganLabelQuiz from '@/views/student/Kuiz/DeriaOrganLabelQuiz.vue'
import MariMengelasQuiz from '@/views/student/Kuiz/MariMengelasQuiz.vue'
import MerdunyaSuarakuQuiz from '@/views/student/Kuiz/MerdunyaSuarakuQuiz.vue'
import PergerakankuQuiz from '@/views/student/Kuiz/PergerakankuQuiz.vue'
import PokokApakahSayaQuiz from '@/views/student/Kuiz/PokokApakahSayaQuiz.vue'
import BahagianTubuhkuQuiz from '@/views/student/Kuiz/BahagianTubuhkuQuiz.vue'
import CahayaOhCahayaQuiz from '@/views/student/Kuiz/CahayaOhCahayaQuiz.vue'
import KepentinganCahayaQuiz from '@/views/student/Kuiz/KepentinganCahayaQuiz.vue'
import SumberAirKitaQuiz from '@/views/student/Kuiz/SumberAirKitaQuiz.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/penyumbang-bahan',
      name: 'penyumbang-bahan',
      component: PenyumbangBahan,
    },
    {
      path: '/motivasi',
      name: 'motivasi',
      component: MotivasiView,
    },
    {
      path: '/login-admin',
      name: 'login-admin',
      component: AdminLoginView,
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordView.vue'),
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/ResetPasswordView.vue'),
    },
    {
      path: '/parent/login',
      name: 'parent-login',
      component: () => import('@/views/parent/LoginView.vue'),
    },
    {
      path: '/parent/register',
      name: 'parent-register',
      component: () => import('@/views/parent/RegisterView.vue'),
    },
    {
      path: '/parent',
      name: 'parent',
      children: [
        {
          path: 'dashboard',
          name: 'parent-dashboard',
          component: () => import('@/views/parent/DashboardView.vue'),
          meta: { requiresParentAuth: true },
        },
        {
          path: 'my-children/:studentId?',
          name: 'parent-my-children',
          component: () => import('@/views/parent/MyChildrenView.vue'),
          meta: { requiresParentAuth: true },
        },
        {
          path: 'register-student',
          name: 'parent-register-student',
          component: () => import('@/views/parent/RegisterStudentView.vue'),
          meta: { requiresParentAuth: true },
        },
      ],
    },
    {
      path: '/admin',
      name: 'admin',
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: AdminDashboardView,
          meta: { requiresAuth: true },
        },
        {
          path: 'students',
          name: 'admin-students',
          component: () => import('@/views/admin/StudentsView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'parents',
          name: 'admin-parents',
          component: () => import('@/views/admin/ParentsView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'teachers',
          name: 'admin-teachers',
          component: () => import('@/views/admin/TeachersView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'school-registration',
          name: 'admin-school-registration',
          component: () => import('@/views/admin/SchoolRegistrationView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'school-classes',
          name: 'admin-school-classes',
          component: () => import('@/views/admin/SchoolClassView.vue'),
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: '/student-login',
      name: 'student-login',
      component: StudentLoginView,
    },
    {
      path: '/student',
      name: 'student',
      children: [
        {
          path: 'dashboard',
          name: 'student-dashboard',
          component: () => import('@/views/student/DashboardView.vue'),
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'digital-book',
          name: 'student-digital-book',
          component: () => import('@/views/student/DigitalBookView.vue'),
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'student-jadual',
          name: 'student-jadual',
          component: () => import('@/views/student/JadualPembelajaranView.vue'),
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz-interaktif',
          name: 'student-kuiz-interaktif',
          component: () => import('@/views/student/KuizInteraktifView.vue'),
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz-index',
          name: 'student-kuiz-index',
          component: () => import('@/views/student/KuizIndex.vue'),
          meta: { requiresStudentAuth: true },
        },

        {
          path: 'kuiz',
          redirect: '/kuiz',
        },
        {
          path: 'kuiz/kenali-saya',
          name: 'student-kuiz-kenali-saya',
          component: KenaliSayaQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz/benda-hidup',
          name: 'student-kuiz-benda-hidup',
          component: BendaHidupQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz/yang-mana-satu',
          name: 'student-kuiz-yang-mana-satu',
          component: YangManaSatuQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz/deria-organ',
          name: 'student-kuiz-deria-organ',
          component: DeriaOrganQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz/deria-organ-label',
          name: 'student-kuiz-deria-organ-label',
          component: DeriaOrganLabelQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz/mari-mengelas',
          name: 'student-kuiz-mari-mengelas',
          component: MariMengelasQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz/merdunya-suaraku',
          name: 'student-kuiz-merdunya-suaraku',
          component: MerdunyaSuarakuQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz/pergerakanku',
          name: 'student-kuiz-pergerakanku',
          component: PergerakankuQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz/pokok-apakah-saya',
          name: 'student-kuiz-pokok-apakah-saya',
          component: PokokApakahSayaQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz/bahagian-tubuhku',
          name: 'student-kuiz-bahagian-tubuhku',
          component: BahagianTubuhkuQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz/cahaya-oh-cahaya',
          name: 'student-kuiz-cahaya-oh-cahaya',
          component: CahayaOhCahayaQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz/kepentingan-cahaya',
          name: 'student-kuiz-kepentingan-cahaya',
          component: KepentinganCahayaQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kuiz/sumber-air-kita',
          name: 'student-kuiz-sumber-air-kita',
          component: SumberAirKitaQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'learning-videos',
          name: 'student-learning-videos',
          component: () => import('@/views/student/LearningVideosView.vue'),
          meta: { requiresStudentAuth: true },
        },
      ],
    },

    // Kuiz Routes with dedicated layout
    {
      path: '/kuiz',
      children: [
        {
          path: 'kenali-saya',
          name: 'kuiz-kenali-saya',
          component: KenaliSayaQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'benda-hidup',
          name: 'kuiz-benda-hidup',
          component: BendaHidupQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'yang-mana-satu',
          name: 'kuiz-yang-mana-satu',
          component: YangManaSatuQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'deria-organ',
          name: 'kuiz-deria-organ',
          component: DeriaOrganQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'deria-organ-label',
          name: 'kuiz-deria-organ-label',
          component: DeriaOrganLabelQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'mari-mengelas',
          name: 'kuiz-mari-mengelas',
          component: MariMengelasQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'merdunya-suaraku',
          name: 'kuiz-merdunya-suaraku',
          component: MerdunyaSuarakuQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'pergerakanku',
          name: 'kuiz-pergerakanku',
          component: PergerakankuQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'pokok-apakah-saya',
          name: 'kuiz-pokok-apakah-saya',
          component: PokokApakahSayaQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'bahagian-tubuhku',
          name: 'kuiz-bahagian-tubuhku',
          component: BahagianTubuhkuQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'cahaya-oh-cahaya',
          name: 'kuiz-cahaya-oh-cahaya',
          component: CahayaOhCahayaQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'kepentingan-cahaya',
          name: 'kuiz-kepentingan-cahaya',
          component: KepentinganCahayaQuiz,
          meta: { requiresStudentAuth: true },
        },
        {
          path: 'sumber-air-kita',
          name: 'kuiz-sumber-air-kita',
          component: SumberAirKitaQuiz,
          meta: { requiresStudentAuth: true },
        },
      ],
    },

    // Teacher Routes
    {
      path: '/guru/login', // Add login route
      name: 'TeacherLogin',
      component: TeacherLoginView,
    },
    {
      path: '/guru',
      meta: { requiresAuth: true, role: 'teacher' },
      children: [
        { path: '', redirect: '/guru/dashboard' },
        { path: 'dashboard', name: 'TeacherDashboard', component: TeacherDashboardView },
        { path: 'upload-video', name: 'TeacherUploadVideo', component: UploadVideoView },
        {
          path: 'student-performance',
          name: 'TeacherStudentPerformance',
          component: () => import('@/views/teacher/StudentPerformance.vue'),
        },
        // Add other teacher-specific routes here
      ],
    },
  ],
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // Check for admin routes
  if (
    to.matched.some((record) => record.path === '/admin' && record.meta.requiresAuth) &&
    !auth.isAuthenticated
  ) {
    next('/login-admin')
  }
  // Check for parent routes
  else if (
    to.matched.some((record) => record.path === '/parent' && record.meta.requiresParentAuth) &&
    !auth.isParentAuthenticated
  ) {
    next('/parent/login')
  }
  // Check for student routes
  else if (
    to.matched.some((record) => record.path === '/student' && record.meta.requiresStudentAuth) &&
    !auth.isStudentAuthenticated
  ) {
    next('/student-login')
  }
  // Check for kuiz routes that require student authentication
  else if (
    to.matched.some((record) => record.meta.requiresStudentAuth) &&
    to.path.startsWith('/kuiz') &&
    !auth.isStudentAuthenticated
  ) {
    next('/student-login')
  }
  // Check for teacher routes (excluding login page itself)
  else if (
    to.matched.some((record) => record.path === '/guru' && record.meta.requiresAuth) &&
    !auth.isTeacherAuthenticated &&
    to.name !== 'TeacherLogin'
  ) {
    next('/guru/login') // Redirect to teacher login
  }
  // Allow access if authenticated or route doesn't require auth
  else {
    next()
  }
})

export default router
