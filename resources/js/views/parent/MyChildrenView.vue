<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useStudentsStore } from '@/stores/students'
import { useStudentPerformanceStore } from '@/stores/studentPerformance'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  Clock,
  Trophy,
  TrendingUp,
  Brain,
  CheckCircle2,
  Calendar,
  UserPlus,
  GraduationCap,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Line, Bar, Doughnut, Radar } from 'vue-chartjs'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const auth = useAuthStore()
const studentsStore = useStudentsStore()
const studentPerformanceStore = useStudentPerformanceStore()
const router = useRouter()
const route = useRoute()

const selectedChildId = ref(null)
const activeTab = ref('overview')
const performanceLoading = ref(false)
const performanceError = ref(null)
const allQuizAttempts = ref([])
const allQuizLoading = ref(false)

const myChildren = computed(() => {
  if (!auth.currentUser?.email) return []

  // Map the students from the users store to a consistent format
  // This handles both mock data format and Supabase format
  if (!studentsStore.students || !Array.isArray(studentsStore.students)) return []

  return studentsStore.students.map((student) => ({
    id: student.user_id || student.id || student.student_username,
    name: student.student_name || student.name,
    email: student.student_email || student.email,
    school: student.school_name || student.school || 'Sekolah tidak diketahui',
    class: student.class_name || student.class || 'Kelas tidak diketahui',
    schoolId: student.school_id || student.schoolId,
    classId: student.class_id || student.classId,
    parentEmail: student.parent_email || student.parentEmail,
    // Add formatted display versions with fallbacks
    schoolDisplay:
      student.school ||
      (student.schoolId ? `Sekolah (ID: ${student.schoolId})` : 'Sekolah tidak diketahui'),
    classDisplay:
      student.class ||
      (student.classId ? `Kelas (ID: ${student.classId})` : 'Kelas tidak diketahui'),
  }))
})

// Fetch all quiz attempts for accurate analytics
const fetchAllQuizAttempts = async (studentId) => {
  if (!studentId) return

  try {
    allQuizLoading.value = true
    console.log('Fetching all quiz attempts for student:', studentId)
    const attempts = await studentPerformanceStore.fetchAllQuizAttempts(studentId)
    allQuizAttempts.value = attempts || []
    console.log('Fetched all quiz attempts for parent view:', {
      studentId,
      attemptsCount: allQuizAttempts.value.length,
      firstFewAttempts: allQuizAttempts.value.slice(0, 3).map((a) => ({
        id: a.id,
        quiz_type: a.quiz_type,
        score: a.score,
        time_spent: a.time_spent,
        completed_at: a.completed_at,
      })),
    })
  } catch (error) {
    console.error('Error fetching all quiz attempts:', error)
    allQuizAttempts.value = []
  } finally {
    allQuizLoading.value = false
  }
}

// Fetch additional data if needed
const fetchMissingData = async () => {
  if (!myChildren.value || myChildren.value.length === 0) return

  console.log('Checking for missing school/class data in MyChildrenView')

  for (const child of myChildren.value) {
    // Fetch school data if we have ID but no name
    if (child.schoolId && !child.school) {
      console.log(`Fetching school data for child: ${child.name} (ID: ${child.schoolId})`)
      try {
        const school = await studentsStore.fetchSchoolById(child.schoolId)
        if (school) {
          console.log(`Found school: ${school.name}`)
          child.school = school.name
        }
      } catch (error) {
        console.error(`Error fetching school for ${child.name}:`, error)
      }
    }

    // Fetch class data if we have ID but no name
    if (child.schoolId && child.classId && !child.class) {
      console.log(`Fetching class data for child: ${child.name} (ID: ${child.classId})`)
      try {
        const classData = await studentsStore.fetchClassById(child.schoolId, child.classId)
        if (classData) {
          console.log(`Found class: ${classData.name || classData.class_name}`)
          child.class = classData.class_name || classData.name
        }
      } catch (error) {
        console.error(`Error fetching class for ${child.name}:`, error)
      }
    }
  }
}

// Helper to find the selected child's name
const selectedChildName = computed(() => {
  const child = myChildren.value.find((child) => child.id === selectedChildId.value)
  return child?.name || 'Pilih Pelajar'
})

// Performance data computed properties using all quiz attempts
const currentChildStats = computed(() => {
  if (!selectedChildId.value) return null
  const stats = studentPerformanceStore.getPerformanceStats(selectedChildId.value)
  const topicData = studentPerformanceStore.getTopicPerformance(selectedChildId.value)

  // Ensure we have valid data
  if (!stats || !Array.isArray(topicData)) {
    return {
      totalQuizzes: 12,
      completedQuizzes: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      progressPercentage: 0,
    }
  }

  // Calculate total time spent from all quiz attempts (actual time)
  let totalTimeSpent = 0
  if (allQuizAttempts.value.length > 0) {
    totalTimeSpent = allQuizAttempts.value.reduce((acc, attempt) => {
      return acc + (attempt.time_spent || 0)
    }, 0)
  }

  const completedCount = topicData.filter((topic) => topic.completed).length

  return {
    totalQuizzes: 12, // Total available topics
    completedQuizzes: completedCount,
    averageScore: Math.round(stats.averageScore || 0),
    totalTimeSpent: totalTimeSpent,
    progressPercentage: Math.round((completedCount / 12) * 100),
  }
})

const weeklyActivityData = computed(() => {
  if (!selectedChildId.value) return null
  const activity = studentPerformanceStore.getWeeklyActivityData(selectedChildId.value)
  if (!activity || !Array.isArray(activity) || activity.length === 0) return null

  return {
    labels: activity.map((a) => new Date(a.date).toLocaleDateString('ms-MY', { weekday: 'short' })),
    datasets: [
      {
        label: 'Masa Pembelajaran (minit)',
        data: activity.map((a) => a.timeSpent || 0),
        fill: true,
        borderColor: '#2563eb',
        backgroundColor: '#93c5fd44',
        tension: 0.4,
      },
    ],
  }
})

const topicPerformanceData = computed(() => {
  if (!selectedChildId.value) return null
  const topics = studentPerformanceStore.getTopicPerformance(selectedChildId.value)
  if (!topics || !Array.isArray(topics) || topics.length === 0) return null

  const completedTopics = topics.filter((t) => t.completed)
  if (completedTopics.length === 0) return null

  return {
    labels: completedTopics.map((t) => (t.topic ? t.topic.replace(/^Unit\s+/i, '') : 'Topik')),
    datasets: [
      {
        label: 'Markah Kuiz (%)',
        data: completedTopics.map((t) => Math.round(t.score || 0)),
        backgroundColor: ['#2563eb', '#16a34a', '#ea580c', '#db2777', '#4f46e5'],
      },
    ],
  }
})

const timeDistributionData = computed(() => {
  if (!selectedChildId.value) return null
  const topics = studentPerformanceStore.getTopicPerformance(selectedChildId.value)
  if (!topics || !Array.isArray(topics) || topics.length === 0) return null

  const completedTopics = topics.filter((t) => t.completed)
  if (completedTopics.length === 0) return null

  return {
    labels: completedTopics.map((t) => (t.topic ? t.topic.replace(/^Unit\s+/i, '') : 'Topik')),
    datasets: [
      {
        data: completedTopics.map((t) => (t.completedQuizzes || 0) * 30), // Estimate 30 minutes per quiz
        backgroundColor: ['#93c5fd', '#86efac', '#fdba74', '#f9a8d4', '#c7d2fe'],
      },
    ],
  }
})

// Monthly progress data using all quiz attempts
const monthlyProgressData = computed(() => {
  if (!selectedChildId.value || allQuizAttempts.value.length === 0) return null

  // Generate monthly progress based on actual quiz attempts
  const monthlyData = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

    const monthAttempts = allQuizAttempts.value.filter((attempt) => {
      if (!attempt.completed_at) return false
      const attemptDate = new Date(attempt.completed_at)
      return attemptDate >= month && attemptDate < nextMonth
    })

    const averageScore =
      monthAttempts.length > 0
        ? Math.round(
            monthAttempts.reduce((acc, attempt) => acc + (attempt.score || 0), 0) /
              monthAttempts.length,
          )
        : 0

    const totalHours =
      monthAttempts.reduce((acc, attempt) => acc + (attempt.time_spent || 0), 0) / 60

    monthlyData.push({
      month: month.toLocaleDateString('ms-MY', { month: 'short' }),
      quizAttempts: monthAttempts.length,
      averageScore: averageScore,
      totalHours: Math.round(totalHours * 10) / 10,
    })
  }

  return {
    labels: monthlyData.map((d) => d.month),
    datasets: [
      {
        label: 'Purata Markah (%)',
        data: monthlyData.map((d) => d.averageScore),
        borderColor: '#2563eb',
        backgroundColor: '#93c5fd44',
        yAxisID: 'y',
        fill: true,
      },
      {
        label: 'Kuiz Dicuba',
        data: monthlyData.map((d) => d.quizAttempts),
        borderColor: '#16a34a',
        backgroundColor: '#86efac44',
        yAxisID: 'y1',
        fill: true,
      },
    ],
  }
})

const learningStyleData = computed(() => {
  if (!selectedChildId.value) return null
  const styleData = studentPerformanceStore.getLearningStylePreference(selectedChildId.value)
  if (!styleData || !styleData.percentages) return null

  return {
    labels: ['Visual', 'Auditori', 'Kinestetik'],
    datasets: [
      {
        label: 'Gaya Pembelajaran',
        data: [
          styleData.percentages.visual || 0,
          styleData.percentages.auditori || 0,
          styleData.percentages.kinestetik || 0,
        ],
        backgroundColor: '#93c5fd88',
        borderColor: '#2563eb',
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
      },
    ],
  }
})

// Learning style data - calculated from quiz performance by type (same as student dashboard)
const learningStyle = computed(() => {
  if (!selectedChildId.value) return { visual: 0, auditori: 0, kinestetik: 0 }

  const activities = studentPerformanceStore.getRecentActivities(selectedChildId.value)
  if (!activities || activities.length === 0) {
    return {
      visual: 0,
      auditori: 0,
      kinestetik: 0,
    }
  }

  // Initialize counters for each learning style
  const styleStats = {
    visual: { totalScore: 0, count: 0 },
    auditori: { totalScore: 0, count: 0 },
    kinestetik: { totalScore: 0, count: 0 },
  }

  const quizTypes = ['auditori', 'kinestetik', 'visual']

  // Group quiz scores by learning style type
  activities.forEach((activity, index) => {
    const quizType = activity.quiz_type || quizTypes[index % quizTypes.length]
    const score = activity.score || 0

    if (styleStats[quizType]) {
      styleStats[quizType].totalScore += score
      styleStats[quizType].count += 1
    }
  })

  // Calculate average scores for each style
  const averageScores = {}
  Object.keys(styleStats).forEach((style) => {
    averageScores[style] =
      styleStats[style].count > 0 ? styleStats[style].totalScore / styleStats[style].count : 0
  })

  // Calculate total of all averages
  const totalAverage = Object.values(averageScores).reduce((sum, avg) => sum + avg, 0)

  // Convert to percentages (if total is 0, distribute equally)
  if (totalAverage === 0) {
    return {
      visual: 33,
      auditori: 33,
      kinestetik: 34,
    }
  }

  return {
    visual: Math.round((averageScores.visual / totalAverage) * 100),
    auditori: Math.round((averageScores.auditori / totalAverage) * 100),
    kinestetik: Math.round((averageScores.kinestetik / totalAverage) * 100),
  }
})

// Strength and improvement areas (same as student dashboard)
const strengthAreas = computed(() => {
  if (!selectedChildId.value) return []
  const topics = studentPerformanceStore.getTopicPerformance(selectedChildId.value)
  if (!topics || !topics.length) return []

  // Simple example based on completed topics
  const completed = topics.filter((t) => t.completed && t.score >= 80)
  return completed.slice(0, 3).map((t) => {
    // Clean up topic name to avoid duplication
    const cleanTopic = t.topic ? t.topic.replace(/^Unit\s+/i, '') : 'Topik'
    return { name: `Cemerlang dalam ${cleanTopic}` }
  })
})

const improvementAreas = computed(() => {
  if (!selectedChildId.value) return []
  const topics = studentPerformanceStore.getTopicPerformance(selectedChildId.value)
  if (!topics || !topics.length) return []

  // Simple example based on lower-scoring topics
  const needsImprovement = topics.filter((t) => t.completed && t.score < 70)
  return needsImprovement.slice(0, 3).map((t) => {
    // Clean up topic name to avoid duplication
    const cleanTopic = t.topic ? t.topic.replace(/^Unit\s+/i, '') : 'Topik'
    return { name: `Tingkatkan ${cleanTopic}` }
  })
})

// Recent activities computed from the performance store
const recentActivities = computed(() => {
  if (!selectedChildId.value) return []
  const activities = studentPerformanceStore.getRecentActivities(selectedChildId.value)
  if (!activities || !Array.isArray(activities)) return []

  return activities.slice(0, 5).map((activity) => ({
    id: activity.id,
    title: activity.title,
    score: `${Math.round(activity.score || 0)}%`,
    timeAgo: activity.timeAgo,
    type: activity.type,
    unit: activity.unit,
    activity: activity.activity,
  }))
})

// Performance stats similar to student dashboard
const performanceStats = computed(() => {
  if (!selectedChildId.value) return null
  return studentPerformanceStore.getPerformanceStats(selectedChildId.value)
})

// Topic performance similar to student dashboard
const topicPerformance = computed(() => {
  if (!selectedChildId.value) return []
  return studentPerformanceStore.getTopicPerformance(selectedChildId.value)
})

// Learning analytics similar to student dashboard
const learningAnalytics = computed(() => {
  if (!selectedChildId.value) return null
  return studentPerformanceStore.getLearningStylePreference(selectedChildId.value)
})

// Weekly activity similar to student dashboard
const weeklyActivity = computed(() => {
  if (!selectedChildId.value) return []
  return studentPerformanceStore.getWeeklyActivityData(selectedChildId.value)
})

// Dashboard stats using all quiz attempts for accurate analytics
const dashboardStats = computed(() => {
  if (!selectedChildId.value) return null
  const stats = performanceStats.value

  console.log('Dashboard stats calculation:', {
    selectedChildId: selectedChildId.value,
    hasStats: !!stats,
    allQuizAttemptsCount: allQuizAttempts.value.length,
    allQuizAttemptsData: allQuizAttempts.value.slice(0, 3), // Show first 3 for debugging
  })

  if (!stats) {
    return {
      quizAttempts: '0',
      booksRead: '0',
      overallProgress: '0%',
      averageScore: '0%',
      totalTimeSpent: '0 minit',
    }
  }

  // Calculate total quiz attempts from all attempts data
  const totalAttempts = allQuizAttempts.value.length

  // Calculate total learning time from all attempts
  let totalTimeSpentMinutes = 0
  if (allQuizAttempts.value.length > 0) {
    totalTimeSpentMinutes = allQuizAttempts.value.reduce((total, attempt) => {
      return total + (attempt.time_spent || 0)
    }, 0)
  }

  console.log('Time calculation:', {
    totalTimeSpentMinutes,
    attemptsWithTime: allQuizAttempts.value.filter((a) => a.time_spent > 0).length,
  })

  // Format time display
  const formatTime = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      if (remainingMinutes === 0) {
        return `${hours} jam`
      } else {
        return `${hours} jam ${remainingMinutes} minit`
      }
    } else {
      return `${minutes} minit`
    }
  }

  // Calculate average score from all attempts
  let averageScore = 0
  if (allQuizAttempts.value.length > 0) {
    const totalScore = allQuizAttempts.value.reduce((total, attempt) => {
      return total + (attempt.score || 0)
    }, 0)
    averageScore = Math.round(totalScore / allQuizAttempts.value.length)
  }

  const result = {
    quizAttempts: totalAttempts.toString(),
    booksRead: Math.floor((stats.completedQuizzes || 0) / 2).toString(),
    overallProgress: `${Math.round(((stats.completedQuizzes || 0) / (stats.totalQuizzes || 12)) * 100)}%`,
    averageScore: `${averageScore}%`,
    totalTimeSpent: formatTime(totalTimeSpentMinutes),
  }

  console.log('Dashboard stats result:', result)
  return result
})

// Enhanced chart options
const monthlyProgressOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: {
        display: true,
        text: 'Purata Markah (%)',
      },
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: 'Kuiz Dicuba',
      },
      grid: {
        drawOnChartArea: false,
      },
    },
  },
}

const radarChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
  scales: {
    r: {
      min: 0,
      max: 100,
      beginAtZero: true,
    },
  },
}

// Chart options
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
}

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
    },
  },
}

// Load initial data
onMounted(async () => {
  if (!auth.isParentAuthenticated) {
    router.push('/parent/login')
    return // Don't proceed if not authenticated
  }

  console.log('Parent authenticated, fetching students')

  // Fetch the parent's children from Supabase
  if (auth.currentUser?.email || auth.currentUser?.parent_email) {
    const parentEmail = auth.currentUser?.email || auth.currentUser?.parent_email
    console.log('Fetching students for parent email:', parentEmail)
    await studentsStore.fetchStudentsByParent(parentEmail)
  }

  console.log('Available children:', myChildren.value)

  if (myChildren.value.length > 0) {
    // Check if there's a student ID in the route parameter
    const routeStudentId = route.params.studentId
    let targetChild = null

    if (routeStudentId) {
      // Try to find the student with the matching ID
      targetChild = myChildren.value.find((child) => child.id === routeStudentId)
      if (targetChild) {
        console.log(
          'Found student from route parameter:',
          targetChild.name,
          'with ID:',
          routeStudentId,
        )
      } else {
        console.warn(
          'Student ID from route not found in children list, falling back to first child',
        )
      }
    }

    // If no route parameter or student not found, use the first child
    if (!targetChild) {
      targetChild = myChildren.value[0]
      console.log('Selected first child:', targetChild.name, 'with ID:', targetChild.id)
    }

    selectedChildId.value = targetChild.id

    performanceLoading.value = true
    try {
      // Fetch analytics and all quiz attempts in parallel
      await Promise.all([
        studentPerformanceStore.fetchStudentAnalytics(selectedChildId.value),
        fetchAllQuizAttempts(selectedChildId.value),
      ])
    } catch (error) {
      console.error('Failed to fetch initial performance data:', error)
      performanceError.value = 'Gagal memuatkan data prestasi. Sila cuba lagi.'
    } finally {
      performanceLoading.value = false
    }
  } else {
    console.warn('No children available to select')
  }

  // Fetch additional data if needed
  await fetchMissingData()
  await fetchMissingData()
})

// Watch for child selection changes
watch(selectedChildId, async (newId) => {
  if (newId) {
    console.log('Selected child changed to ID:', newId)
    performanceLoading.value = true
    performanceError.value = null

    try {
      // Fetch analytics and all quiz attempts in parallel
      await Promise.all([
        studentPerformanceStore.fetchStudentAnalytics(newId),
        fetchAllQuizAttempts(newId),
      ])
      console.log('Performance data and quiz attempts fetched successfully for:', newId)
    } catch (error) {
      console.error('Failed to fetch performance data:', error)
      performanceError.value = 'Gagal memuatkan data prestasi. Sila cuba lagi.'
    } finally {
      performanceLoading.value = false
    }
  } else {
    console.warn('No student ID selected')
    performanceLoading.value = false
    performanceError.value = null
    allQuizAttempts.value = []
  }
})

// Watch for route parameter changes
watch(
  () => route.params.studentId,
  (newStudentId) => {
    if (newStudentId && myChildren.value.length > 0) {
      const targetChild = myChildren.value.find((child) => child.id === newStudentId)
      if (targetChild && selectedChildId.value !== newStudentId) {
        console.log('Route parameter changed, switching to student:', targetChild.name)
        selectedChildId.value = newStudentId
      }
    }
  },
)
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8 space-y-6">
    <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
      <h1 class="text-2xl font-bold">Prestasi Anak-Anak</h1>

      <!-- Student selector -->
      <div class="flex items-center">
        <Select v-model="selectedChildId" class="w-full md:w-64">
          <SelectTrigger>
            <SelectValue :placeholder="'Pilih Pelajar'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="child in myChildren" :key="child.id" :value="child.id">
              {{ child.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="studentsStore.loading" class="flex justify-center items-center p-16">
      <div
        class="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"
      ></div>
    </div>

    <!-- Error state -->
    <Card v-if="studentsStore.error && !studentsStore.loading" class="max-w-md mx-auto mt-8">
      <CardContent class="p-6 text-center">
        <h2 class="text-lg font-medium text-red-600 mb-3">Ralat</h2>
        <p class="text-gray-600 mb-6">{{ studentsStore.error }}</p>
        <Button @click="studentsStore.fetchStudentsByParent(auth.currentUser?.email)">
          Cuba Lagi
        </Button>
      </CardContent>
    </Card>

    <!-- No students selected yet -->
    <div v-else-if="!selectedChildId && myChildren.length > 0" class="text-center p-8">
      <GraduationCap class="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium mb-2">Pilih Pelajar</h3>
      <p class="text-gray-500 max-w-md mx-auto">
        Sila pilih seorang pelajar daripada senarai di atas untuk melihat prestasi pembelajaran
        mereka.
      </p>
    </div>

    <!-- Empty state - no students registered -->
    <Card v-else-if="myChildren.length === 0 && !studentsStore.loading" class="mb-8">
      <CardContent class="p-8 text-center">
        <UserPlus class="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium mb-2">Tiada Pelajar Berdaftar</h3>
        <p class="text-gray-500 mb-6 max-w-md mx-auto">
          Anda belum mendaftarkan sebarang pelajar. Daftar pelajar baharu untuk mula pantau prestasi
          pembelajaran mereka.
        </p>
        <Button @click="router.push('/parent/register-student')">Daftar Pelajar Sekarang</Button>
      </CardContent>
    </Card>

    <!-- Student performance data -->
    <div v-else-if="selectedChildId && !studentsStore.loading" class="space-y-6">
      <!-- Student info card -->
      <Card class="mb-8">
        <CardHeader>
          <CardTitle>{{ selectedChildName }}</CardTitle>
          <CardDescription>
            {{
              myChildren.find((c) => c.id === selectedChildId)?.school || 'Sekolah tidak diketahui'
            }}
            |
            {{ myChildren.find((c) => c.id === selectedChildId)?.class || 'Kelas tidak diketahui' }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex flex-wrap gap-4">
            <div class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center">
              <GraduationCap class="h-4 w-4 mr-1" /> Pelajar
            </div>
            <div
              class="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm flex items-center"
            >
              <Calendar class="h-4 w-4 mr-1" /> Tahun 4
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Performance loading state -->
      <div v-if="performanceLoading" class="flex justify-center items-center p-16">
        <div class="text-center">
          <div
            class="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          ></div>
          <p class="text-gray-600">Memuatkan data prestasi...</p>
        </div>
      </div>

      <!-- Performance error state -->
      <Card v-else-if="performanceError" class="mb-8">
        <CardContent class="p-8 text-center">
          <div class="text-red-500 mb-4">
            <svg class="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-red-600 mb-2">Ralat Memuatkan Data</h3>
          <p class="text-gray-600 mb-6">{{ performanceError }}</p>
          <Button
            @click="
              async () => {
                performanceLoading.value = true
                performanceError.value = null
                try {
                  await Promise.all([
                    studentPerformanceStore.fetchStudentAnalytics(selectedChildId.value),
                    fetchAllQuizAttempts(selectedChildId.value),
                  ])
                } catch (error) {
                  performanceError.value = 'Gagal memuatkan data prestasi. Sila cuba lagi.'
                } finally {
                  performanceLoading.value = false
                }
              }
            "
          >
            Cuba Lagi
          </Button>
        </CardContent>
      </Card>

      <!-- Performance data content -->
      <div v-else>
        <Tabs v-model="activeTab" class="w-full">
          <TabsList class="w-full justify-start mb-6 overflow-x-auto">
            <TabsTrigger value="overview">Ringkasan</TabsTrigger>
            <TabsTrigger value="progress">Kemajuan</TabsTrigger>
            <TabsTrigger value="analytics">Analitik</TabsTrigger>
          </TabsList>

          <!-- Overview Tab -->
          <TabsContent value="overview" class="space-y-6">
            <!-- Quick Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardContent class="p-6 flex items-center gap-4">
                  <div class="p-3 bg-green-100 rounded-full">
                    <CheckCircle2 class="h-6 w-6 text-green-700" />
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Percubaan Kuiz</p>
                    <p class="text-2xl font-bold">
                      {{ dashboardStats ? dashboardStats.quizAttempts : '0' }}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent class="p-6 flex items-center gap-4">
                  <div class="p-3 bg-yellow-100 rounded-full">
                    <Trophy class="h-6 w-6 text-yellow-700" />
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Purata Markah</p>
                    <p class="text-2xl font-bold">
                      {{ currentChildStats ? currentChildStats.averageScore + '%' : '0%' }}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <!-- Recent Activities -->
            <Card class="mb-8">
              <CardHeader>
                <CardTitle>Aktiviti Terkini</CardTitle>
                <CardDescription>Prestasi kuiz dan aktiviti pembelajaran terbaru</CardDescription>
              </CardHeader>
              <CardContent>
                <div v-if="recentActivities.length > 0" class="space-y-4">
                  <div
                    v-for="activity in recentActivities"
                    :key="activity.id"
                    class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div class="flex items-center gap-3">
                      <div class="p-2 bg-blue-100 text-blue-600 rounded-full">
                        <BookOpen class="h-4 w-4" />
                      </div>
                      <div>
                        <p class="font-medium">{{ activity.title }}</p>
                        <p class="text-sm text-gray-500">{{ activity.timeAgo }}</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p
                        class="font-bold text-lg"
                        :class="[
                          parseInt(activity.score) >= 80
                            ? 'text-green-600'
                            : parseInt(activity.score) >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600',
                        ]"
                      >
                        {{ activity.score }}
                      </p>
                      <p class="text-sm text-gray-500">
                        {{
                          activity.type
                            ? activity.type.charAt(0).toUpperCase() + activity.type.slice(1)
                            : 'Kuiz'
                        }}
                      </p>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-8 text-gray-500">
                  <BookOpen class="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Tiada aktiviti terkini</p>
                </div>
              </CardContent>
            </Card>

            <!-- Weekly Activity chart -->
            <Card class="mb-8">
              <CardHeader>
                <CardTitle>Aktiviti Mingguan</CardTitle>
                <CardDescription> Aktiviti pembelajaran mingguan dalam minit </CardDescription>
              </CardHeader>
              <CardContent class="h-80">
                <Line
                  :data="
                    weeklyActivityData || {
                      labels: ['Tiada Data Tersedia'],
                      datasets: [
                        {
                          label: 'Minit',
                          data: [0],
                          borderColor: '#3b82f6',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          fill: true,
                          tension: 0.4,
                        },
                      ],
                    }
                  "
                  :options="lineChartOptions"
                />
              </CardContent>
            </Card>

            <!-- Topic performance -->
            <Card>
              <CardHeader>
                <CardTitle>Prestasi Mengikut Topik</CardTitle>
                <CardDescription> Pencapaian mengikut topik pembelajaran </CardDescription>
              </CardHeader>
              <CardContent class="h-80">
                <Bar
                  :data="
                    topicPerformanceData || {
                      labels: ['Tiada Data Tersedia'],
                      datasets: [
                        {
                          label: 'Markah (%)',
                          data: [0],
                          backgroundColor: ['rgba(59, 130, 246, 0.7)'],
                        },
                      ],
                    }
                  "
                  :options="lineChartOptions"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <!-- Progress Tab -->
          <TabsContent value="progress" class="space-y-6">
            <!-- Monthly Progress Chart -->
            <Card class="mb-8">
              <CardHeader>
                <CardTitle>Perkembangan Bulanan</CardTitle>
                <CardDescription> Peningkatan prestasi sepanjang tahun </CardDescription>
              </CardHeader>
              <CardContent class="h-80">
                <Line
                  :data="
                    monthlyProgressData || {
                      labels: ['Tiada Data Tersedia'],
                      datasets: [
                        {
                          label: 'Markah (%)',
                          data: [0],
                          borderColor: '#3b82f6',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          yAxisID: 'y',
                          fill: true,
                        },
                        {
                          label: 'Kuiz Dicuba',
                          data: [0],
                          borderColor: '#10b981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          yAxisID: 'y1',
                          fill: true,
                        },
                      ],
                    }
                  "
                  :options="monthlyProgressOptions"
                />
              </CardContent>
            </Card>

            <!-- Time Distribution -->
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Masa Pembelajaran</CardTitle>
                <CardDescription> Pembahagian masa mengikut topik </CardDescription>
              </CardHeader>
              <CardContent class="h-80">
                <Doughnut
                  :data="
                    timeDistributionData || {
                      labels: ['Tiada Data Tersedia'],
                      datasets: [
                        {
                          label: 'Masa (minit)',
                          data: [0],
                          backgroundColor: ['rgba(59, 130, 246, 0.7)'],
                        },
                      ],
                    }
                  "
                  :options="doughnutChartOptions"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <!-- Analytics Tab -->
          <TabsContent value="analytics" class="space-y-6">
            <!-- Learning Analytics (same format as student dashboard) -->
            <Card class="mb-8">
              <CardHeader>
                <CardTitle>Analisis Pembelajaran</CardTitle>
                <CardDescription>Gaya pembelajaran dan kekuatan anak anda</CardDescription>
              </CardHeader>
              <CardContent>
                <div v-if="performanceLoading" class="flex justify-center py-4">
                  <div
                    class="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"
                  ></div>
                </div>
                <div v-else class="space-y-6">
                  <!-- Learning Style -->
                  <div>
                    <h4 class="font-medium mb-2">Gaya Pembelajaran</h4>
                    <div class="grid grid-cols-3 gap-4">
                      <div class="bg-blue-50 rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-blue-600 mb-1">
                          {{ learningStyle.visual }}%
                        </div>
                        <div class="text-sm text-gray-600">Visual</div>
                      </div>
                      <div class="bg-green-50 rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-green-600 mb-1">
                          {{ learningStyle.auditori }}%
                        </div>
                        <div class="text-sm text-gray-600">Auditori</div>
                      </div>
                      <div class="bg-purple-50 rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-purple-600 mb-1">
                          {{ learningStyle.kinestetik }}%
                        </div>
                        <div class="text-sm text-gray-600">Kinestetik</div>
                      </div>
                    </div>
                  </div>

                  <!-- Strengths and Areas for Improvement -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 class="font-medium mb-2">Bidang Kekuatan</h4>
                      <ul class="space-y-2">
                        <li
                          v-for="(area, index) in strengthAreas"
                          :key="index"
                          class="flex items-center"
                        >
                          <span class="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {{ area.name }}
                        </li>
                        <li v-if="strengthAreas.length === 0" class="text-gray-500">
                          Belum cukup data
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 class="font-medium mb-2">Bidang Untuk Dipertingkatkan</h4>
                      <ul class="space-y-2">
                        <li
                          v-for="(area, index) in improvementAreas"
                          :key="index"
                          class="flex items-center"
                        >
                          <span class="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                          {{ area.name }}
                        </li>
                        <li v-if="improvementAreas.length === 0" class="text-gray-500">
                          Belum cukup data
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Learning Style Chart (optional additional visualization) -->
            <Card>
              <CardHeader>
                <CardTitle>Visualisasi Gaya Pembelajaran</CardTitle>
                <CardDescription>
                  Kecenderungan gaya pembelajaran dalam bentuk radar chart
                </CardDescription>
              </CardHeader>
              <CardContent class="h-80">
                <Radar
                  :data="{
                    labels: ['Visual', 'Auditori', 'Kinestetik'],
                    datasets: [
                      {
                        label: 'Kecenderungan (%)',
                        data: [
                          learningStyle.visual,
                          learningStyle.auditori,
                          learningStyle.kinestetik,
                        ],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                        pointBorderColor: '#fff',
                      },
                    ],
                  }"
                  :options="radarChartOptions"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <!-- Close performance data content div -->
    </div>
    <!-- Close student performance data div -->
  </div>
  <!-- Close main container div -->
</template>
