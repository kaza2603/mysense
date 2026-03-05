import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'
import { useAuthStore } from './auth'

export const useStudentPerformanceStore = defineStore('studentPerformance', () => {
  // State
  const performanceData = ref({})
  const currentStudentId = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const lastFetchTime = ref(null)
  const authStore = useAuthStore()

  // Cache timeout (5 minutes)
  const CACHE_TIMEOUT = 5 * 60 * 1000
  // Helper function to get authorization headers (supports teacher, student, and parent)
  const getAuthHeader = () => {
    let token
    let userRole

    if (authStore.isTeacherAuthenticated && authStore.currentTeacher) {
      // Check for token in different possible fields for teachers
      token =
        authStore.currentTeacher.token ||
        authStore.currentTeacher.access_token ||
        authStore.currentTeacher.accessToken
      userRole = 'teacher'

      console.log('Teacher authentication data for performance:', {
        isAuth: authStore.isTeacherAuthenticated,
        teacher: {
          id: authStore.currentTeacher.teacher_id,
          email: authStore.currentTeacher.teacher_email,
          hasToken: !!token,
        },
      })

      // If we still don't have a token, try to find it in nested objects
      if (!token && typeof authStore.currentTeacher === 'object') {
        Object.keys(authStore.currentTeacher).forEach((key) => {
          const value = authStore.currentTeacher[key]
          if (
            !token &&
            typeof value === 'string' &&
            (key.includes('token') ||
              key.includes('Token') ||
              (value.length > 20 && value.includes('.')))
          ) {
            console.log(`Found potential token in field: ${key}`)
            token = value
          }
        })
      }
    } else if (authStore.isStudentAuthenticated && authStore.currentStudent) {
      // For students accessing their own data
      token =
        authStore.currentStudent.token ||
        authStore.currentStudent.access_token ||
        authStore.currentStudent.accessToken
      userRole = 'student'

      console.log('Student authentication data for performance:', {
        isAuth: authStore.isStudentAuthenticated,
        student: {
          id: authStore.currentStudent.user_id,
          hasToken: !!token,
        },
      })
    } else if (authStore.isParentAuthenticated && authStore.currentUser) {
      // For parents accessing their children's data
      token =
        authStore.currentUser.token ||
        authStore.currentUser.access_token ||
        authStore.currentUser.accessToken
      userRole = 'parent'

      console.log('Parent authentication data for performance:', {
        isAuth: authStore.isParentAuthenticated,
        parent: {
          id: authStore.currentUser.id,
          email: authStore.currentUser.email,
          hasToken: !!token,
        },
      })

      // If we still don't have a token, try to find it in nested objects
      if (!token && typeof authStore.currentUser === 'object') {
        Object.keys(authStore.currentUser).forEach((key) => {
          const value = authStore.currentUser[key]
          if (
            !token &&
            typeof value === 'string' &&
            (key.includes('token') ||
              key.includes('Token') ||
              (value.length > 20 && value.includes('.')))
          ) {
            console.log(`Found potential token in field: ${key}`)
            token = value
          }
        })
      }
    } else {
      console.error('No authenticated user found for performance data')
      return { headers: {} }
    }

    if (!token) {
      console.error(`No token found for ${userRole}. This will likely cause authentication errors.`)
      return { headers: {} }
    }

    console.log(`Setting headers for ${userRole} with token for performance data`)
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        role: userRole,
      },
    }
  }

  // Computed properties
  const currentPerformance = computed(() => {
    return currentStudentId.value ? performanceData.value[currentStudentId.value] : null
  })

  const hasData = computed(() => {
    return currentPerformance.value && currentPerformance.value.summary
  })

  const isDataStale = computed(() => {
    if (!lastFetchTime.value) return true
    return Date.now() - lastFetchTime.value > CACHE_TIMEOUT
  }) // Actions
  const fetchStudentAnalytics = async (studentId, forceRefresh = false) => {
    if (!studentId) {
      throw new Error('Student ID is required')
    }

    // Check cache first
    if (!forceRefresh && performanceData.value[studentId] && !isDataStale.value) {
      currentStudentId.value = studentId
      return performanceData.value[studentId]
    }

    isLoading.value = true
    error.value = null

    try {
      console.log(`Fetching analytics for student: ${studentId}`)

      // Get authentication headers
      const { headers } = getAuthHeader()
      if (!headers || !headers.Authorization) {
        const userType = authStore.isTeacherAuthenticated
          ? 'teacher'
          : authStore.isStudentAuthenticated
            ? 'student'
            : authStore.isParentAuthenticated
              ? 'parent'
              : 'unknown'
        throw new Error(`Tiada pengesahan ${userType} ditemui atau token tidak sah`)
      }

      const response = await api.get(`/student-performance/analytics/${studentId}`, { headers })
      const data = response.data

      // Store the data
      performanceData.value[studentId] = data
      currentStudentId.value = studentId
      lastFetchTime.value = Date.now()

      console.log('Student analytics fetched successfully:', {
        studentId,
        hasData: !!data.summary,
        progressCount: data.progress?.length || 0,
      })

      return data
    } catch (e) {
      console.error('Failed to fetch student analytics:', e)
      error.value = e.response?.data?.error || e.message || 'Failed to fetch analytics'
      throw e
    } finally {
      isLoading.value = false
    }
  }
  const fetchPerformanceSummary = async (studentId) => {
    if (!studentId) {
      throw new Error('Student ID is required')
    }

    try {
      const { headers } = getAuthHeader()
      const response = await api.get(`/student-performance/summary/${studentId}`, { headers })
      return response.data.summary
    } catch (e) {
      console.error('Failed to fetch performance summary:', e)
      throw e
    }
  }

  const fetchProgressByUnit = async (studentId) => {
    if (!studentId) {
      throw new Error('Student ID is required')
    }

    try {
      const { headers } = getAuthHeader()
      const response = await api.get(`/student-performance/progress/${studentId}`, { headers })
      return response.data.progress
    } catch (e) {
      console.error('Failed to fetch progress by unit:', e)
      throw e
    }
  }

  const fetchLearningStyleAnalysis = async (studentId) => {
    if (!studentId) {
      throw new Error('Student ID is required')
    }

    try {
      const { headers } = getAuthHeader()
      const response = await api.get(`/student-performance/learning-style/${studentId}`, {
        headers,
      })
      return response.data.learningStyle
    } catch (e) {
      console.error('Failed to fetch learning style analysis:', e)
      throw e
    }
  }

  const fetchWeeklyActivity = async (studentId) => {
    if (!studentId) {
      throw new Error('Student ID is required')
    }

    try {
      const { headers } = getAuthHeader()
      const response = await api.get(`/student-performance/weekly-activity/${studentId}`, {
        headers,
      })
      return response.data.weeklyActivity
    } catch (e) {
      console.error('Failed to fetch weekly activity:', e)
      throw e
    }
  }

  const fetchAllActivities = async (studentId) => {
    if (!studentId) {
      throw new Error('Student ID is required')
    }

    try {
      const { headers } = getAuthHeader()
      // Use the all-attempts endpoint to get comprehensive data
      const response = await api.get(`/student-performance/all-attempts/${studentId}`, {
        headers,
      })

      // Transform the data to match the expected format
      const attempts = response.data.attempts || []
      return attempts.map((attempt) => ({
        id: attempt.id,
        title:
          attempt.quizzes?.title ||
          `Unit ${attempt.quizzes?.quiz_unit} - Aktiviti ${attempt.quizzes?.no_activity}`,
        unit: attempt.quizzes?.quiz_unit,
        activity: attempt.quizzes?.no_activity,
        quiz_type: attempt.quizzes?.quiz_type,
        score: attempt.score,
        started_at: attempt.started_at,
        completed_at: attempt.completed_at,
        completedAt: attempt.completed_at,
        timeAgo: getTimeAgo(attempt.completed_at),
      }))
    } catch (e) {
      console.error('Failed to fetch all activities:', e)
      throw e
    }
  }

  const fetchAllQuizAttempts = async (studentId) => {
    if (!studentId) {
      throw new Error('Student ID is required')
    }

    try {
      const { headers } = getAuthHeader()
      const response = await api.get(`/student-performance/all-attempts/${studentId}`, {
        headers,
      })

      // Return the raw attempts data for the AllQuizActivities component
      return response.data.attempts || []
    } catch (e) {
      console.error('Failed to fetch all quiz attempts:', e)
      throw e
    }
  }

  const fetchRecentActivity = async (studentId, limit = 10) => {
    if (!studentId) {
      throw new Error('Student ID is required')
    }

    try {
      const { headers } = getAuthHeader()
      const response = await api.get(
        `/student-performance/recent-activity/${studentId}?limit=${limit}`,
        { headers },
      )
      return response.data.recentActivity
    } catch (e) {
      console.error('Failed to fetch recent activity:', e)
      throw e
    }
  }

  // Helper functions for computed data
  const getPerformanceStats = (studentId = null) => {
    const id = studentId || currentStudentId.value
    const data = performanceData.value[id]

    if (!data || !data.summary) {
      return {
        totalQuizzes: 0,
        completedQuizzes: 0,
        averageScore: 0,
        averageTime: 0,
        preferredLearningStyle: null,
      }
    }

    return {
      totalQuizzes: data.summary.totalQuizzes,
      completedQuizzes: data.summary.totalQuizzes,
      averageScore: data.summary.averageScore,
      averageTime: data.summary.averageCompletionTime,
      preferredLearningStyle: data.summary.preferredLearningStyle,
    }
  }

  const getLearningStylePreference = (studentId = null) => {
    const id = studentId || currentStudentId.value
    const data = performanceData.value[id]

    if (!data || !data.learningStyle) {
      return {
        dominant: null,
        percentages: {
          visual: 0,
          kinestetik: 0,
          auditori: 0,
        },
        recommendation: 'Belum ada data untuk analisis gaya pembelajaran.',
      }
    }

    const styles = data.learningStyle
    const percentages = {
      visual: styles.visual?.percentage || 0,
      kinestetik: styles.kinestetik?.percentage || 0,
      auditori: styles.auditori?.percentage || 0,
    }

    // Find dominant style
    const dominant = Object.entries(percentages).sort(([, a], [, b]) => b - a)[0][0]

    return {
      dominant,
      percentages,
      recommendation: styles.recommendation || 'Belum ada rekomendasi.',
    }
  }

  const getTopicPerformance = (studentId = null) => {
    const id = studentId || currentStudentId.value
    const data = performanceData.value[id]

    if (!data || !data.progress) {
      return []
    }

    return data.progress.map((unit) => ({
      topic: getUnitTitle(unit.unit),
      unit: unit.unit,
      completed: unit.completedQuizzes > 0,
      score: unit.averageScore,
      progress: unit.progressPercentage,
      lastActivity: unit.lastActivity,
      completedQuizzes: unit.completedQuizzes,
    }))
  }

  const getWeeklyActivityData = (studentId = null) => {
    const id = studentId || currentStudentId.value
    const data = performanceData.value[id]

    if (!data || !data.weeklyActivity) {
      return []
    }

    return data.weeklyActivity.map((day) => ({
      day: day.day,
      date: day.date,
      timeSpent: day.timeSpent,
      activitiesCompleted: day.activitiesCompleted,
      topicsStudied: day.topicsStudied,
    }))
  }

  const getRecentActivities = (studentId = null) => {
    const id = studentId || currentStudentId.value
    const data = performanceData.value[id]

    if (!data || !data.recentActivity) {
      return []
    }

    return data.recentActivity.map((activity) => ({
      id: activity.id,
      title:
        activity.quizzes?.title ||
        `Unit ${activity.quizzes?.quiz_unit} - Aktiviti ${activity.quizzes?.no_activity}`,
      unit: activity.quizzes?.quiz_unit,
      activity: activity.quizzes?.no_activity,
      type: activity.quizzes?.quiz_type,
      score: activity.score,
      completedAt: activity.completed_at,
      timeAgo: getTimeAgo(activity.completed_at),
    }))
  }

  // Helper function to get unit title
  const getUnitTitle = (unitId) => {
    const titles = {
      1: 'Benda Hidup dan Benda Bukan Hidup',
      2: 'Manusia',
      3: 'Haiwan',
      4: 'Tumbuhan',
      5: 'Cahaya',
      6: 'Air',
      7: 'Bentuk Muka Bumi',
      8: 'Bencana Alam',
      9: 'Kitar Semula',
      10: 'Kenali Malaysia',
      11: 'Masyarakat Di Malaysia',
      12: 'Kemahiran Sosial Di Tempat Awam',
    }
    return titles[unitId] || `Unit ${unitId}`
  }

  // Helper function to get time ago
  const getTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Baru sahaja'
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`

    return date.toLocaleDateString('ms-MY')
  }

  // Clear data
  const clearPerformanceData = () => {
    performanceData.value = {}
    currentStudentId.value = null
    error.value = null
    lastFetchTime.value = null
  }

  const clearError = () => {
    error.value = null
  }
  return {
    // State
    performanceData,
    currentStudentId,
    isLoading,
    error,
    lastFetchTime,

    // Computed
    currentPerformance,
    hasData,
    isDataStale,

    // Actions
    fetchStudentAnalytics,
    fetchPerformanceSummary,
    fetchProgressByUnit,
    fetchLearningStyleAnalysis,
    fetchWeeklyActivity,
    fetchAllActivities,
    fetchAllQuizAttempts,
    fetchRecentActivity,

    // Helper functions
    getPerformanceStats,
    getLearningStylePreference,
    getTopicPerformance,
    getWeeklyActivityData,
    getRecentActivities,
    fetchAllQuizAttempts,
    clearPerformanceData,
    clearError,
  }
})
