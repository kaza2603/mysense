<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue'
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle, XCircle, RotateCcw, Sparkles, Volume2, Sun } from 'lucide-vue-next'
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

// Use the quiz identifier composable for Unit 5, Activity 1, visual type
const quizIdentifier = useQuizIdentifier({
  unit: 'Unit 5',
  activity: 1,
  type: 'visual',
})

const quizId = ref(null)
const quizAttemptId = ref(null)
const startedAt = ref(null)

const quizTitle = ref('Unit 5: Aktiviti 1 - Cahaya, Oh Cahaya!')
const instructions = ref('Pilih sumber cahaya yang betul berdasarkan gambar yang ditunjukkan.')

// Define the light sources
const lightSources = ref([
  {
    id: 1,
    imagePath: '/images/student/unit5-1/1.png',
    correctAnswer: 'Lampu',
    selectedAnswer: '',
    isCorrect: null,
    description: 'Lampu adalah sumber cahaya buatan yang membantu kita melihat dalam gelap.',
  },
  {
    id: 2,
    imagePath: '/images/student/unit5-1/2.png',
    correctAnswer: 'Matahari',
    selectedAnswer: '',
    isCorrect: null,
    description: 'Matahari adalah sumber cahaya semula jadi yang paling penting di bumi.',
  },
  {
    id: 3,
    imagePath: '/images/student/unit5-1/3.png',
    correctAnswer: 'Api',
    selectedAnswer: '',
    isCorrect: null,
    description: 'Api menghasilkan cahaya dan haba, tetapi perlu digunakan dengan berhati-hati.',
  },
  {
    id: 4,
    imagePath: '/images/student/unit5-1/4.png',
    correctAnswer: 'Lampu',
    selectedAnswer: '',
    isCorrect: null,
    description: 'Lampu adalah sumber cahaya penting dalam kehidupan seharian kita.',
  },
])

// Available options for dropdown
const availableOptions = ['Pilih jawapan...', 'Matahari', 'Lampu', 'Api']

const quizState = ref('initial') // initial, submitted, completed_correct, completed_incorrect
const score = ref(0)
const showInstructions = ref(true)
const imagesLoaded = ref(0)
const totalImages = lightSources.value.length
const activeQuestionIndex = ref(0)
const imageLoadTimeout = ref(null)

// Function to handle answer change
const handleAnswerChange = (source, index) => {
  activeQuestionIndex.value = index

  // Change quiz state if this is the first answer
  if (quizState.value === 'initial' && source.selectedAnswer !== 'Pilih jawapan...') {
    quizState.value = 'in-progress'
  }
}

// Function to handle image load
const handleImageLoad = () => {
  imagesLoaded.value++
  console.log(`Image loaded. Count: ${imagesLoaded.value}/${totalImages}`)
}

// Function to handle image error
const handleImageError = (source) => {
  console.error('Image failed to load:', source.imagePath)
  // Count error as loaded to prevent blocking the UI
  imagesLoaded.value++
  console.log(`Image failed but counted. Count: ${imagesLoaded.value}/${totalImages}`)
}

// Check if all questions are answered
const allQuestionsAnswered = computed(() => {
  return lightSources.value.every(
    (source) => source.selectedAnswer !== '' && source.selectedAnswer !== 'Pilih jawapan...',
  )
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
  let totalScore = 0
  const answersForApi = {}

  lightSources.value.forEach((source) => {
    const isCorrect = source.selectedAnswer === source.correctAnswer
    source.isCorrect = isCorrect

    if (isCorrect) {
      totalScore++
    }

    answersForApi[source.id] = {
      selectedAnswer: source.selectedAnswer,
      correctAnswer: source.correctAnswer,
      isCorrect: isCorrect,
    }
  })

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
  const timeSpentMinutes = Math.max(1, Math.round(timeSpentMs / (1000 * 60))) // Minimum 1 minute

  const quizAttemptData = {
    student_id: studentId,
    quiz_id: quizId.value,
    score: parseFloat(((totalScore / lightSources.value.length) * 100).toFixed(2)),
    answers: answersForApi,
    started_at: startedAt.value,
    completed_at: completedAt,
    time_spent: timeSpentMinutes,
    status: 'completed',
  }

  try {
    console.log('About to submit quiz attempt data:', quizAttemptData)

    // Submit the quiz attempt and get the response
    const response = await quizAttemptsStore.submitAttempt(quizAttemptData)

    console.log('Quiz attempt submitted successfully, response:', response)

    // Handle successful submission
    if (response && response.attempt && response.attempt.id) {
      quizAttemptId.value = response.attempt.id
      console.log('Stored quiz attempt ID:', quizAttemptId.value)
    } else if (quizAttemptsStore.currentAttemptId) {
      // Fallback to store's currentAttemptId if response structure is different
      quizAttemptId.value = quizAttemptsStore.currentAttemptId
      console.log('Using store currentAttemptId:', quizAttemptId.value)
    }

    // Show success message to user
    alert('Jawapan kuiz telah berjaya dihantar!')
  } catch (error) {
    console.error('Error submitting quiz attempt via store:', error)

    // Get error message safely
    const errorMessage = error?.message || 'Sila cuba lagi.'
    alert(`Gagal menghantar jawapan kuiz: ${errorMessage}`)
  }

  // Store the final score for display
  score.value = totalScore // Determine if all answers are correct for UI feedback
  if (totalScore === lightSources.value.length) {
    quizState.value = 'completed_correct'
  } else {
    quizState.value = 'completed_incorrect'
  }
}

// Reset the quiz
const resetQuiz = () => {
  lightSources.value.forEach((source) => {
    source.selectedAnswer = ''
    source.isCorrect = null
  })

  score.value = 0
  quizState.value = 'initial'
  showInstructions.value = true
  activeQuestionIndex.value = 0
  quizAttemptId.value = null
  startedAt.value = new Date().toISOString()
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
        description: 'Quiz tentang sumber cahaya',
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

// Function to preload images
const preloadImages = () => {
  lightSources.value.forEach((source) => {
    const img = new Image()
    img.onload = () => {
      // Count as loaded even before they appear in the DOM
      handleImageLoad()
    }
    img.onerror = () => {
      // Handle errors
      handleImageError(source)
    }
    img.src = source.imagePath
  })
}

// Initialize when component mounts
onMounted(async () => {
  console.log('Component mounted. Quiz identifier:', quizIdentifier.identifier.value)

  // Set quiz start time
  startedAt.value = new Date().toISOString()

  // Load quiz data from API
  await loadQuizData()

  // Start preloading images
  preloadImages()

  // Set a timeout to force showing the quiz if images don't load within 3 seconds
  imageLoadTimeout.value = setTimeout(() => {
    // Force all images to be considered "loaded" after timeout
    if (imagesLoaded.value < totalImages) {
      console.log('Image loading timeout reached, forcing display')
      imagesLoaded.value = totalImages
    }
  }, 3000)
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center p-6"
    :class="{
      'dyslexia-friendly': sharedSettings?.dyslexiaMode.value,
      'high-contrast': sharedSettings?.highContrast?.value,
    }"
  >
    <Card class="h-auto w-full max-w-5xl shadow-2xl rounded-xl">
      <CardHeader
        class="text-left bg-amber-500 text-white rounded-t-xl p-8"
        :class="sharedSettings?.fontSize.value || 'text-base'"
        ><CardTitle class="text-4xl font-bold flex items-center">
          <Sparkles class="w-10 h-10 mr-3 text-yellow-300" />
          {{ quizTitle }}
        </CardTitle>
        <CardDescription
          v-if="showInstructions"
          class="text-white mt-6 mb-2"
          :class="sharedSettings?.fontSize.value || 'text-base'"
        >
          <span class="leading-relaxed">{{ instructions }}</span>
        </CardDescription>
      </CardHeader>
      <CardContent class="p-8">
        <!-- Always show quiz questions - no conditional rendering based on image loading -->
        <!-- Quiz Questions -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div
            v-for="(source, index) in lightSources"
            :key="source.id"
            class="p-6 rounded-lg border-2 transition-all duration-300"
            :class="[
              activeQuestionIndex === index ? 'border-amber-400 bg-amber-50' : 'border-gray-200',
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
            <h3
              class="text-lg font-bold mb-3"
              :class="sharedSettings?.fontSize.value || 'text-base'"
            >
              Soalan {{ source.id }}
            </h3>

            <div class="flex flex-col items-center mb-4">
              <div
                class="relative w-full h-auto mb-4 rounded-lg overflow-hidden border border-gray-200"
              >
                <!-- Loading indicator behind the image -->
                <div class="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div class="text-amber-600 animate-pulse">Memuat gambar...</div>
                </div>
                <img
                  :src="source.imagePath"
                  :alt="`Sumber cahaya ${source.id}`"
                  class="w-full h-full object-contain relative z-10"
                  @load="handleImageLoad"
                  @error="() => handleImageError(source)"
                />
              </div>

              <p class="text-gray-700 mb-2" :class="sharedSettings?.fontSize.value || 'text-base'">
                Apakah sumber cahaya dalam gambar ini?
              </p>
              <div class="w-full">
                <Select
                  v-model="source.selectedAnswer"
                  :disabled="
                    quizState === 'completed_correct' || quizState === 'completed_incorrect'
                  "
                  @update:model-value="handleAnswerChange(source, index)"
                >
                  <SelectTrigger
                    :class="[
                      sharedSettings?.fontSize.value || 'text-base',
                      'w-full',
                      (quizState === 'completed_correct' || quizState === 'completed_incorrect') &&
                      source.isCorrect
                        ? 'border-green-500 bg-green-50'
                        : '',
                      (quizState === 'completed_correct' || quizState === 'completed_incorrect') &&
                      !source.isCorrect
                        ? 'border-red-500 bg-red-50'
                        : '',
                    ]"
                    @focus="activeQuestionIndex = index"
                  >
                    <SelectValue :placeholder="availableOptions[0]" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Pilih Sumber Cahaya</SelectLabel>
                      <SelectItem
                        v-for="option in availableOptions.slice(1)"
                        :key="option"
                        :value="option"
                      >
                        {{ option }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <!-- Show correct/incorrect when completed -->
              <div
                v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
                class="mt-3 flex items-center"
              >
                <CheckCircle v-if="source.isCorrect" class="w-6 h-6 text-green-600 mr-2" />
                <XCircle v-else class="w-6 h-6 text-red-600 mr-2" />
                <span
                  v-if="!source.isCorrect"
                  class="text-red-600"
                  :class="sharedSettings?.fontSize.value || 'text-base'"
                >
                  Jawapan: {{ source.correctAnswer }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <!-- Quiz Complete Screen -->
        <div
          v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
          class="text-center p-8 bg-amber-100 rounded-lg border-4 border-amber-500 my-6"
        >
          <!-- Success Message -->
          <div v-if="quizState === 'completed_correct'">
            <div class="flex flex-col items-center">
              <CheckCircle class="w-24 h-24 text-green-500 mb-4 animate-bounce" />
              <h2
                class="text-4xl font-bold text-green-600 mb-4"
                :class="sharedSettings?.fontSize.value || 'text-base'"
              >
                🎉 TAHNIAH! 🎉
              </h2>
              <p
                class="text-green-700 text-2xl mb-6 font-bold"
                :class="sharedSettings?.fontSize.value || 'text-base'"
              >
                ANDA BERJAYA!
              </p>
              <p
                class="text-green-600 text-lg mb-6"
                :class="sharedSettings?.fontSize.value || 'text-base'"
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
                :class="sharedSettings?.fontSize.value || 'text-base'"
              >
                CUBA LAGI!
              </h2>
              <p
                class="text-orange-700 text-2xl mb-6 font-bold"
                :class="sharedSettings?.fontSize.value || 'text-base'"
              >
                Jangan putus asa!
              </p>
              <p
                class="text-orange-600 text-lg mb-6"
                :class="sharedSettings?.fontSize.value || 'text-base'"
              >
                Anda hampir berjaya. Teruskan usaha!
              </p>
            </div>
          </div>

          <div class="flex flex-col items-center">
            <Sparkles class="w-16 h-16 text-yellow-500 mb-4 animate-pulse" />
            <h2
              class="text-3xl font-bold text-amber-700 mb-4"
              :class="sharedSettings?.fontSize.value || 'text-base'"
            >
              Kuiz Selesai!
            </h2>
            <p
              class="text-amber-700 text-xl mb-6"
              :class="sharedSettings?.fontSize.value || 'text-base'"
            >
              Anda telah menjawab <span class="font-bold">{{ score }}</span> daripada
              <span class="font-bold">{{ lightSources.length }}</span> soalan dengan betul!
            </p>

            <div class="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div
                class="h-4 rounded-full"
                :class="score === lightSources.length ? 'bg-green-500' : 'bg-amber-500'"
                :style="{ width: `${(score / lightSources.length) * 100}%` }"
              ></div>
            </div>
            <!-- Information about Light Sources -->
            <div class="mt-8 w-full">
              <h3
                class="text-xl font-bold text-amber-700 mb-4 text-center"
                :class="sharedSettings?.fontSize.value || 'text-base'"
              >
                Sumber-sumber Cahaya
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="source in lightSources"
                  :key="`info-${source.id}`"
                  class="bg-white rounded-lg shadow-md p-4 border-l-4 border-amber-500"
                >
                  <h4
                    class="text-lg font-bold text-amber-600 mb-2"
                    :class="sharedSettings?.fontSize.value || 'text-base'"
                  >
                    {{ source.correctAnswer }}
                  </h4>
                  <p class="text-gray-700" :class="sharedSettings?.fontSize.value || 'text-base'">
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
            class="bg-amber-600 hover:bg-amber-700"
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

/* Add a fade-in effect for images */
img {
  transition: opacity 0.5s ease;
  object-fit: contain;
  max-width: 100%;
  height: auto;
}

/* Button focus styles for accessibility */
button:focus {
  outline: 3px solid #f59e0b;
  outline-offset: 2px;
}

button:focus:not(:focus-visible) {
  outline: none;
}

button:focus-visible {
  outline: 3px solid #f59e0b;
  outline-offset: 2px;
}

/* Form input focus - now using shadcn-vue Select */
.select-trigger:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
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
.dyslexia-friendly .select-trigger,
.dyslexia-friendly .select-content {
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
.high-contrast .select-trigger {
  border-width: 2px;
}
</style>
