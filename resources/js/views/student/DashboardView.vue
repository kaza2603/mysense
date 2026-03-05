<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useStudentPerformanceStore } from '@/stores/studentPerformance'
import { useStudentsStore } from '@/stores/students'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Book,
  Activity,
  Calendar,
  Award,
  BookOpen,
  Clock,
  Zap,
  CheckCircle,
  BarChart3,
  TrendingUp,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AllQuizActivities from '@/components/student/AllQuizActivities.vue'

const router = useRouter()
const auth = useAuthStore()
const studentPerformanceStore = useStudentPerformanceStore()
const studentsStore = useStudentsStore()

// State for student profile
const studentProfile = ref(null)
const allActivitiesData = ref([])

// Modal state
const showActivitiesModal = ref(false)

const student = computed(() => {
  // Use fetched student profile if available, fallback to auth store data
  if (studentProfile.value) {
    return {
      name: studentProfile.value.name || studentProfile.value.student_name || '-',
      class:
        studentProfile.value.class || studentProfile.value.class_name || 'Kelas Tidak Diketahui',
      school:
        studentProfile.value.school ||
        studentProfile.value.school_name ||
        'Sekolah Tidak Diketahui',
      avatarUrl: studentProfile.value.avatarUrl || '/images/avatar-placeholder.png',
      email: studentProfile.value.email || studentProfile.value.student_email || '',
      username: studentProfile.value.username || studentProfile.value.student_username || '',
    }
  }
  // Fallback to auth store data
  if (auth.currentStudent) {
    return {
      name: auth.currentStudent.name || auth.currentStudent.student_name || '-',
      class: auth.currentStudent.class || auth.currentStudent.class_name || 'Kelas Tidak Diketahui',
      school:
        auth.currentStudent.school || auth.currentStudent.school_name || 'Sekolah Tidak Diketahui',
      avatarUrl: auth.currentStudent.avatarUrl || '/images/avatar-placeholder.png',
      email: auth.currentStudent.email || auth.currentStudent.student_email || '',
      username: auth.currentStudent.username || auth.currentStudent.student_username || '',
    }
  }
  // Default fallback
  return {
    name: 'Pelajar IstimewaKu',
    class: 'Kelas Tidak Diketahui',
    school: 'Sekolah Tidak Diketahui',
    avatarUrl: '/images/avatar-placeholder.png',
    email: '',
    username: '',
  }
})

const studentId = computed(() => {
  // Get student ID from profile, auth store, or use username as fallback
  if (studentProfile.value?.user_id) return studentProfile.value.user_id
  if (auth.currentStudent?.user_id) return auth.currentStudent.user_id
  if (auth.currentStudent?.username) return auth.currentStudent.username
  if (auth.currentStudent?.student_username) return auth.currentStudent.student_username
  return null
})
const isLoading = ref(true)

// Use the new performance store
const performanceStats = computed(() => studentPerformanceStore.getPerformanceStats())
const topicPerformance = computed(() => studentPerformanceStore.getTopicPerformance())
const learningAnalytics = computed(() => studentPerformanceStore.getLearningStylePreference())
const weeklyActivity = computed(() => studentPerformanceStore.getWeeklyActivityData())

// Transform quiz data into recent activities format
const recentActivities = computed(() => {
  // Use allActivitiesData for more comprehensive data, but limit to recent 3
  const activities =
    allActivitiesData.value.length > 0
      ? allActivitiesData.value
      : studentPerformanceStore.getRecentActivities()

  return activities.slice(0, 3).map((activity) => {
    // Calculate actual time spent if we have start and complete times
    let timeSpent = 'N/A'
    if (activity.started_at && activity.completed_at) {
      const start = new Date(activity.started_at)
      const end = new Date(activity.completed_at)
      const minutes = Math.round((end - start) / (1000 * 60))
      if (minutes > 0) {
        timeSpent =
          minutes >= 60
            ? `${Math.floor(minutes / 60)} jam ${minutes % 60} minit`
            : `${minutes} minit`
      } else {
        timeSpent = '< 1 minit'
      }
    }

    // Debug logging
    console.log('Activity time calculation:', {
      title: activity.title,
      started_at: activity.started_at,
      completed_at: activity.completed_at,
      timeSpent,
    })

    return {
      title: activity.title,
      date: activity.timeAgo,
      score: `${activity.score}%`,
      icon: Activity,
      color: 'bg-blue-100 text-blue-600',
      timeSpent: timeSpent,
    }
  })
})

// Helper function to extract topic from quiz title
const getTopicFromTitle = (title) => {
  if (!title) return 'Topik Umum'

  // Simple topic extraction based on common keywords
  const topicMap = {
    ekosistem: 'Ekosistem dan Alam Sekitar',
    biodiversiti: 'Biodiversiti dan Konservasi',
    fotosintesis: 'Fotosintesis dan Respirasi',
    genetik: 'Genetik dan Keturunan',
    sel: 'Struktur dan Fungsi Sel',
    evolusi: 'Evolusi dan Adaptasi',
    mikroorganisma: 'Mikroorganisma dan Penyakit',
    nutrisi: 'Nutrisi dan Pencernaan',
    sistem: 'Sistem Badan Manusia',
    fizik: 'Fizik dan Kimia',
    matter: 'Jirim dan Bahan',
    tenaga: 'Tenaga dan Alam',
    sains: 'Sains Umum',
  }

  const titleLower = title.toLowerCase()
  for (const [keyword, topic] of Object.entries(topicMap)) {
    if (titleLower.includes(keyword)) {
      return topic
    }
  }

  return 'Sains Umum'
}

// Generate upcoming lessons based on incomplete topics
const upcomingLessons = computed(() => {
  if (!topicPerformance.value.length) return []

  // Get incomplete topics for upcoming lessons
  const incomplete = topicPerformance.value.filter((quiz) => !quiz.completed).slice(0, 3)

  // Icon array for variety
  const icons = [Clock, BookOpen, Calendar, Zap]

  // Current date
  const currentDate = new Date()

  return incomplete.map((quiz, index) => {
    // Schedule lessons for coming days
    const lessonDate = new Date(currentDate)
    lessonDate.setDate(currentDate.getDate() + index + 1)
    const formattedDate = lessonDate.toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    // Randomize time slot
    const hours = 8 + Math.floor(Math.random() * 5) // Between 8 and 12
    const minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)]
    const timeString = `${hours}:${minutes.toString().padStart(2, '0')} ${hours < 12 ? 'pagi' : 'petang'}`

    return {
      subject: 'Sains',
      topic: quiz.topic,
      date: formattedDate,
      time: timeString,
      icon: icons[index % icons.length],
    }
  })
})

// Stats for the dashboard cards
const dashboardStats = computed(() => {
  const stats = performanceStats.value
  const weeklyData = studentPerformanceStore.getWeeklyActivityData()

  if (!stats) {
    return {
      quizAttempts: '0',
      booksRead: '0',
      overallProgress: '0%',
      averageScore: '0%',
      totalTimeSpent: '0 minit',
    }
  }

  // Use all activities data for accurate counts
  const totalAttempts = allActivitiesData.value.length

  // Calculate total learning time from actual quiz attempts
  let totalMinutes = 0
  if (allActivitiesData.value.length > 0) {
    totalMinutes = allActivitiesData.value.reduce((total, activity) => {
      if (activity.started_at && activity.completed_at) {
        const start = new Date(activity.started_at)
        const end = new Date(activity.completed_at)
        const minutes = Math.round((end - start) / (1000 * 60))
        return total + (minutes > 0 ? minutes : 0)
      }
      return total
    }, 0)
  }

  // Fallback to weekly data if no quiz time data available
  if (totalMinutes === 0 && weeklyData && Array.isArray(weeklyData)) {
    totalMinutes = weeklyData.reduce((total, day) => total + (day.timeSpent || 0), 0)
  }

  return {
    quizAttempts: totalAttempts.toString(),
    booksRead: Math.floor(stats.completedQuizzes / 2).toString(),
    overallProgress: `${Math.round((stats.completedQuizzes / stats.totalQuizzes) * 100)}%`,
    averageScore: `${stats.averageScore}%`,
    totalTimeSpent:
      totalMinutes > 60
        ? `${Math.round((totalMinutes / 60) * 10) / 10} jam`
        : `${totalMinutes} minit`,
  }
})

// Learning style data - calculated from quiz performance by type
const learningStyle = computed(() => {
  const activities = studentPerformanceStore.getRecentActivities()
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

// Strength and improvement areas - simplified for now
const strengthAreas = computed(() => {
  const topics = topicPerformance.value
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
  const topics = topicPerformance.value
  if (!topics || !topics.length) return []

  // Simple example based on lower-scoring topics
  const needsImprovement = topics.filter((t) => t.completed && t.score < 70)
  return needsImprovement.slice(0, 3).map((t) => {
    // Clean up topic name to avoid duplication
    const cleanTopic = t.topic ? t.topic.replace(/^Unit\s+/i, '') : 'Topik'
    return { name: `Tingkatkan ${cleanTopic}` }
  })
})

// Utility method for formatting dates
const formatDate = (dateString) => {
  if (!dateString) return 'Tarikh tidak diketahui'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (error) {
    return dateString
  }
}

const handleLogout = () => {
  auth.logoutStudent()
  router.push('/')
}

// Fetch student profile data
const fetchStudentProfile = async () => {
  if (!auth.currentStudent) {
    console.error('No authenticated student found')
    return
  }

  try {
    let profile = null

    // Try to fetch by user_id first
    if (auth.currentStudent.user_id) {
      profile = await studentsStore.fetchStudentProfile(auth.currentStudent.user_id)
    }

    // If no profile found and we have username, try username
    if (!profile && auth.currentStudent.student_username) {
      profile = await studentsStore.fetchStudentProfileByUsername(
        auth.currentStudent.student_username,
      )
    }

    if (profile) {
      studentProfile.value = profile
      console.log('Student profile loaded:', profile)
    } else {
      console.warn('Could not fetch student profile, using auth store data')
    }
  } catch (error) {
    console.error('Error fetching student profile:', error)
    toast.error('Ralat', {
      description: 'Gagal memuat profil pelajar. Menggunakan data tempatan.',
    })
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    // Check if student is authenticated
    if (!auth.isStudentAuthenticated || !auth.currentStudent) {
      console.error('Student not authenticated, redirecting to login')
      router.push('/student-login')
      return
    }

    // Fetch student profile first
    await fetchStudentProfile()

    // Then fetch performance data if we have a student ID
    if (studentId.value) {
      // Fetch comprehensive analytics
      await studentPerformanceStore.fetchStudentAnalytics(studentId.value)

      // Fetch all activities for accurate dashboard stats
      try {
        allActivitiesData.value = await studentPerformanceStore.fetchAllActivities(studentId.value)
        console.log('Loaded all activities:', allActivitiesData.value.length)
      } catch (error) {
        console.warn('Could not fetch all activities, using recent activities:', error)
        // Fallback to recent activities if all activities fetch fails
        allActivitiesData.value = studentPerformanceStore.getRecentActivities()
      }
    } else {
      console.warn('No student ID available for performance data')
      toast.warning('Amaran', {
        description: 'Tidak dapat memuat data prestasi. ID pelajar tidak dijumpai.',
      })
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    toast.error('Ralat', {
      description: 'Gagal memuat data dashboard. Sila cuba lagi.',
    })
  } finally {
    isLoading.value = false
  }
})

// Helper function to get initials from name
const getNameInitials = (name) => {
  if (!name) return '?'

  // Split the name by spaces
  const nameParts = name.trim().split(/\s+/)

  if (nameParts.length === 1) {
    // If only one name, use the first two letters
    return nameParts[0].substring(0, 2).toUpperCase()
  } else {
    // Get first letter of first name and first letter of last name
    const firstInitial = nameParts[0].charAt(0)
    const lastInitial = nameParts[nameParts.length - 1].charAt(0)
    return (firstInitial + lastInitial).toUpperCase()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
    <!-- Enhanced Header with gradient and better styling -->
    <div class="bg-gradient-to-r from-yellow-700 via-yellow-400 to-orange-400 shadow-lg">
      <div class="container mx-auto px-6 py-8">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <div class="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <BookOpen class="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white drop-shadow-sm">
                Portal Pelajar IstimewaKu
              </h1>
              <p class="text-yellow-100 text-sm">Pembelajaran Interaktif & Menyeronokkan</p>
            </div>
          </div>
          <Button
            variant="outline"
            class="bg-white/90 backdrop-blur-sm border-white/20 text-yellow-700 hover:bg-white transition-all duration-200 shadow-lg"
            @click="handleLogout"
          >
            <Award class="mr-2 h-4 w-4" />
            Log Keluar
          </Button>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-6 py-8 -mt-4">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Enhanced Sidebar / Student Profile -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Student Profile Card with enhanced design -->
          <Card class="bg-white/70 backdrop-blur-sm shadow-xl border-0 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-20"></div>
            <CardContent class="relative pt-0 pb-6">
              <div class="flex flex-col items-center -mt-12">
                <div class="relative">
                  <div
                    class="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 p-1 shadow-lg"
                  >
                    <div
                      class="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center text-yellow-600 font-bold text-2xl"
                    >
                      <template v-if="student.avatarUrl">
                        <img
                          :src="student.avatarUrl"
                          class="w-full h-full object-cover rounded-full"
                          onerror="this.parentNode.innerHTML = this.getAttribute('data-initials')"
                          :data-initials="getNameInitials(student.name)"
                        />
                      </template>
                      <template v-else>
                        {{ getNameInitials(student.name) }}
                      </template>
                    </div>
                  </div>
                  <div
                    class="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <CheckCircle class="h-4 w-4 text-white" />
                  </div>
                </div>
                <div class="text-center mt-4">
                  <h3 class="text-xl font-bold text-gray-800">{{ student.name }}</h3>
                  <div class="flex items-center justify-center mt-1 text-blue-600">
                    <Award class="h-4 w-4 mr-1" />
                    <span class="font-medium">{{ student.class }}</span>
                  </div>
                  <p class="text-gray-600 text-sm mt-1">{{ student.school }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Enhanced Quick Menu -->
          <Card class="bg-white/70 backdrop-blur-sm shadow-xl border-0">
            <CardHeader class="pb-3">
              <CardTitle class="flex items-center text-gray-800">
                <Zap class="mr-2 h-5 w-5 text-yellow-500" />
                Menu Pantas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <nav class="space-y-3">
                <Button
                  variant="ghost"
                  class="w-full justify-start h-12 text-left hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                  @click="$router.push({ name: 'student-digital-book' })"
                >
                  <div
                    class="bg-blue-100 group-hover:bg-blue-200 rounded-lg p-2 mr-3 transition-colors"
                  >
                    <Book class="h-4 w-4 text-blue-600" />
                  </div>
                  <span class="font-medium">Buku Digital</span>
                </Button>
                <Button
                  variant="ghost"
                  class="w-full justify-start h-12 text-left hover:bg-green-50 hover:text-green-700 transition-all duration-200 group"
                  @click="$router.push({ name: 'student-kuiz-interaktif' })"
                >
                  <div
                    class="bg-green-100 group-hover:bg-green-200 rounded-lg p-2 mr-3 transition-colors"
                  >
                    <Activity class="h-4 w-4 text-green-600" />
                  </div>
                  <span class="font-medium">Kuiz Interaktif</span>
                </Button>
                <Button
                  variant="ghost"
                  class="w-full justify-start h-12 text-left hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 group"
                  @click="$router.push({ name: 'student-learning-videos' })"
                >
                  <div
                    class="bg-purple-100 group-hover:bg-purple-200 rounded-lg p-2 mr-3 transition-colors"
                  >
                    <Award class="h-4 w-4 text-purple-600" />
                  </div>
                  <span class="font-medium">Video Pembelajaran</span>
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>

        <!-- Enhanced Main Content -->
        <div class="lg:col-span-3 space-y-8">
          <!-- Welcome Header with animation -->
          <div class="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
            <div class="flex items-center justify-between">
              <div>
                <h2
                  class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                  Selamat Datang, {{ student.name }}!
                </h2>
                <p class="text-gray-600 mt-2">Mari kita teruskan pembelajaran hari ini</p>
              </div>
              <div class="hidden md:block">
                <div class="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-4">
                  <BarChart3 class="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <!-- Enhanced Statistics Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              class="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <CardContent class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-blue-100 font-medium mb-1">Kuiz Dicuba</p>
                    <p class="text-3xl font-bold">{{ dashboardStats.quizAttempts }}</p>
                    <p class="text-blue-200 text-sm mt-1">
                      +{{ Math.ceil(dashboardStats.quizAttempts / 7) }} minggu ini
                    </p>
                  </div>
                  <div class="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <CheckCircle class="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              class="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <CardContent class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-green-100 font-medium mb-1">Purata Skor</p>
                    <p class="text-3xl font-bold">{{ dashboardStats.averageScore }}</p>
                    <p class="text-green-200 text-sm mt-1">
                      {{
                        parseInt(dashboardStats.averageScore) >= 80
                          ? 'Cemerlang!'
                          : 'Terus berusaha!'
                      }}
                    </p>
                  </div>
                  <div class="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <Award class="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              class="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <CardContent class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-purple-100 font-medium mb-1">Masa Pembelajaran</p>
                    <p class="text-3xl font-bold">{{ dashboardStats.totalTimeSpent }}</p>
                    <p class="text-purple-200 text-sm mt-1">Pembelajaran aktif</p>
                  </div>
                  <div class="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <Clock class="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Enhanced Recent Activities -->
          <Card class="bg-white/70 backdrop-blur-sm shadow-xl border-0">
            <CardHeader class="border-b border-gray-100">
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle class="flex items-center text-gray-800">
                    <Activity class="mr-3 h-6 w-6 text-blue-500" />
                    Aktiviti Terkini
                  </CardTitle>
                  <CardDescription
                    >Aktiviti pembelajaran yang telah anda selesaikan</CardDescription
                  >
                </div>
                <div class="bg-blue-100 rounded-full px-3 py-1">
                  <span class="text-blue-700 text-sm font-medium"
                    >{{ recentActivities.length }} aktiviti</span
                  >
                </div>
              </div>
            </CardHeader>
            <CardContent class="p-6">
              <div class="space-y-4">
                <div
                  v-for="(activity, index) in recentActivities"
                  :key="index"
                  class="group p-4 rounded-xl border-2 border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                >
                  <div class="flex items-start">
                    <div
                      :class="[
                        activity.color,
                        'p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-200',
                      ]"
                    >
                      <component :is="activity.icon" class="h-6 w-6" />
                    </div>
                    <div class="flex-1">
                      <h4
                        class="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors"
                      >
                        {{ activity.title }}
                      </h4>
                      <p class="text-gray-600 text-sm mb-3">{{ activity.date }}</p>
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div v-if="activity.score" class="flex items-center">
                          <Award class="h-4 w-4 text-yellow-500 mr-2" />
                          <span class="text-sm font-medium text-gray-700">{{
                            activity.score
                          }}</span>
                        </div>
                        <div v-if="activity.progress" class="flex items-center">
                          <TrendingUp class="h-4 w-4 text-green-500 mr-2" />
                          <span class="text-sm font-medium text-gray-700">{{
                            activity.progress
                          }}</span>
                        </div>
                        <div v-if="activity.timeSpent" class="flex items-center">
                          <Clock class="h-4 w-4 text-blue-500 mr-2" />
                          <span class="text-sm font-medium text-gray-700">{{
                            activity.timeSpent
                          }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="recentActivities.length === 0" class="text-center py-8">
                  <div
                    class="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4"
                  >
                    <Activity class="h-8 w-8 text-gray-400" />
                  </div>
                  <p class="text-gray-500">Belum ada aktiviti terkini</p>
                </div>
              </div>
            </CardContent>
            <CardFooter class="bg-gray-50/50 border-t border-gray-100">
              <Button
                variant="outline"
                class="w-full bg-white hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                @click="showActivitiesModal = true"
              >
                <BarChart3 class="mr-2 h-4 w-4" />
                Lihat Semua Aktiviti
              </Button>
            </CardFooter>
          </Card>

          <!-- Enhanced Learning Analytics -->
          <Card class="bg-white/70 backdrop-blur-sm shadow-xl border-0">
            <CardHeader class="border-b border-gray-100">
              <CardTitle class="flex items-center text-gray-800">
                <BarChart3 class="mr-3 h-6 w-6 text-purple-500" />
                Analisis Pembelajaran
              </CardTitle>
              <CardDescription>Gaya pembelajaran dan kekuatan anda</CardDescription>
            </CardHeader>
            <CardContent class="p-6">
              <div v-if="isLoading" class="flex justify-center py-8">
                <div
                  class="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"
                ></div>
              </div>
              <div v-else class="space-y-8">
                <!-- Enhanced Learning Style with progress bars -->
                <div>
                  <h4 class="font-semibold text-lg mb-4 text-gray-800">Gaya Pembelajaran</h4>
                  <div class="space-y-4">
                    <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                      <div class="flex items-center justify-between mb-2">
                        <span class="font-medium text-blue-800">Visual</span>
                        <span class="text-xl font-bold text-blue-600"
                          >{{ learningStyle.visual }}%</span
                        >
                      </div>
                      <div class="w-full bg-blue-200 rounded-full h-3">
                        <div
                          class="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
                          :style="{ width: learningStyle.visual + '%' }"
                        ></div>
                      </div>
                    </div>

                    <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                      <div class="flex items-center justify-between mb-2">
                        <span class="font-medium text-green-800">Auditori</span>
                        <span class="text-xl font-bold text-green-600"
                          >{{ learningStyle.auditori }}%</span
                        >
                      </div>
                      <div class="w-full bg-green-200 rounded-full h-3">
                        <div
                          class="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out"
                          :style="{ width: learningStyle.auditori + '%' }"
                        ></div>
                      </div>
                    </div>

                    <div class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                      <div class="flex items-center justify-between mb-2">
                        <span class="font-medium text-purple-800">Kinestetik</span>
                        <span class="text-xl font-bold text-purple-600"
                          >{{ learningStyle.kinestetik }}%</span
                        >
                      </div>
                      <div class="w-full bg-purple-200 rounded-full h-3">
                        <div
                          class="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                          :style="{ width: learningStyle.kinestetik + '%' }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Enhanced Strengths and Areas for Improvement -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div
                    class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100"
                  >
                    <h4 class="font-semibold text-lg mb-4 text-green-800 flex items-center">
                      <CheckCircle class="mr-2 h-5 w-5" />
                      Bidang Kekuatan
                    </h4>
                    <ul class="space-y-3">
                      <li
                        v-for="(area, index) in strengthAreas"
                        :key="index"
                        class="flex items-center p-3 bg-white rounded-lg shadow-sm"
                      >
                        <div class="bg-green-500 rounded-full w-3 h-3 mr-3"></div>
                        <span class="font-medium text-gray-700">{{ area.name }}</span>
                      </li>
                      <li v-if="strengthAreas.length === 0" class="text-gray-500 text-center py-4">
                        <Award class="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        Belum cukup data
                      </li>
                    </ul>
                  </div>

                  <div
                    class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100"
                  >
                    <h4 class="font-semibold text-lg mb-4 text-yellow-800 flex items-center">
                      <TrendingUp class="mr-2 h-5 w-5" />
                      Bidang Untuk Dipertingkatkan
                    </h4>
                    <ul class="space-y-3">
                      <li
                        v-for="(area, index) in improvementAreas"
                        :key="index"
                        class="flex items-center p-3 bg-white rounded-lg shadow-sm"
                      >
                        <div class="bg-yellow-500 rounded-full w-3 h-3 mr-3"></div>
                        <span class="font-medium text-gray-700">{{ area.name }}</span>
                      </li>
                      <li
                        v-if="improvementAreas.length === 0"
                        class="text-gray-500 text-center py-4"
                      >
                        <BarChart3 class="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        Belum cukup data
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>

  <!-- Enhanced Quiz Activities Modal -->
  <Dialog v-model:open="showActivitiesModal">
    <DialogContent
      class="max-w-6xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-md border-0 shadow-2xl"
    >
      <DialogHeader class="border-b border-gray-100 pb-4">
        <DialogTitle
          class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          Semua Aktiviti Kuiz
        </DialogTitle>
        <DialogDescription class="text-gray-600">
          Lihat semua kuiz yang tersedia dan sejarah percubaan anda
        </DialogDescription>
      </DialogHeader>

      <div class="overflow-y-auto max-h-[calc(90vh-180px)] p-1">
        <AllQuizActivities />
      </div>

      <DialogFooter class="border-t border-gray-100 pt-4">
        <Button
          variant="outline"
          class="bg-white hover:bg-gray-50 transition-all duration-200"
          @click="showActivitiesModal = false"
        >
          <Activity class="mr-2 h-4 w-4" />
          Tutup
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
