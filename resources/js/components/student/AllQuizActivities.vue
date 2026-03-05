<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <BarChart3 class="h-5 w-5" />
        Semua Aktiviti Kuiz
      </CardTitle>
      <CardDescription> Senarai lengkap semua kuiz dan pencapaian anda </CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center py-8">
        <div class="flex items-center gap-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span class="text-sm text-gray-500">Memuat data kuiz...</span>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-8">
        <div class="text-red-500 mb-2">Ralat memuat data kuiz</div>
        <Button @click="refresh" variant="outline" size="sm"> Muat Semula </Button>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Quiz Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card
            v-for="quiz in quizSummary"
            :key="quiz.id"
            class="cursor-pointer hover:shadow-md transition-shadow"
            @click="selectQuiz(quiz)"
            :class="{ 'ring-2 ring-blue-500': selectedQuiz?.id === quiz.id }"
          >
            <CardContent class="p-4">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="font-medium text-sm mb-1">{{ quiz.title }}</h4>
                  <p class="text-xs text-gray-500 mb-2">Unit {{ quiz.unit }}</p>
                  <div class="flex items-center gap-2 text-xs">
                    <span
                      class="px-2 py-1 rounded-full text-white"
                      :class="getQuizTypeColor(quiz.quiz_type)"
                    >
                      {{ getQuizTypeLabel(quiz.quiz_type) }}
                    </span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-blue-600">{{ quiz.avgScore }}%</div>
                  <div class="text-xs text-gray-500">{{ quiz.totalAttempts }} cubaan</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Selected Quiz Details -->
        <div v-if="selectedQuiz" class="mt-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Sejarah Cubaan: {{ selectedQuiz.title }}</h3>
            <Button @click="selectedQuiz = null" variant="ghost" size="sm">
              <X class="h-4 w-4" />
            </Button>
          </div>

          <!-- Attempts List -->
          <div class="space-y-3">
            <Card
              v-for="(attempt, index) in selectedQuizAttempts"
              :key="attempt.id"
              class="border-l-4"
              :class="getAttemptBorderColor(attempt.score)"
            >
              <CardContent class="p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="text-center">
                      <div class="text-xs text-gray-500 mb-1">Cubaan</div>
                      <div class="font-semibold">{{ index + 1 }}</div>
                    </div>
                    <div>
                      <div class="font-medium">Skor: {{ attempt.score }}%</div>
                      <div class="text-sm text-gray-500">
                        {{ formatDate(attempt.completed_at) }}
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium">
                      Masa: {{ formatDuration(attempt.duration) }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ getPerformanceLabel(attempt.score) }}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div v-if="selectedQuizAttempts.length === 0" class="text-center py-6 text-gray-500">
              Tiada cubaan ditemui untuk kuiz ini
            </div>
          </div>
        </div>

        <!-- No quizzes found -->
        <div v-if="!quizSummary.length" class="text-center py-8 text-gray-500">
          <BarChart3 class="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Tiada aktiviti kuiz ditemui</p>
          <p class="text-sm">Cuba selesaikan kuiz pertama anda!</p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStudentPerformanceStore } from '@/stores/studentPerformance'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const performanceStore = useStudentPerformanceStore()
const authStore = useAuthStore()

// State
const isLoading = ref(false)
const error = ref(null)
const selectedQuiz = ref(null)
const allQuizAttempts = ref([])

// Get student ID
const studentId = computed(() => {
  if (authStore.currentStudent?.user_id) return authStore.currentStudent.user_id
  if (authStore.currentStudent?.username) return authStore.currentStudent.username
  if (authStore.currentStudent?.student_username) return authStore.currentStudent.student_username
  return null
})

// Process quiz data into summary format
const quizSummary = computed(() => {
  if (!allQuizAttempts.value.length) return []

  // Group attempts by quiz
  const quizGroups = {}
  allQuizAttempts.value.forEach((attempt) => {
    const quizId = attempt.quiz_id || attempt.quizzes?.id
    if (!quizId) return

    if (!quizGroups[quizId]) {
      quizGroups[quizId] = {
        id: quizId,
        title:
          attempt.quizzes?.title ||
          `Unit ${attempt.quizzes?.quiz_unit} - Aktiviti ${attempt.quizzes?.no_activity}`,
        unit: attempt.quizzes?.quiz_unit || 'N/A',
        quiz_type: attempt.quizzes?.quiz_type || 'visual',
        attempts: [],
      }
    }
    quizGroups[quizId].attempts.push(attempt)
  })

  // Calculate statistics for each quiz
  return Object.values(quizGroups)
    .map((quiz) => {
      const scores = quiz.attempts.map((a) => parseFloat(a.score) || 0)
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0

      return {
        ...quiz,
        totalAttempts: quiz.attempts.length,
        avgScore,
        bestScore: Math.max(...scores, 0),
        latestAttempt: quiz.attempts[quiz.attempts.length - 1],
      }
    })
    .sort(
      (a, b) =>
        b.latestAttempt?.completed_at?.localeCompare(a.latestAttempt?.completed_at || '') || 0,
    )
})

// Get attempts for selected quiz
const selectedQuizAttempts = computed(() => {
  if (!selectedQuiz.value) return []

  return allQuizAttempts.value
    .filter((attempt) => (attempt.quiz_id || attempt.quizzes?.id) === selectedQuiz.value.id)
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
    .map((attempt) => ({
      ...attempt,
      duration: calculateDuration(attempt.started_at, attempt.completed_at),
    }))
})

// Methods
const loadAllQuizAttempts = async () => {
  if (!studentId.value) {
    error.value = 'Student ID tidak ditemui'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    // Use the performance store to get all quiz attempts
    const data = await performanceStore.fetchAllQuizAttempts(studentId.value)
    allQuizAttempts.value = data || []
  } catch (err) {
    console.error('Error loading all quiz attempts:', err)
    error.value = 'Gagal memuat data kuiz'
    toast.error('Gagal memuat data kuiz')
  } finally {
    isLoading.value = false
  }
}

const selectQuiz = (quiz) => {
  selectedQuiz.value = selectedQuiz.value?.id === quiz.id ? null : quiz
}

const refresh = () => {
  loadAllQuizAttempts()
}

// Helper functions
const getQuizTypeColor = (type) => {
  const colors = {
    visual: 'bg-blue-500',
    auditori: 'bg-green-500',
    kinestetik: 'bg-purple-500',
  }
  return colors[type] || 'bg-gray-500'
}

const getQuizTypeLabel = (type) => {
  const labels = {
    visual: 'Visual',
    auditori: 'Auditori',
    kinestetik: 'Kinestetik',
  }
  return labels[type] || 'Umum'
}

const getAttemptBorderColor = (score) => {
  if (score >= 80) return 'border-l-green-500'
  if (score >= 60) return 'border-l-yellow-500'
  return 'border-l-red-500'
}

const getPerformanceLabel = (score) => {
  if (score >= 80) return 'Cemerlang'
  if (score >= 60) return 'Baik'
  return 'Perlu Diperbaiki'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const calculateDuration = (startedAt, completedAt) => {
  if (!startedAt || !completedAt) return 0
  const start = new Date(startedAt)
  const end = new Date(completedAt)
  return Math.round((end - start) / (1000 * 60)) // minutes
}

const formatDuration = (minutes) => {
  if (!minutes || minutes < 1) return '< 1 minit'
  if (minutes < 60) return `${minutes} minit`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours} jam ${remainingMinutes} minit` : `${hours} jam`
}

// Lifecycle
onMounted(() => {
  loadAllQuizAttempts()
})
</script>
