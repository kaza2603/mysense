<script setup>
import { ref, computed, onMounted } from 'vue'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User,
  Search,
  RefreshCw,
  Filter,
  BookOpen,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-vue-next'
import { useStudentsStore } from '@/stores/students'
import { useStudentPerformanceStore } from '@/stores/studentPerformance'

const studentsStore = useStudentsStore()
const studentPerformanceStore = useStudentPerformanceStore()
const isLoading = ref(false)
const search = ref('')
const selectedStudent = ref(null)
const studentPerformance = ref(null)
const performanceLoading = ref(false)

// New state for topic-based view
const selectedTopic = ref(null)
const viewMode = ref('overview') // 'overview', 'topics', 'attempts'

// Pagination and filtering for quiz results
const currentPage = ref(1)
const itemsPerPage = ref(10)
const quizFilter = ref('all') // 'all', 'normal', 'suspicious'

const filteredStudents = computed(() => {
  if (!search.value) return studentsStore.students
  return studentsStore.students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.value.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.value.toLowerCase()),
  )
})

// Filtered and paginated quiz results
const filteredQuizzes = computed(() => {
  if (!studentPerformance.value?.quizzes) return []

  let quizzes = studentPerformance.value.quizzes

  // Apply filter
  if (quizFilter.value === 'suspicious') {
    quizzes = quizzes.filter((q) => q.parentInvolvement)
  } else if (quizFilter.value === 'normal') {
    quizzes = quizzes.filter((q) => !q.parentInvolvement)
  }

  return quizzes
})

const paginatedQuizzes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredQuizzes.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredQuizzes.value.length / itemsPerPage.value)
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Helper functions for formatting
const formatQuizDate = (dateString) => {
  if (!dateString) return 'Tarikh tidak diketahui'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (error) {
    return 'Tarikh tidak sah'
  }
}

const formatQuizType = (type) => {
  const typeMap = {
    visual: 'Visual',
    auditori: 'Auditori',
    kinestetik: 'Kinestetik',
  }
  return typeMap[type] || type || 'Tidak diketahui'
}

// Helper functions for formatting time
const formatTimeSpent = (minutes) => {
  if (!minutes || minutes < 1) return '< 1 minit'
  if (minutes < 60) return `${minutes} minit`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours} jam ${remainingMinutes} minit` : `${hours} jam`
}

// Function to get performance color based on score
const getPerformanceColor = (score) => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
}

// Function to get performance badge variant
const getPerformanceBadge = (score) => {
  if (score >= 80)
    return { variant: 'default', class: 'bg-green-100 text-green-800', text: 'Cemerlang' }
  if (score >= 60) return { variant: 'secondary', class: 'bg-blue-100 text-blue-800', text: 'Baik' }
  if (score >= 40)
    return { variant: 'outline', class: 'bg-yellow-100 text-yellow-800', text: 'Sederhana' }
  return { variant: 'destructive', class: 'bg-red-100 text-red-800', text: 'Lemah' }
}

// Real student performance data fetching
const selectStudent = async (student) => {
  selectedStudent.value = student
  performanceLoading.value = true
  studentPerformance.value = null

  // Reset pagination, filters and views when selecting new student
  currentPage.value = 1
  quizFilter.value = 'all'
  viewMode.value = 'overview'
  selectedTopic.value = null

  try {
    console.log('Fetching performance data for student:', student.id)

    // Fetch real student performance data
    const performanceData = await studentPerformanceStore.fetchStudentAnalytics(student.id)

    if (performanceData) {
      // Get detailed performance stats
      const stats = studentPerformanceStore.getPerformanceStats(student.id)
      const topicPerformance = studentPerformanceStore.getTopicPerformance(student.id)

      // Fetch ALL quiz attempts instead of just recent activities
      let allQuizAttempts = []
      try {
        allQuizAttempts = await studentPerformanceStore.fetchAllQuizAttempts(student.id)
        console.log('Fetched all quiz attempts:', allQuizAttempts.length)
      } catch (error) {
        console.warn('Could not fetch all quiz attempts, using recent activities:', error)
        // Fallback to recent activities if all attempts fetch fails
        allQuizAttempts = studentPerformanceStore.getRecentActivities(student.id)
      }

      // Transform the data to match the component's expected format
      const quizzes = allQuizAttempts.map((activity, index) => {
        // Detect potential parent involvement based on performance patterns
        const parentInvolvement = detectParentInvolvement(activity, allQuizAttempts)

        // Calculate actual time spent
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

        return {
          topic:
            activity.title ||
            activity.quizzes?.title ||
            `Unit ${activity.unit || activity.quizzes?.quiz_unit} - Aktiviti ${activity.activity || activity.quizzes?.no_activity}`,
          score: activity.score,
          date: activity.completed_at || activity.completedAt || new Date().toISOString(),
          parentInvolvement,
          unit: activity.unit || activity.quizzes?.quiz_unit,
          activity: activity.activity || activity.quizzes?.no_activity,
          type: activity.type || activity.quiz_type || activity.quizzes?.quiz_type,
          timeSpent: timeSpent,
          started_at: activity.started_at,
          completed_at: activity.completed_at,
        }
      })

      // Sort quizzes by completion date (most recent first)
      quizzes.sort((a, b) => new Date(b.date) - new Date(a.date))

      studentPerformance.value = {
        name: student.name,
        class: student.class || 'Kelas tidak diketahui',
        school: student.school || 'Sekolah tidak diketahui',
        quizzes,
        stats: {
          totalQuizzes: stats.totalQuizzes,
          completedQuizzes: allQuizAttempts.length, // Use actual attempt count
          averageScore: stats.averageScore,
          averageTime: stats.averageTime,
        },
      }
    } else {
      // Fallback to basic student info if no performance data
      studentPerformance.value = {
        name: student.name,
        class: student.class || 'Kelas tidak diketahui',
        school: student.school || 'Sekolah tidak diketahui',
        quizzes: [],
        stats: {
          totalQuizzes: 0,
          completedQuizzes: 0,
          averageScore: 0,
          averageTime: 0,
        },
      }
    }
  } catch (error) {
    console.error('Error fetching student performance:', error)
    // Show basic student info on error
    studentPerformance.value = {
      name: student.name,
      class: student.class || 'Kelas tidak diketahui',
      school: student.school || 'Sekolah tidak diketahui',
      quizzes: [],
      stats: {
        totalQuizzes: 0,
        completedQuizzes: 0,
        averageScore: 0,
        averageTime: 0,
      },
    }
  } finally {
    performanceLoading.value = false
  }
}

// Function to detect potential parent involvement based on performance patterns
const detectParentInvolvement = (currentActivity, allActivities) => {
  const score = currentActivity.score

  // High scores (95%+) are suspicious
  if (score >= 95) {
    return true
  }

  // Check for sudden improvement patterns
  const currentUnit = currentActivity.unit || currentActivity.quizzes?.quiz_unit
  const studentActivities = allActivities.filter(
    (a) => (a.unit || a.quizzes?.quiz_unit) === currentUnit,
  )

  if (studentActivities.length > 1) {
    const avgOtherScores =
      studentActivities
        .filter((a) => (a.id || a.quiz_id) !== (currentActivity.id || currentActivity.quiz_id))
        .reduce((sum, a) => sum + a.score, 0) /
      (studentActivities.length - 1)

    // If current score is 20+ points higher than average, flag it
    if (score - avgOtherScores >= 20) {
      return true
    }
  }

  // Check for unusually fast completion times (less than 2 minutes for high scores)
  if (score >= 90 && currentActivity.started_at && currentActivity.completed_at) {
    const start = new Date(currentActivity.started_at)
    const end = new Date(currentActivity.completed_at)
    const minutes = (end - start) / (1000 * 60)

    if (minutes < 2) {
      return true
    }
  }

  return false
}

const abnormalQuizzes = computed(
  () => studentPerformance.value?.quizzes?.filter((q) => q.parentInvolvement) || [],
)

// Updated student summary using real performance data
const studentSummary = computed(() => {
  if (!studentPerformance.value) return null

  // Use real stats if available, otherwise calculate from quizzes
  if (studentPerformance.value.stats) {
    const stats = studentPerformance.value.stats
    const quizzes = studentPerformance.value.quizzes || []
    const abnormalCount = quizzes.filter((q) => q.parentInvolvement).length
    const highest = quizzes.length > 0 ? Math.max(...quizzes.map((q) => q.score)) : 0
    const lowest = quizzes.length > 0 ? Math.min(...quizzes.map((q) => q.score)) : 0

    return {
      completed: quizzes.length, // Use actual number of quiz attempts
      avgScore: Math.round(stats.averageScore),
      highest,
      lowest,
      abnormalCount,
      totalQuizzes: stats.totalQuizzes,
      averageTime: Math.round(stats.averageTime),
    }
  }

  // Fallback calculation from quizzes array
  const quizzes = studentPerformance.value.quizzes || []
  const completed = quizzes.length
  const avgScore =
    completed > 0 ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / completed) : 0
  const highest = quizzes.reduce((max, q) => (q.score > max ? q.score : max), 0)
  const lowest = quizzes.reduce((min, q) => (q.score < min ? q.score : min), 100)
  const abnormalCount = quizzes.filter((q) => q.parentInvolvement).length

  return {
    completed,
    avgScore,
    highest,
    lowest,
    abnormalCount,
    totalQuizzes: completed,
    averageTime: 0,
  }
})

const fetchStudents = async () => {
  isLoading.value = true
  await studentsStore.fetchStudentsByTeacherClass()
  isLoading.value = false
}

onMounted(async () => {
  await fetchStudents()
})

// Group quizzes by topic for topic-based view
const quizzesByTopic = computed(() => {
  if (!studentPerformance.value?.quizzes) return []

  const topicGroups = {}

  studentPerformance.value.quizzes.forEach((quiz) => {
    const topicKey = quiz.topic || 'Topik Tidak Diketahui'

    if (!topicGroups[topicKey]) {
      topicGroups[topicKey] = {
        topic: topicKey,
        unit: quiz.unit,
        attempts: [],
        stats: {
          totalAttempts: 0,
          averageScore: 0,
          bestScore: 0,
          worstScore: 100,
          suspiciousCount: 0,
          totalTimeSpent: 0,
        },
      }
    }

    topicGroups[topicKey].attempts.push(quiz)
  })

  // Calculate statistics for each topic
  Object.values(topicGroups).forEach((group) => {
    const attempts = group.attempts
    group.stats.totalAttempts = attempts.length

    const scores = attempts.map((a) => a.score)
    group.stats.averageScore = Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    )
    group.stats.bestScore = Math.max(...scores)
    group.stats.worstScore = Math.min(...scores)
    group.stats.suspiciousCount = attempts.filter((a) => a.parentInvolvement).length

    // Calculate total time spent
    const totalMinutes = attempts.reduce((total, attempt) => {
      if (attempt.started_at && attempt.completed_at) {
        const start = new Date(attempt.started_at)
        const end = new Date(attempt.completed_at)
        const minutes = Math.round((end - start) / (1000 * 60))
        return total + (minutes > 0 ? minutes : 0)
      }
      return total
    }, 0)

    group.stats.totalTimeSpent = totalMinutes
  })

  return Object.values(topicGroups).sort((a, b) => (a.unit || 0) - (b.unit || 0))
})

// Get attempts for selected topic
const selectedTopicAttempts = computed(() => {
  if (!selectedTopic.value) return []

  const topicGroup = quizzesByTopic.value.find((group) => group.topic === selectedTopic.value.topic)
  return topicGroup ? topicGroup.attempts.sort((a, b) => new Date(b.date) - new Date(a.date)) : []
})

// Function to select a topic
const selectTopic = (topic) => {
  selectedTopic.value = topic
  viewMode.value = 'attempts'
}

// Function to go back to topics view
const backToTopics = () => {
  selectedTopic.value = null
  viewMode.value = 'topics'
}

// Function to go back to overview
const backToOverview = () => {
  selectedTopic.value = null
  viewMode.value = 'overview'
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 space-y-6">
    <!-- Students List Section -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <User class="w-6 h-6 text-blue-600" />
          Senarai Pelajar
        </CardTitle>
        <CardDescription> Pilih pelajar untuk melihat prestasi kuiz mereka </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div class="relative w-full md:w-1/2">
            <Search
              class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <Input
              v-model="search"
              type="text"
              placeholder="Cari nama atau emel pelajar..."
              class="pl-10"
            />
          </div>
          <Button @click="fetchStudents" :disabled="isLoading" variant="outline">
            <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': isLoading }" />
            Muat Semula
          </Button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr class="border-b">
                <th class="text-left py-3 px-4 font-medium">Nama</th>
                <th class="text-left py-3 px-4 font-medium">Emel</th>
                <th class="text-left py-3 px-4 font-medium">Sekolah</th>
                <th class="text-center py-3 px-4 font-medium">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="student in filteredStudents"
                :key="student.id"
                :class="[
                  selectedStudent?.id === student.id ? 'bg-blue-50' : '',
                  'border-b hover:bg-gray-50 transition-colors',
                ]"
              >
                <td class="py-3 px-4 font-medium">{{ student.name }}</td>
                <td class="py-3 px-4 text-gray-600">{{ student.email }}</td>
                <td class="py-3 px-4 text-gray-600">{{ student.school }}</td>
                <td class="py-3 px-4 text-center">
                  <Button
                    size="sm"
                    @click="selectStudent(student)"
                    :disabled="performanceLoading && selectedStudent?.id === student.id"
                    :variant="selectedStudent?.id === student.id ? 'default' : 'outline'"
                  >
                    <RefreshCw
                      class="w-4 h-4 mr-2"
                      :class="{
                        'animate-spin': performanceLoading && selectedStudent?.id === student.id,
                      }"
                      v-if="performanceLoading && selectedStudent?.id === student.id"
                    />
                    {{ selectedStudent?.id === student.id ? 'Dipilih' : 'Lihat Prestasi' }}
                  </Button>
                </td>
              </tr>
              <tr v-if="filteredStudents.length === 0">
                <td colspan="4" class="text-center py-8 text-gray-500">Tiada pelajar dijumpai.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <!-- Student Performance Section -->
    <Card
      v-if="selectedStudent && (studentPerformance !== null || performanceLoading)"
      class="animate-fade-in"
    >
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <BarChart3 class="w-6 h-6 text-blue-600" />
          Prestasi Pelajar
        </CardTitle>
        <CardDescription> Analisis prestasi kuiz dan pola pembelajaran </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Loading state -->
        <div v-if="performanceLoading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <RefreshCw class="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p class="text-gray-600">Memuatkan data prestasi pelajar...</p>
          </div>
        </div>

        <!-- Performance data -->
        <div v-else-if="studentPerformance" class="space-y-6">
          <!-- Student Info and Summary Stats -->
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div class="space-y-2">
              <h2 class="text-2xl font-bold">{{ studentPerformance?.name || '-' }}</h2>
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-600">
                <Badge variant="outline">{{ studentPerformance?.class || '-' }}</Badge>
                <span class="hidden sm:inline">•</span>
                <span>{{ studentPerformance?.school || '-' }}</span>
              </div>
            </div>

            <div v-if="studentSummary" class="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card class="p-4 text-center bg-blue-50 border-blue-200">
                <div class="text-2xl font-bold text-blue-600 mb-1">
                  {{ studentSummary.completed }}
                </div>
                <div class="text-xs text-gray-600">Kuiz Selesai</div>
              </Card>
              <Card class="p-4 text-center bg-green-50 border-green-200">
                <div class="text-2xl font-bold text-green-600 mb-1">
                  {{ studentSummary.avgScore }}%
                </div>
                <div class="text-xs text-gray-600">Purata Markah</div>
              </Card>
              <Card class="p-4 text-center bg-purple-50 border-purple-200">
                <div class="text-2xl font-bold text-purple-600 mb-1">
                  {{ studentSummary.highest }}%
                </div>
                <div class="text-xs text-gray-600">Markah Tertinggi</div>
              </Card>
              <Card class="p-4 text-center bg-yellow-50 border-yellow-200">
                <div class="text-2xl font-bold text-yellow-600 mb-1">
                  {{ studentSummary.lowest }}%
                </div>
                <div class="text-xs text-gray-600">Markah Terendah</div>
              </Card>
              <Card class="p-4 text-center bg-red-50 border-red-200">
                <div class="text-2xl font-bold text-red-600 mb-1">
                  {{ studentSummary.abnormalCount }}
                </div>
                <div class="text-xs text-gray-600">Kuiz Mencurigakan</div>
              </Card>
            </div>
          </div>

          <!-- Warning for suspicious quizzes -->
          <div
            v-if="abnormalQuizzes.length"
            class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div class="flex items-start gap-3">
              <AlertTriangle class="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 class="font-medium text-yellow-800">Amaran: Aktiviti Mencurigakan Dikesan</h4>
                <p class="text-sm text-yellow-700 mt-1">
                  Terdapat {{ abnormalQuizzes.length }} keputusan kuiz yang menunjukkan kemungkinan
                  penglibatan ibu bapa. Sila semak semula untuk memastikan integriti penilaian.
                </p>
              </div>
            </div>
          </div>

          <!-- View Mode Tabs -->
          <Tabs :value="viewMode" @update:value="viewMode = $event">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="overview" @click="backToOverview">
                <div class="flex items-center">
                  <BarChart3 class="w-4 h-4 mr-2" />
                  Ringkasan
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="topics"
                @click="
                  () => {
                    viewMode = 'topics'
                    selectedTopic = null
                  }
                "
              >
                <div class="flex items-center">
                  <BookOpen class="w-4 h-4 mr-2" />
                  Mengikut Topik
                </div>
              </TabsTrigger>
            </TabsList>

            <!-- Overview Tab -->
            <TabsContent value="overview" class="space-y-4 mt-6">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 class="font-semibold text-lg">
                  Keputusan Kuiz ({{ filteredQuizzes.length }} daripada
                  {{ studentPerformance.quizzes?.length || 0 }})
                </h3>

                <!-- Filter controls -->
                <div class="flex items-center gap-3">
                  <Select v-model="quizFilter" @update:modelValue="currentPage = 1">
                    <SelectTrigger class="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kuiz</SelectItem>
                      <SelectItem value="normal">Kuiz Normal</SelectItem>
                      <SelectItem value="suspicious">Kuiz Mencurigakan</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select v-model="itemsPerPage" @update:modelValue="currentPage = 1">
                    <SelectTrigger class="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem :value="10">10 per halaman</SelectItem>
                      <SelectItem :value="20">20 per halaman</SelectItem>
                      <SelectItem :value="50">50 per halaman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div
                v-if="paginatedQuizzes && paginatedQuizzes.length > 0"
                class="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                <Card
                  v-for="(quiz, idx) in paginatedQuizzes"
                  :key="`${quiz.unit}-${quiz.activity}-${idx}`"
                  class="hover:shadow-md transition-shadow"
                  :class="{ 'ring-2 ring-yellow-300': quiz.parentInvolvement }"
                >
                  <CardContent class="p-4">
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex-1">
                        <h4 class="font-medium text-sm">{{ quiz.topic }}</h4>
                        <div class="flex items-center gap-2 mt-1">
                          <Badge variant="outline" class="text-xs">
                            {{ formatQuizDate(quiz.date) }}
                          </Badge>
                          <Badge v-if="quiz.type" variant="secondary" class="text-xs">
                            {{ formatQuizType(quiz.type) }}
                          </Badge>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-xl font-bold" :class="getPerformanceColor(quiz.score)">
                          {{ quiz.score }}%
                        </div>
                        <Badge :class="getPerformanceBadge(quiz.score).class" class="text-xs">
                          {{ getPerformanceBadge(quiz.score).text }}
                        </Badge>
                      </div>
                    </div>

                    <div class="flex items-center justify-between text-xs text-gray-500">
                      <div class="flex items-center gap-1">
                        <Clock class="w-3 h-3" />
                        {{ quiz.timeSpent }}
                      </div>
                      <div
                        v-if="quiz.parentInvolvement"
                        class="flex items-center gap-1 text-yellow-600"
                      >
                        <AlertTriangle class="w-3 h-3" />
                        Mencurigakan
                      </div>
                    </div>

                    <div
                      v-if="quiz.parentInvolvement"
                      class="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700"
                    >
                      Markah luar biasa tinggi. Kemungkinan penglibatan ibu bapa.
                    </div>
                  </CardContent>
                </Card>
              </div>

              <!-- Pagination -->
              <div v-if="totalPages > 1" class="flex items-center justify-between">
                <div class="text-sm text-gray-500">
                  Menunjukkan {{ (currentPage - 1) * itemsPerPage + 1 }} hingga
                  {{ Math.min(currentPage * itemsPerPage, filteredQuizzes.length) }}
                  daripada {{ filteredQuizzes.length }} keputusan
                </div>

                <div class="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    @click="changePage(currentPage - 1)"
                    :disabled="currentPage === 1"
                  >
                    <ChevronLeft class="w-4 h-4" />
                  </Button>

                  <span class="text-sm px-3 py-1 bg-gray-100 rounded">
                    {{ currentPage }} / {{ totalPages }}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    @click="changePage(currentPage + 1)"
                    :disabled="currentPage === totalPages"
                  >
                    <ChevronRight class="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div
                v-else-if="studentPerformance.quizzes && studentPerformance.quizzes.length === 0"
                class="text-center py-12 text-gray-500"
              >
                <BookOpen class="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Tiada data kuiz tersedia untuk pelajar ini.</p>
              </div>

              <div
                v-else-if="filteredQuizzes.length === 0 && quizFilter !== 'all'"
                class="text-center py-12 text-gray-500"
              >
                <Filter class="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>
                  Tiada kuiz {{ quizFilter === 'suspicious' ? 'mencurigakan' : 'normal' }} ditemui
                  untuk pelajar ini.
                </p>
              </div>
            </TabsContent>

            <!-- Topics Tab -->
            <TabsContent value="topics" class="space-y-4 mt-6">
              <div v-if="selectedTopic">
                <!-- Topic Details Header -->
                <div class="flex items-center gap-4 mb-6">
                  <Button variant="outline" size="sm" @click="backToTopics">
                    <ChevronLeft class="w-4 h-4 mr-2" />
                    Kembali ke Topik
                  </Button>
                  <div>
                    <h3 class="text-lg font-semibold">{{ selectedTopic.topic }}</h3>
                    <p class="text-sm text-gray-600">
                      {{ selectedTopic.stats.totalAttempts }} percubaan • Purata:
                      {{ selectedTopic.stats.averageScore }}%
                    </p>
                  </div>
                </div>

                <!-- Topic Attempts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  <Card
                    v-for="(attempt, idx) in selectedTopicAttempts"
                    :key="`attempt-${idx}`"
                    class="hover:shadow-md transition-shadow"
                    :class="{ 'ring-2 ring-yellow-300': attempt.parentInvolvement }"
                  >
                    <CardContent class="p-4">
                      <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-2">
                            <Badge variant="outline" class="text-xs">
                              Percubaan {{ idx + 1 }}
                            </Badge>
                            <Badge variant="secondary" class="text-xs">
                              {{ formatQuizDate(attempt.date) }}
                            </Badge>
                          </div>
                          <div class="flex items-center gap-1 text-xs text-gray-500">
                            <Clock class="w-3 h-3" />
                            {{ attempt.timeSpent }}
                          </div>
                        </div>
                        <div class="text-right">
                          <div
                            class="text-xl font-bold"
                            :class="getPerformanceColor(attempt.score)"
                          >
                            {{ attempt.score }}%
                          </div>
                          <Badge :class="getPerformanceBadge(attempt.score).class" class="text-xs">
                            {{ getPerformanceBadge(attempt.score).text }}
                          </Badge>
                        </div>
                      </div>

                      <div
                        v-if="attempt.parentInvolvement"
                        class="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center gap-2"
                      >
                        <AlertTriangle class="w-3 h-3 flex-shrink-0" />
                        Aktiviti mencurigakan dikesan
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <!-- Topics Overview -->
              <div v-else>
                <h3 class="text-lg font-semibold mb-4">Prestasi Mengikut Topik</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card
                    v-for="topic in quizzesByTopic"
                    :key="topic.topic"
                    class="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                    @click="selectTopic(topic)"
                  >
                    <CardContent class="p-4">
                      <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                          <h4 class="font-medium text-sm mb-1">{{ topic.topic }}</h4>
                          <Badge variant="outline" class="text-xs">
                            Unit {{ topic.unit || 'N/A' }}
                          </Badge>
                        </div>
                        <Eye class="w-4 h-4 text-gray-400" />
                      </div>

                      <div class="space-y-2">
                        <div class="flex items-center justify-between text-sm">
                          <span class="text-gray-600">Purata Skor</span>
                          <span
                            class="font-medium"
                            :class="getPerformanceColor(topic.stats.averageScore)"
                          >
                            {{ topic.stats.averageScore }}%
                          </span>
                        </div>

                        <Progress :value="topic.stats.averageScore" class="h-2" />

                        <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-3">
                          <div class="flex items-center gap-1">
                            <TrendingUp class="w-3 h-3" />
                            {{ topic.stats.totalAttempts }} percubaan
                          </div>
                          <div class="flex items-center gap-1">
                            <Clock class="w-3 h-3" />
                            {{ formatTimeSpent(topic.stats.totalTimeSpent) }}
                          </div>
                        </div>

                        <div
                          v-if="topic.stats.suspiciousCount > 0"
                          class="flex items-center gap-1 text-xs text-yellow-600 mt-2"
                        >
                          <AlertTriangle class="w-3 h-3" />
                          {{ topic.stats.suspiciousCount }} mencurigakan
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div v-if="quizzesByTopic.length === 0" class="text-center py-12 text-gray-500">
                  <BookOpen class="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Tiada data topik tersedia untuk pelajar ini.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.container {
  max-width: 1000px;
}
.animate-fade-in {
  animation: fadeIn 0.7s;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
