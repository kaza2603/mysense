<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useStudentsStore } from '@/stores/students'
import { useStudentPerformanceStore } from '@/stores/studentPerformance'
import { useVideosStore } from '@/stores/videos'
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
  GraduationCap,
  Award,
  Book,
  Activity,
  Clock,
  Video,
  TrendingUp,
  Users,
} from 'lucide-vue-next'

const auth = useAuthStore()
const studentsStore = useStudentsStore()
const studentPerformanceStore = useStudentPerformanceStore()
const videosStore = useVideosStore()

const teacher = computed(() => {
  const teacherData = auth.currentTeacher
  console.log('Computed teacher data:', teacherData)
  return teacherData
})

const stats = ref({
  totalStudents: 0,
  activeStudents: 0,
  totalVideos: 0,
  averageProgress: 0,
})

const isLoading = ref(false)
const isLoadingActivities = ref(false)
const recentActivities = ref([])
const upcomingSessions = ref([])

// Helper function to format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// Function to ensure teacher data is loaded
const ensureTeacherData = () => {
  if (!auth.currentTeacher) {
    const storedTeacher = localStorage.getItem('currentTeacher')
    if (storedTeacher) {
      try {
        const teacherData = JSON.parse(storedTeacher)
        auth.currentTeacher = teacherData
        console.log('Restored teacher data from localStorage:', teacherData)
      } catch (error) {
        console.error('Error parsing stored teacher data:', error)
      }
    } else {
      console.warn('No teacher data found in localStorage')
    }
  } else {
    console.log('Teacher data already loaded:', auth.currentTeacher)
  }
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

// Fetch dashboard statistics
const fetchDashboardStats = async () => {
  try {
    isLoading.value = true

    // Fetch students in teacher's class
    await studentsStore.fetchStudentsByTeacherClass()
    const students = studentsStore.students

    stats.value.totalStudents = students.length

    // Fetch videos uploaded by this teacher
    await videosStore.fetchVideos()
    stats.value.totalVideos = videosStore.videos.length

    // Calculate active students and average progress
    let totalProgress = 0
    let activeStudentCount = 0
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    for (const student of students.slice(0, 10)) {
      // Limit to first 10 for performance
      try {
        const performanceData = await studentPerformanceStore.fetchStudentAnalytics(student.id)
        if (performanceData && performanceData.summary) {
          totalProgress += performanceData.summary.averageScore || 0

          // Check if student has recent activity
          if (performanceData.recentActivity && performanceData.recentActivity.length > 0) {
            const lastActivity = performanceData.recentActivity[0]
            const lastActivityDate = new Date(lastActivity.completed_at)
            if (lastActivityDate > oneWeekAgo) {
              activeStudentCount++
            }
          }
        }
      } catch (error) {
        console.warn(`Could not fetch performance for student ${student.id}:`, error)
      }
    }

    stats.value.activeStudents = activeStudentCount
    stats.value.averageProgress =
      students.length > 0 ? Math.round(totalProgress / Math.min(students.length, 10)) : 0
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
  } finally {
    isLoading.value = false
  }
}

// Generate recent activities based on real data
const generateRecentActivities = async () => {
  const activities = []
  isLoadingActivities.value = true

  try {
    // Get recent student activities from the first few students
    const students = studentsStore.students.slice(0, 5) // Limit for performance
    let recentStudentActivities = []

    for (const student of students) {
      try {
        const performanceData = await studentPerformanceStore.fetchStudentAnalytics(student.id)
        if (performanceData && performanceData.recentActivity) {
          recentStudentActivities.push(
            ...performanceData.recentActivity.slice(0, 2).map((activity) => ({
              ...activity,
              studentName: student.name,
              studentId: student.id,
            })),
          )
        }
      } catch (error) {
        console.warn(`Could not fetch recent activities for student ${student.id}:`, error)
      }
    }

    // Sort by most recent
    recentStudentActivities.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))

    // Add top recent quiz completions
    if (recentStudentActivities.length > 0) {
      const latestActivity = recentStudentActivities[0]
      activities.push({
        title: 'Kuiz Baru Diselesaikan',
        date: formatDate(latestActivity.completed_at),
        description: `${latestActivity.studentName} menyelesaikan kuiz dengan markah ${latestActivity.score}%`,
        icon: Award,
        color: 'bg-green-100 text-green-600',
        time: getTimeAgo(latestActivity.completed_at),
      })
    }

    // Add student performance insights
    if (stats.value.averageProgress > 70) {
      activities.push({
        title: 'Pencapaian Cemerlang',
        date: formatDate(new Date()),
        description: `Purata prestasi kelas mencapai ${stats.value.averageProgress}% - prestasi yang baik!`,
        icon: TrendingUp,
        color: 'bg-green-100 text-green-600',
        time: 'Baru sahaja',
      })
    } else if (stats.value.averageProgress > 0) {
      activities.push({
        title: 'Pemantauan Prestasi',
        date: formatDate(new Date()),
        description: `Purata prestasi kelas: ${stats.value.averageProgress}% - perlu perhatian lebih`,
        icon: TrendingUp,
        color: 'bg-yellow-100 text-yellow-600',
        time: 'Baru sahaja',
      })
    }

    // Add video upload activity
    if (stats.value.totalVideos > 0) {
      activities.push({
        title: 'Video Pembelajaran Terkini',
        date: formatDate(new Date()),
        description: `${stats.value.totalVideos} video pembelajaran tersedia untuk pelajar`,
        icon: Video,
        color: 'bg-blue-100 text-blue-600',
        time: 'Hari ini',
      })
    }

    // Add student engagement activity
    if (stats.value.activeStudents > 0) {
      const engagementRate = Math.round(
        (stats.value.activeStudents / stats.value.totalStudents) * 100,
      )
      activities.push({
        title: 'Penglibatan Pelajar',
        date: formatDate(new Date()),
        description: `${stats.value.activeStudents} daripada ${stats.value.totalStudents} pelajar aktif (${engagementRate}%)`,
        icon: Users,
        color:
          engagementRate > 70 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600',
        time: 'Minggu ini',
      })
    }
  } catch (error) {
    console.error('Error generating recent activities:', error)
    // Fallback to basic activities
    activities.push({
      title: 'Sistem Pembelajaran Aktif',
      date: formatDate(new Date()),
      description: 'Platform pembelajaran berjalan dengan baik',
      icon: Activity,
      color: 'bg-blue-100 text-blue-600',
      time: 'Hari ini',
    })
  } finally {
    isLoadingActivities.value = false
  }

  recentActivities.value = activities.slice(0, 4) // Limit to 4 most relevant activities
}

// Generate upcoming sessions suggestions
const generateUpcomingSessions = async () => {
  const sessions = []
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

  try {
    // Analyze student performance to suggest focused sessions
    const students = studentsStore.students.slice(0, 10) // Sample for analysis
    let lowPerformanceUnits = []
    let totalAnalyzed = 0

    for (const student of students) {
      try {
        const performanceData = await studentPerformanceStore.fetchStudentAnalytics(student.id)
        if (performanceData && performanceData.progress) {
          totalAnalyzed++
          performanceData.progress.forEach((unit) => {
            if (unit.averageScore < 60) {
              // Units where student is struggling
              lowPerformanceUnits.push(unit.unit)
            }
          })
        }
      } catch (error) {
        console.warn(`Could not analyze performance for student ${student.id}:`, error)
      }
    }

    // Find most common struggling units
    const unitFrequency = {}
    lowPerformanceUnits.forEach((unit) => {
      unitFrequency[unit] = (unitFrequency[unit] || 0) + 1
    })

    const strugglingUnits = Object.entries(unitFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2) // Suggest remedial sessions for struggling units
    if (strugglingUnits.length > 0) {
      const [unitId, count] = strugglingUnits[0]
      const unitTitle = getUnitTitle(parseInt(unitId))

      sessions.push({
        subject: 'Sains',
        topic: `Sesi Pemulihan: ${unitTitle}`,
        date: formatDate(tomorrow),
        time: '10:00 pagi',
        icon: Clock,
        priority: 'high',
        description: `${count} pelajar memerlukan bantuan tambahan`,
        type: 'remedial',
      })
    }

    // Suggest performance review if low engagement
    const engagementRate =
      stats.value.totalStudents > 0
        ? (stats.value.activeStudents / stats.value.totalStudents) * 100
        : 0

    if (engagementRate < 50 && stats.value.totalStudents > 0) {
      sessions.push({
        subject: 'Pengurusan Kelas',
        topic: 'Semakan Penglibatan Pelajar',
        date: formatDate(dayAfterTomorrow),
        time: '2:00 petang',
        icon: Clock,
        priority: 'medium',
        description: `Hanya ${Math.round(engagementRate)}% pelajar aktif`,
        type: 'review',
      })
    }

    // Suggest new content creation if videos are limited
    if (stats.value.totalVideos < 5) {
      sessions.push({
        subject: 'Pembangunan Kandungan',
        topic: 'Muat Naik Video Pembelajaran Baru',
        date: formatDate(nextWeek),
        time: '9:00 pagi',
        icon: Clock,
        priority: 'medium',
        description: 'Tambah lebih banyak kandungan pembelajaran',
        type: 'content',
      })
    }

    // Suggest progress celebration if performance is good
    if (stats.value.averageProgress > 75) {
      sessions.push({
        subject: 'Sains',
        topic: 'Sesi Pengukuhan & Penghargaan',
        date: formatDate(nextWeek),
        time: '11:00 pagi',
        icon: Clock,
        priority: 'low',
        description: 'Raikan pencapaian cemerlang pelajar',
        type: 'celebration',
      })
    }

    // Suggest parent engagement session
    if (stats.value.totalStudents > 5) {
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      sessions.push({
        subject: 'Penglibatan Ibu Bapa',
        topic: 'Mesyuarat Kemajuan Pelajar',
        date: formatDate(nextMonth),
        time: '7:00 malam',
        icon: Clock,
        priority: 'medium',
        description: 'Perbincangan prestasi dengan ibu bapa',
        type: 'parent-meeting',
      })
    }
  } catch (error) {
    console.error('Error generating upcoming sessions:', error)
    // Fallback sessions
    sessions.push({
      subject: 'Sains',
      topic: 'Semakan Prestasi Umum',
      date: formatDate(tomorrow),
      time: '10:00 pagi',
      icon: Clock,
      priority: 'medium',
      description: 'Semakan prestasi pelajar',
      type: 'general',
    })
  }

  upcomingSessions.value = sessions.slice(0, 3) // Limit to top 3 priorities
}

onMounted(async () => {
  console.log('Teacher Dashboard mounted')
  console.log('Teacher authentication status:', auth.isTeacherAuthenticated)
  console.log('Current teacher data:', auth.currentTeacher)

  // Ensure teacher data is loaded
  ensureTeacherData()

  await fetchDashboardStats()
  await generateRecentActivities()
  await generateUpcomingSessions()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Welcome Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold mb-2">Selamat Datang, {{ teacher?.teacher_name || 'Guru' }}</h1>
      <p class="text-gray-600">{{ teacher?.school_name || 'Sekolah' }}</p>

      <!-- Debug info (remove in production) -->
      <div v-if="!teacher" class="mt-2 p-2 bg-yellow-100 text-yellow-800 text-sm rounded">
        Debug: Teacher data not loaded. Auth status: {{ auth.isTeacherAuthenticated }}
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center text-blue-600">
            <GraduationCap class="mr-2 h-5 w-5" />
            Jumlah Pelajar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.totalStudents }}</div>
          <p class="text-sm text-gray-500">Pelajar Berdaftar</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center text-green-600">
            <Activity class="mr-2 h-5 w-5" />
            Pelajar Aktif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.activeStudents }}</div>
          <p class="text-sm text-gray-500">Aktif Minggu Ini</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center text-yellow-600">
            <Video class="mr-2 h-5 w-5" />
            Video Pembelajaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.totalVideos }}</div>
          <p class="text-sm text-gray-500">Video Dimuat Naik</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center text-purple-600">
            <Award class="mr-2 h-5 w-5" />
            Pencapaian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.averageProgress }}%</div>
          <p class="text-sm text-gray-500">Purata Kemajuan</p>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Activities and Upcoming Sessions -->
    <div class="grid grid-cols-1 lg:grid-cols-1 gap-6">
      <!-- Recent Activities -->
      <Card>
        <CardHeader>
          <CardTitle>Aktiviti Terkini</CardTitle>
          <CardDescription>Aktiviti yang telah anda lakukan</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="isLoadingActivities" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="text-sm text-gray-500 mt-2">Memuatkan aktiviti...</p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="(activity, index) in recentActivities"
              :key="index"
              class="flex items-start p-3 rounded-md border bg-white"
            >
              <div :class="[activity.color, 'p-2 rounded-full mr-4']">
                <component :is="activity.icon" class="h-5 w-5" />
              </div>
              <div class="flex-1">
                <h4 class="text-lg font-medium">{{ activity.title }}</h4>
                <p class="text-sm text-gray-600">{{ activity.date }}</p>
                <p class="text-sm text-gray-600">{{ activity.description }}</p>
                <p class="text-xs text-gray-400 mt-1" v-if="activity.time">{{ activity.time }}</p>
              </div>
            </div>
            <div v-if="recentActivities.length === 0" class="text-center py-8 text-gray-500">
              <Activity class="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Belum ada aktiviti terkini</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <!-- <Button variant="outline" class="w-full">Lihat Semua Aktiviti</Button> -->
        </CardFooter>
      </Card>

      <!-- Upcoming Sessions
      <Card>
        <CardHeader>
          <CardTitle>Sesi Akan Datang</CardTitle>
          <CardDescription>Jadual pembelajaran yang akan datang</CardDescription>
        </CardHeader>        <CardContent>
          <div class="space-y-4">
            <div
              v-for="(session, index) in upcomingSessions"
              :key="index"
              class="flex items-start p-3 rounded-md border bg-white"
            >
              <div :class="[
                'p-2 rounded-full mr-4',
                session.priority === 'high' ? 'bg-red-100 text-red-600' :
                session.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                'bg-green-100 text-green-600'
              ]">
                <component :is="session.icon" class="h-5 w-5" />
              </div>
              <div class="flex-1">
                <h4 class="text-lg font-medium">{{ session.subject }}: {{ session.topic }}</h4>
                <p class="text-sm text-gray-600">{{ session.date }} | {{ session.time }}</p>
                <p class="text-xs text-gray-500 mt-1" v-if="session.description">{{ session.description }}</p>
                <span v-if="session.priority === 'high'" class="inline-block mt-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  Keutamaan Tinggi
                </span>
              </div>
              <Button variant="outline" size="sm">Ingat Saya</Button>
            </div>
            <div v-if="upcomingSessions.length === 0" class="text-center py-8 text-gray-500">
              <Clock class="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Tiada sesi dijadualkan</p>
            </div>
          </div>
        </CardContent>
      </Card> -->
    </div>
  </div>
</template>
