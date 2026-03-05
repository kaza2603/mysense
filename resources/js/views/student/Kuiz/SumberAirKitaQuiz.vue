<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { CheckCircle, XCircle, RotateCcw, Sparkles, Droplets } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useQuizAttemptsStore } from '@/stores/quizAttempts'
import { useQuizzesStore } from '@/stores/quizzes'
import { useQuizIdentifier } from '@/composables/useQuizIdentifier'

const router = useRouter()
const authStore = useAuthStore()
const quizAttemptsStore = useQuizAttemptsStore()
const quizzesStore = useQuizzesStore()

// Try to use shared accessibility settings from KuizLayout
const sharedSettings = inject('accessibilitySettings', null)

// Use the quiz identifier composable for Unit 6, Activity 1, visual type
const quizIdentifier = useQuizIdentifier({
  unit: 'Unit 6',
  activity: 1,
  type: 'visual',
})

const quizId = ref(null)
const quizAttemptId = ref(null)
const startedAt = ref(null)

const quizTitle = ref('Unit 6: Aktiviti 1 - Sumber Air Kita')
const instructions = ref('Isikan nama sumber air berdasarkan nombor yang ditunjukkan dalam gambar.')

// Define the water sources
const waterSources = ref([
  {
    id: 1,
    number: '1',
    label: 'Hujan',
    answer: '',
    isCorrect: null,
    description: 'Air hujan adalah sumber air semula jadi yang turun dari langit.',
  },
  {
    id: 2,
    number: '2',
    label: 'Tasik',
    answer: '',
    isCorrect: null,
    description: 'Tasik adalah takungan air yang besar, dikelilingi oleh tanah.',
  },
  {
    id: 3,
    number: '3',
    label: 'Perigi',
    answer: '',
    isCorrect: null,
    description: 'Perigi adalah lubang yang digali untuk mendapatkan air bawah tanah.',
  },
  {
    id: 4,
    number: '4',
    label: 'Sungai',
    answer: '',
    isCorrect: null,
    description:
      'Sungai adalah aliran air tawar yang mengalir dari kawasan tinggi ke kawasan rendah.',
  },
  {
    id: 5,
    number: '5',
    label: 'Laut',
    answer: '',
    isCorrect: null,
    description: 'Laut adalah jasad air masin yang luas yang mengelilingi benua dan pulau.',
  },
])

const quizState = ref('initial') // initial, in-progress, submitted, completed_correct, completed_incorrect
const score = ref(0)
const showInstructions = ref(true)
const imageLoaded = ref(false)
const activeSourceIndex = ref(0) // For highlighting the current question

// Water sources image path
const waterSourcesImagePath = '/images/student/unit6-1/1.png'

// Function to handle answer change
const handleAnswerChange = (source, index) => {
  // Only update the active index but don't automatically move focus
  activeSourceIndex.value = index

  // If this was the first input, change state to in-progress
  if (quizState.value === 'initial') {
    quizState.value = 'in-progress'
  }
}

// Function to handle key presses on input fields
const handleKeyPress = (event, index) => {
  // If Enter key is pressed, move to the next input
  if (event.key === 'Enter') {
    if (index < waterSources.value.length - 1) {
      activeSourceIndex.value = index + 1
      // Focus on the next input (with a short delay to ensure DOM is updated)
      setTimeout(() => {
        const nextInput = document.getElementById(`source-answer-${index + 1}`)
        if (nextInput) nextInput.focus()
      }, 50)
    } else {
      // If it's the last input, check if we can submit
      if (allQuestionsAnswered.value) {
        submitQuiz()
      }
    }
  }
}

// Check if all questions are answered
const allQuestionsAnswered = computed(() => {
  return waterSources.value.every((source) => source.answer.trim() !== '')
})

// Submit the quiz with proper database submission
const submitQuiz = async () => {
  if (!authStore.isStudentAuthenticated) {
    alert('Sila log masuk untuk menghantar jawapan kuiz.')
    return
  }

  // Ensure we have a quiz ID before submitting
  if (!quizId.value) {
    console.error('Quiz ID not available. Cannot submit quiz attempt.')
    alert('Gagal menghantar jawapan: Data kuiz tidak tersedia.')
    return
  }

  const completedAt = new Date().toISOString()
  // Calculate score and prepare answers for API
  let correctAnswers = 0
  const answersForApi = {}

  waterSources.value.forEach((source) => {
    // Case insensitive comparison and ignore extra spaces
    const normalizedAnswer = source.answer.trim().toLowerCase()
    const normalizedLabel = source.label.toLowerCase()

    source.isCorrect = normalizedAnswer === normalizedLabel
    if (source.isCorrect) {
      correctAnswers++
    }

    answersForApi[source.id] = {
      selectedAnswer: source.answer.trim(),
      correctAnswer: source.label,
      isCorrect: source.isCorrect,
      sourceNumber: source.number,
      sourceName: source.label,
    }
  })

  // Calculate score as percentage
  const totalScore = Math.round((correctAnswers / waterSources.value.length) * 100)

  quizState.value = 'submitted'

  // Prepare data for API submission
  const studentId = authStore.currentStudent?.user_id

  if (!studentId) {
    console.error('Student ID not found. Cannot submit quiz attempt.')
    alert('Sila log masuk untuk menghantar jawapan kuiz.')
    return
  }

  if (!startedAt.value) {
    console.warn('Quiz started_at time not recorded. Using current time as fallback.')
    startedAt.value = completedAt
  }

  // Calculate time spent in minutes
  const timeSpentMs = new Date(completedAt) - new Date(startedAt.value)
  const timeSpentMinutes = Math.max(1, Math.round(timeSpentMs / (1000 * 60)))
  try {
    console.log('Submitting quiz attempt...', {
      student_id: studentId,
      quiz_id: quizId.value,
      score: totalScore,
      answers: answersForApi,
      started_at: startedAt.value,
      completed_at: completedAt,
      time_spent: timeSpentMinutes,
    })

    const quizAttempt = await quizAttemptsStore.submitAttempt({
      student_id: studentId,
      quiz_id: quizId.value,
      score: totalScore,
      answers: answersForApi,
      started_at: startedAt.value,
      completed_at: completedAt,
      time_spent: timeSpentMinutes,
      status: 'completed',
    })

    if (quizAttempt) {
      quizAttemptId.value = quizAttempt.id // Set completion state based on score (100% for all correct)
      if (correctAnswers === waterSources.value.length) {
        quizState.value = 'completed_correct'
      } else {
        quizState.value = 'completed_incorrect'
      }
    } else {
      throw new Error('Failed to submit quiz attempt')
    }
  } catch (error) {
    console.error('Error submitting quiz attempt:', error)
    alert('Gagal menghantar jawapan kuiz. Sila cuba lagi.')
    quizState.value = 'in-progress' // Allow user to retry
  }

  score.value = totalScore
}

// Reset the quiz
const resetQuiz = () => {
  waterSources.value.forEach((source) => {
    source.answer = ''
    source.isCorrect = null
  })

  score.value = 0
  quizState.value = 'initial'
  showInstructions.value = true
  activeSourceIndex.value = 0
}

// Function to handle image load
const handleImageLoad = () => {
  imageLoaded.value = true
}

// Function to handle image error
const handleImageError = () => {
  console.error('Failed to load image:', waterSourcesImagePath)
  // Still set as loaded to prevent blocking the UI
  imageLoaded.value = true
}

// Getter for input class based on state
const getInputClass = (source) => {
  if (quizState.value === 'completed_correct' || quizState.value === 'completed_incorrect') {
    return source.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
  }
  return activeSourceIndex.value === waterSources.value.findIndex((s) => s.id === source.id)
    ? 'border-blue-500 focus:border-blue-500 focus:ring-blue-500'
    : 'border-gray-200'
}

// Load quiz data from API
const loadQuizData = async () => {
  try {
    if (!quizIdentifier.isValid.value) {
      console.error('Invalid quiz identifier:', quizIdentifier.debug)
      throw new Error('Cannot identify quiz parameters')
    }

    console.log('Loading quiz with identifier:', quizIdentifier.identifier.value)

    const quiz = await quizzesStore.fetchQuizByIdentifier(
      quizIdentifier.unit.value,
      quizIdentifier.activity.value,
      quizIdentifier.type.value,
    )

    if (quiz) {
      quizId.value = quiz.id
      quizTitle.value = quiz.title || quizTitle.value
      instructions.value = quiz.instructions || instructions.value
      console.log('Quiz loaded successfully:', quiz)
    }
  } catch (error) {
    console.error('Failed to load quiz data:', error)
    // Fallback: create the quiz if it doesn't exist
    try {
      console.log('Creating missing quiz...')
      const newQuiz = await quizzesStore.createQuiz({
        quiz_unit: quizIdentifier.unit.value,
        no_activity: quizIdentifier.activity.value,
        quiz_type: quizIdentifier.type.value,
        title: quizTitle.value,
        description: 'Quiz tentang sumber-sumber air dalam kehidupan seharian',
        instructions: instructions.value,
      })

      if (newQuiz) {
        quizId.value = newQuiz.id
        console.log('Quiz created successfully:', newQuiz)
      }
    } catch (createError) {
      console.error('Failed to create quiz:', createError)
      // If all else fails, show error to user
      alert('Gagal memuat data kuiz. Sila cuba lagi.')
    }
  }
}

// Initialize when component mounts
onMounted(async () => {
  console.log('Component mounted. Quiz identifier:', quizIdentifier.identifier.value)

  // Set quiz start time
  startedAt.value = new Date().toISOString()
  // Load quiz data from API
  await loadQuizData()

  // Preload the image
  const img = new Image()
  img.onload = handleImageLoad
  img.onerror = handleImageError
  img.src = waterSourcesImagePath
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center p-6"
    :class="{
      'dyslexia-friendly': sharedSettings?.dyslexiaMode?.value,
      'high-contrast': sharedSettings?.highContrast?.value,
    }"
  >
    <Card class="h-auto w-full max-w-5xl shadow-2xl rounded-xl">
      <CardHeader
        class="text-left bg-blue-600 text-white rounded-t-xl p-8"
        :class="[sharedSettings?.fontSize?.value || 'text-base']"
      >
        <CardTitle class="text-4xl font-bold flex items-center">
          <Droplets class="w-10 h-10 mr-3 text-blue-200" />
          {{ quizTitle }}
        </CardTitle>
        <CardDescription
          v-if="showInstructions"
          class="text-white mt-6 mb-2"
          :class="[sharedSettings?.fontSize?.value || 'text-base']"
        >
          <div class="flex items-start">
            <span class="leading-relaxed">{{ instructions }}</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent class="p-8">
        <!-- Quiz Main Content -->
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Water Sources Image (Left Side) -->
          <div class="w-full lg:w-1/2">
            <div class="relative w-full h-auto aspect-[4/3] mb-4">
              <img
                v-show="imageLoaded"
                :src="waterSourcesImagePath"
                alt="Sumber-sumber air berlabel"
                class="w-full h-auto object-contain rounded-lg border-2 border-blue-200"
                @load="handleImageLoad"
                @error="handleImageError"
              />
              <!-- Loading indicator if image is not loaded -->
              <div
                v-if="!imageLoaded"
                class="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg"
              >
                <div class="text-blue-600 animate-pulse">Memuat gambar...</div>
              </div>
            </div>
            <p
              class="mt-4 text-center text-sm text-gray-600"
              :class="[sharedSettings?.fontSize?.value || 'text-base']"
            >
              Gambar sumber air dengan bahagian-bahagian berlabel dari 1 hingga 5.
            </p>
          </div>

          <!-- Fill in the Blanks Questions (Right Side) -->
          <div class="w-full lg:w-1/2 space-y-6">
            <div
              v-for="(source, index) in waterSources"
              :key="source.id"
              class="p-4 rounded-lg border-2 transition-all duration-300"
              :class="[
                activeSourceIndex === index ? 'border-blue-400 bg-blue-50' : 'border-gray-200',
                (quizState === 'completed_correct' || quizState === 'completed_incorrect') &&
                source.isCorrect
                  ? 'border-green-400 bg-green-50'
                  : '',
                (quizState === 'completed_correct' || quizState === 'completed_incorrect') &&
                !source.isCorrect
                  ? 'border-red-400 bg-red-50'
                  : '',
              ]"
            >
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
                  :class="
                    activeSourceIndex === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  "
                >
                  {{ source.number }}
                </div>
                <label
                  :for="`source-answer-${index}`"
                  class="font-medium"
                  :class="[sharedSettings?.fontSize?.value || 'text-base']"
                >
                  Sumber air bernombor {{ source.number }} adalah:
                </label>
              </div>
              <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                  :id="`source-answer-${index}`"
                  v-model="source.answer"
                  :disabled="
                    quizState === 'completed_correct' || quizState === 'completed_incorrect'
                  "
                  @input="handleAnswerChange(source, index)"
                  @keydown="handleKeyPress($event, index)"
                  @focus="activeSourceIndex = index"
                  type="text"
                  class="w-full p-3 border-2 rounded-lg"
                  :class="[sharedSettings?.fontSize?.value || 'text-base', getInputClass(source)]"
                  placeholder="Masukkan jawapan anda"
                />
                <!-- Show correct/incorrect icons when completed -->
                <div
                  v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
                  class="flex items-center"
                >
                  <CheckCircle v-if="source.isCorrect" class="w-6 h-6 text-green-600 mr-1" />
                  <XCircle v-else class="w-6 h-6 text-red-600 mr-1" />
                  <span
                    v-if="!source.isCorrect"
                    class="text-red-600"
                    :class="[sharedSettings?.fontSize?.value || 'text-base']"
                  >
                    Jawapan: {{ source.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Quiz Complete Screen -->
        <div
          v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
          class="text-center p-8 bg-blue-100 rounded-lg border-4 border-blue-500 my-6"
        >
          <!-- Success Message -->
          <div v-if="quizState === 'completed_correct'">
            <div class="flex flex-col items-center">
              <CheckCircle class="w-24 h-24 text-green-500 mb-4 animate-bounce" />
              <h2
                class="text-4xl font-bold text-green-600 mb-4"
                :class="[sharedSettings?.fontSize?.value || 'text-base']"
              >
                🎉 TAHNIAH! 🎉
              </h2>
              <p
                class="text-green-700 text-2xl mb-6 font-bold"
                :class="[sharedSettings?.fontSize?.value || 'text-base']"
              >
                ANDA BERJAYA!
              </p>
              <p
                class="text-green-600 text-lg mb-6"
                :class="[sharedSettings?.fontSize?.value || 'text-base']"
              >
                Semua jawapan anda betul. Hebat!
              </p>
            </div>
          </div>

          <!-- Partial Success Message -->
          <div v-if="quizState === 'completed_incorrect'">
            <div class="flex flex-col items-center">
              <XCircle class="w-24 h-24 text-orange-500 mb-4" />
              <h2
                class="text-4xl font-bold text-orange-600 mb-4"
                :class="[sharedSettings?.fontSize?.value || 'text-base']"
              >
                CUBA LAGI!
              </h2>
              <p
                class="text-orange-700 text-2xl mb-6 font-bold"
                :class="[sharedSettings?.fontSize?.value || 'text-base']"
              >
                Jangan putus asa!
              </p>
              <p
                class="text-orange-600 text-lg mb-6"
                :class="[sharedSettings?.fontSize?.value || 'text-base']"
              >
                Anda hampir berjaya. Teruskan usaha!
              </p>
            </div>
          </div>

          <div class="flex flex-col items-center">
            <Sparkles class="w-16 h-16 text-blue-500 mb-4 animate-pulse" />
            <h2
              class="text-3xl font-bold text-blue-700 mb-4"
              :class="[sharedSettings?.fontSize?.value || 'text-base']"
            >
              Kuiz Selesai!
            </h2>
            <p
              class="text-blue-700 text-xl mb-6"
              :class="[sharedSettings?.fontSize?.value || 'text-base']"
            >
              Skor anda: <span class="font-bold">{{ score }}%</span> ({{
                waterSources.filter((s) => s.isCorrect).length
              }}
              daripada <span class="font-bold">{{ waterSources.length }}</span> soalan betul)
            </p>
            <div class="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div
                class="h-4 rounded-full"
                :class="score === 100 ? 'bg-green-500' : 'bg-blue-500'"
                :style="{ width: `${score}%` }"
              ></div>
            </div>

            <!-- Information about Water Sources -->
            <div class="mt-8 w-full">
              <h3
                class="text-xl font-bold text-blue-700 mb-4 text-center"
                :class="[sharedSettings?.fontSize?.value || 'text-base']"
              >
                Sumber-Sumber Air Dalam Kehidupan Seharian
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="source in waterSources"
                  :key="`info-${source.id}`"
                  class="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500"
                >
                  <h4
                    class="text-lg font-bold text-blue-600 mb-2"
                    :class="[sharedSettings?.fontSize?.value || 'text-base']"
                  >
                    {{ source.label }}
                  </h4>
                  <p
                    class="text-gray-700"
                    :class="[sharedSettings?.fontSize?.value || 'text-base']"
                  >
                    {{ source.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter
        class="flex flex-col sm:flex-row justify-between items-center gap-6 p-8 bg-gray-100 rounded-b-xl"
      >
        <div class="flex gap-4">
          <Button
            v-if="
              allQuestionsAnswered &&
              quizState !== 'completed_correct' &&
              quizState !== 'completed_incorrect' &&
              quizState !== 'submitted'
            "
            @click="submitQuiz"
            class="bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle class="w-5 h-5 mr-2" />
            Hantar Jawapan
          </Button>
        </div>

        <div class="flex gap-4">
          <Button
            v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
            @click="resetQuiz"
            class="bg-blue-600 hover:bg-blue-700"
          >
            <RotateCcw class="w-5 h-5 mr-2" />
            Cuba Lagi
          </Button>
          <Button variant="outline" @click="router.push('/student/kuiz-index')">
            Kembali ke Index Kuiz
          </Button>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>

<style scoped>
/* Animation for sparkles */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}
.animate-pulse {
  animation: pulse 1.5s infinite;
}

/* Animation for bounce effect */
@keyframes bounce {
  0%,
  20%,
  53%,
  80%,
  100% {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0);
  }
  40%,
  43% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -30px, 0);
  }
  70% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0, -4px, 0);
  }
}
.animate-bounce {
  animation: bounce 1s infinite;
}

/* Add a fade-in effect for images */
img {
  transition: opacity 0.5s ease;
  object-fit: contain;
  max-width: 100%;
  height: auto;
}

/* Button focus styles for accessibility */
button:focus {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
}

button:focus:not(:focus-visible) {
  outline: none;
}

button:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
}

/* Dyslexia-friendly font setting */
.dyslexia-friendly {
  font-family: 'Comic Sans MS', 'Comic Sans', cursive;
  letter-spacing: 0.05em;
  word-spacing: 0.1em;
}

.dyslexia-friendly p,
.dyslexia-friendly h1,
.dyslexia-friendly h2,
.dyslexia-friendly h3,
.dyslexia-friendly span,
.dyslexia-friendly label {
  line-height: 1.8;
}

/* High contrast mode */
.high-contrast {
  filter: contrast(1.4);
}

.high-contrast img {
  filter: contrast(1.2) brightness(1.1);
}

.high-contrast button,
.high-contrast input {
  border-width: 2px;
}
</style>
