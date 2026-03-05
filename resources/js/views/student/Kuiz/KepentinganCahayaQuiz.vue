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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label as RadioGroupLabel } from '@/components/ui/label'
import { CheckCircle, XCircle, RotateCcw, Sparkles, Sun } from 'lucide-vue-next'
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

// Use the quiz identifier composable for Unit 5, Activity 2, visual type
const quizIdentifier = useQuizIdentifier({
  unit: 'Unit 5',
  activity: 2,
  type: 'visual',
})

const quizId = ref(null)
const quizAttemptId = ref(null)
const startedAt = ref(null)

const quizTitle = ref('Unit 5: Aktiviti 2 - Kepentingan Cahaya')
const instructions = ref(
  'Pilih sama ada aktiviti yang ditunjukkan dalam gambar memerlukan cahaya atau tidak.',
)

// Define the activities
const activities = ref([
  {
    id: 1,
    name: 'Bermain Bola',
    imagePath: '/images/student/unit5-2/1.png',
    requiresLight: true, // Answer: Memerlukan Cahaya
    selectedAnswer: null, // null, true (Memerlukan), false (Tidak Memerlukan)
    isCorrect: null,
    description: 'Bermain bola memerlukan cahaya untuk melihat bola dan pemain lain dengan jelas.',
  },
  {
    id: 2,
    name: 'Bermain Bunga Api',
    imagePath: '/images/student/unit5-2/2.png',
    requiresLight: false, // Answer: Tidak Memerlukan Cahaya (bunga api menghasilkan cahaya)
    selectedAnswer: null,
    isCorrect: null,
    description:
      'Bermain bunga api tidak memerlukan cahaya kerana bunga api sendiri menghasilkan cahaya.',
  },
  {
    id: 3,
    name: 'Membaca Buku',
    imagePath: '/images/student/unit5-2/3.png',
    requiresLight: true, // Answer: Memerlukan Cahaya
    selectedAnswer: null,
    isCorrect: null,
    description: 'Membaca buku memerlukan cahaya yang cukup untuk melihat perkataan dengan jelas.',
  },
  {
    id: 4,
    name: 'Tidur',
    imagePath: '/images/student/unit5-2/4.png',
    requiresLight: false, // Answer: Tidak Memerlukan Cahaya
    selectedAnswer: null,
    isCorrect: null,
    description:
      'Tidur tidak memerlukan cahaya. Sebenarnya, tidur lebih selesa dalam keadaan gelap.',
  },
])

const quizState = ref('initial') // initial, submitted, completed_correct, completed_incorrect
const score = ref(0)
const showInstructions = ref(true)
const imagesLoaded = ref(0)
const totalImages = activities.value.length
const activeQuestionIndex = ref(0)
const imageLoadTimeout = ref(null)

// Function to handle answer selection
const handleAnswerChange = (activity, index, value) => {
  // Explicitly cast value to boolean to ensure correct type comparison
  const boolValue =
    value === true || value === 'true' ? true : value === false || value === 'false' ? false : null

  activity.selectedAnswer = boolValue
  activeQuestionIndex.value = index

  console.log(
    `Activity ${index + 1} answer changed to: ${activity.selectedAnswer} (type: ${typeof activity.selectedAnswer})`,
  )
  console.log(`Value received: ${value} (type: ${typeof value})`)

  // Log the state of all activities
  activities.value.forEach((act, i) => {
    console.log(
      `Activity ${i + 1} selectedAnswer: ${act.selectedAnswer} (type: ${typeof act.selectedAnswer})`,
    )
  })

  console.log(`All questions answered: ${allQuestionsAnswered.value}`)
  // Change quiz state if this is the first answer
  if (quizState.value === 'initial') {
    quizState.value = 'in-progress'
  }
}

// Function to get answer text
const getAnswerText = (value) => {
  return value ? 'Memerlukan Cahaya' : 'Tidak Memerlukan Cahaya'
}

// Function to handle image load
const handleImageLoad = () => {
  imagesLoaded.value++
  console.log(`Image loaded. Count: ${imagesLoaded.value}/${totalImages}`)
}

// Function to handle image error
const handleImageError = (activity) => {
  console.error('Image failed to load:', activity.imagePath)
  // Count error as loaded to prevent blocking the UI
  imagesLoaded.value++
  console.log(`Image failed but counted. Count: ${imagesLoaded.value}/${totalImages}`)
}

// Check if all questions are answered
const allQuestionsAnswered = computed(() => {
  const result = activities.value.every((activity, index) => {
    const isAnswered = activity.selectedAnswer === true || activity.selectedAnswer === false
    console.log(
      `Checking activity ${index + 1}: selectedAnswer=${activity.selectedAnswer}, type=${typeof activity.selectedAnswer}, isAnswered=${isAnswered}`,
    )
    return isAnswered
  })
  console.log(`Final allQuestionsAnswered result: ${result}`)
  return result
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

  activities.value.forEach((activity) => {
    activity.isCorrect = activity.selectedAnswer === activity.requiresLight
    if (activity.isCorrect) {
      totalScore++
    }

    answersForApi[activity.id] = {
      selectedAnswer: activity.selectedAnswer,
      correctAnswer: activity.requiresLight,
      isCorrect: activity.isCorrect,
      activityName: activity.name,
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
    score: parseFloat(((totalScore / activities.value.length) * 100).toFixed(2)),
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
  score.value = totalScore
  // Determine if all answers are correct for UI feedback
  if (totalScore === activities.value.length) {
    quizState.value = 'completed_correct'
  } else {
    quizState.value = 'completed_incorrect'
  }
}

// Reset the quiz
const resetQuiz = () => {
  activities.value.forEach((activity) => {
    activity.selectedAnswer = null
    activity.isCorrect = null
  })
  score.value = 0
  quizState.value = 'initial'
  showInstructions.value = true
  activeQuestionIndex.value = 0
  quizAttemptId.value = null
  startedAt.value = new Date().toISOString()
}

// Function to preload images
const preloadImages = () => {
  activities.value.forEach((activity) => {
    const img = new Image()
    img.onload = () => {
      // Count as loaded even before they appear in the DOM
      handleImageLoad()
    }
    img.onerror = () => {
      // Handle errors
      handleImageError(activity)
    }
    img.src = activity.imagePath
  })
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
        description: 'Quiz tentang kepentingan cahaya dalam kehidupan seharian',
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
      'dyslexia-friendly': sharedSettings?.dyslexiaMode?.value,
      'high-contrast': sharedSettings?.highContrast?.value,
    }"
  >
    <Card class="h-auto w-full max-w-5xl shadow-2xl rounded-xl">
      <CardHeader
        class="text-left bg-amber-500 text-white rounded-t-xl p-8"
        :class="[sharedSettings?.fontSize?.value || 'text-base']"
      >
        <CardTitle class="text-4xl font-bold flex items-center">
          <Sparkles class="w-10 h-10 mr-3 text-yellow-300" />
          {{ quizTitle }}
        </CardTitle>
        <CardDescription
          v-if="showInstructions"
          class="text-white mt-6 mb-2"
          :class="[sharedSettings?.fontSize?.value || 'text-base']"
        >
          <span class="leading-relaxed">{{ instructions }}</span>
        </CardDescription>
      </CardHeader>

      <CardContent class="p-8">
        <!-- Quiz Questions -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div
            v-for="(activity, index) in activities"
            :key="activity.id"
            class="p-6 rounded-lg border-2 transition-all duration-300"
            :class="[
              activeQuestionIndex === index ? 'border-amber-400 bg-amber-50' : 'border-gray-200',
              (quizState === 'completed_correct' || quizState === 'completed_incorrect') &&
              activity.isCorrect
                ? 'border-green-400 bg-green-50'
                : '',
              (quizState === 'completed_correct' || quizState === 'completed_incorrect') &&
              !activity.isCorrect
                ? 'border-red-400 bg-red-50'
                : '',
            ]"
          >
            <h3
              class="text-lg font-bold mb-3"
              :class="[sharedSettings?.fontSize?.value || 'text-base']"
            >
              Soalan {{ activity.id }}: {{ activity.name }}
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
                  :src="activity.imagePath"
                  :alt="`Aktiviti: ${activity.name}`"
                  class="w-full h-48 object-contain relative z-10"
                  @load="handleImageLoad"
                  @error="() => handleImageError(activity)"
                />
              </div>

              <p
                class="text-gray-700 mb-4"
                :class="[sharedSettings?.fontSize?.value || 'text-base']"
              >
                Adakah aktiviti ini memerlukan cahaya?
              </p>
              <RadioGroup
                v-model="activity.selectedAnswer"
                :disabled="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
                class="w-full space-y-4"
                @update:model-value="(val) => handleAnswerChange(activity, index, val)"
                @focus="activeQuestionIndex = index"
              >
                <div class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                  <RadioGroupItem :value="true" :id="`requires-light-${activity.id}-${index}`" />
                  <RadioGroupLabel
                    :for="`requires-light-${activity.id}-${index}`"
                    :class="[sharedSettings?.fontSize?.value || 'text-base']"
                  >
                    Memerlukan Cahaya
                  </RadioGroupLabel>
                </div>
                <div class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                  <RadioGroupItem :value="false" :id="`no-light-${activity.id}-${index}`" />
                  <RadioGroupLabel
                    :for="`no-light-${activity.id}-${index}`"
                    :class="[sharedSettings?.fontSize?.value || 'text-base']"
                  >
                    Tidak Memerlukan Cahaya
                  </RadioGroupLabel>
                </div>
              </RadioGroup>

              <!-- Show correct/incorrect when completed -->
              <div
                v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
                class="mt-4 flex items-center"
              >
                <CheckCircle v-if="activity.isCorrect" class="w-6 h-6 text-green-600 mr-2" />
                <XCircle v-else class="w-6 h-6 text-red-600 mr-2" />
                <span
                  v-if="!activity.isCorrect"
                  class="text-red-600"
                  :class="[sharedSettings?.fontSize?.value || 'text-base']"
                >
                  Jawapan: {{ getAnswerText(activity.requiresLight) }}
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
            <Sparkles class="w-16 h-16 text-yellow-500 mb-4 animate-pulse" />
            <h2
              class="text-3xl font-bold text-amber-700 mb-4"
              :class="[sharedSettings?.fontSize?.value || 'text-base']"
            >
              Kuiz Selesai!
            </h2>
            <p
              class="text-amber-700 text-xl mb-6"
              :class="[sharedSettings?.fontSize?.value || 'text-base']"
            >
              Anda telah menjawab <span class="font-bold">{{ score }}</span> daripada
              <span class="font-bold">{{ activities.length }}</span> soalan dengan betul!
            </p>

            <div class="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div
                class="h-4 rounded-full"
                :class="score === activities.length ? 'bg-green-500' : 'bg-amber-500'"
                :style="{ width: `${(score / activities.length) * 100}%` }"
              ></div>
            </div>

            <!-- Information about Light Importance -->
            <div class="mt-8 w-full">
              <h3
                class="text-xl font-bold text-amber-700 mb-4 text-center"
                :class="[sharedSettings?.fontSize?.value || 'text-base']"
              >
                Kepentingan Cahaya Dalam Kehidupan Seharian
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="activity in activities"
                  :key="`info-${activity.id}`"
                  class="bg-white rounded-lg shadow-md p-4 border-l-4 border-amber-500"
                >
                  <h4
                    class="text-lg font-bold text-amber-600 mb-2"
                    :class="[sharedSettings?.fontSize?.value || 'text-base']"
                  >
                    {{ activity.name }}
                  </h4>
                  <p
                    class="text-gray-700"
                    :class="[sharedSettings?.fontSize?.value || 'text-base']"
                  >
                    {{ activity.description }}
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
