<script setup>
import { ref, computed, onMounted, onBeforeUnmount, inject } from 'vue'
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
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useQuizAttemptsStore } from '@/stores/quizAttempts'
import { useQuizzesStore } from '@/stores/quizzes'
import { useQuizIdentifier } from '@/composables/useQuizIdentifier'

const router = useRouter()
const authStore = useAuthStore()
const quizAttemptsStore = useQuizAttemptsStore()
const quizzesStore = useQuizzesStore()

// Use shared accessibility settings from KuizLayout
const sharedSettings = inject('accessibilitySettings', {
  dyslexiaMode: ref(false),
  fontSize: ref('text-base'),
  highContrast: ref(false),
})

// Use the quiz identifier composable with manual overrides for Unit 2, Activity 1
const quizIdentifier = useQuizIdentifier({
  unit: 'Unit 2',
  activity: 1,
  type: 'visual',
})

const quizId = ref(null)
const quizAttemptId = ref(null)
const startedAt = ref(null)

const quizTitle = ref('Unit 2: Aktiviti 1 - Kenali Deria Organ Manusia')
const instructions = ref('Pilih organ deria yang betul untuk setiap fungsi yang dinyatakan.')

// Define the questions for the quiz
const questions = ref([
  {
    id: 1,
    question: 'Organ deria yang digunakan untuk penglihatan:',
    correctAnswer: 'mata',
    selectedAnswer: null,
    options: [
      {
        id: 1,
        value: 'mata',
        src: '/images/student/unit2-1/1.png',
        alt: 'Mata',
        loaded: false,
        error: false,
      },
      {
        id: 2,
        value: 'telinga',
        src: '/images/student/unit2-1/4.png',
        alt: 'Telinga',
        loaded: false,
        error: false,
      },
      {
        id: 3,
        value: 'hidung',
        src: '/images/student/unit2-1/5.png',
        alt: 'Hidung',
        loaded: false,
        error: false,
      },
    ],
  },
  {
    id: 2,
    question: 'Organ deria yang digunakan untuk rasa:',
    correctAnswer: 'lidah',
    selectedAnswer: null,
    options: [
      {
        id: 1,
        value: 'tangan',
        src: '/images/student/unit2-1/7.png',
        alt: 'Tangan',
        loaded: false,
        error: false,
      },
      {
        id: 2,
        value: 'lidah',
        src: '/images/student/unit2-1/2.png',
        alt: 'Lidah',
        loaded: false,
        error: false,
      },
      {
        id: 3,
        value: 'hidung',
        src: '/images/student/unit2-1/5.png',
        alt: 'Hidung',
        loaded: false,
        error: false,
      },
    ],
  },
  {
    id: 3,
    question: 'Organ deria yang digunakan untuk pendengaran:',
    correctAnswer: 'telinga',
    selectedAnswer: null,
    options: [
      {
        id: 1,
        value: 'mata',
        src: '/images/student/unit2-1/1.png',
        alt: 'Mata',
        loaded: false,
        error: false,
      },
      {
        id: 2,
        value: 'telinga',
        src: '/images/student/unit2-1/4.png',
        alt: 'Telinga',
        loaded: false,
        error: false,
      },
      {
        id: 3,
        value: 'lidah',
        src: '/images/student/unit2-1/2.png',
        alt: 'Lidah',
        loaded: false,
        error: false,
      },
    ],
  },
  {
    id: 4,
    question: 'Organ deria yang digunakan untuk bau:',
    correctAnswer: 'hidung',
    selectedAnswer: null,
    options: [
      {
        id: 1,
        value: 'hidung',
        src: '/images/student/unit2-1/5.png',
        alt: 'Hidung',
        loaded: false,
        error: false,
      },
      {
        id: 2,
        value: 'telinga',
        src: '/images/student/unit2-1/4.png',
        alt: 'Telinga',
        loaded: false,
        error: false,
      },
      {
        id: 3,
        value: 'kuku',
        src: '/images/student/unit2-1/3.png',
        alt: 'Kuku',
        loaded: false,
        error: false,
      },
    ],
  },
  {
    id: 5,
    question: 'Organ deria yang digunakan untuk sentuhan:',
    correctAnswer: 'tangan',
    selectedAnswer: null,
    options: [
      {
        id: 1,
        value: 'rambut',
        src: '/images/student/unit2-1/6.png',
        alt: 'Rambut',
        loaded: false,
        error: false,
      },
      {
        id: 2,
        value: 'tangan',
        src: '/images/student/unit2-1/7.png',
        alt: 'Tangan',
        loaded: false,
        error: false,
      },
      {
        id: 3,
        value: 'kuku',
        src: '/images/student/unit2-1/3.png',
        alt: 'Kuku',
        loaded: false,
        error: false,
      },
    ],
  },
])

const quizState = ref('initial') // initial, in-progress, completed
const currentQuestionIndex = ref(0)
const showInstructions = ref(true)
const score = ref(0)

// Get the current question
const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value]
})

// Check if the current question has been answered
const isQuestionAnswered = computed(() => {
  return currentQuestion.value.selectedAnswer !== null
})

// Check if it's the first question
const isFirstQuestion = computed(() => {
  return currentQuestionIndex.value === 0
})

// Check if it's the last question
const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === questions.value.length - 1
})

// Calculate progress percentage
const progressPercentage = computed(() => {
  return ((currentQuestionIndex.value + 1) / questions.value.length) * 100
})

// Select an answer for the current question
const selectAnswer = (optionValue) => {
  if (quizState.value === 'initial' || quizState.value === 'in-progress') {
    currentQuestion.value.selectedAnswer = optionValue
    quizState.value = 'in-progress'
  }
}

// Get the label for a selected option
const getOptionLabel = (optionValue) => {
  const option = currentQuestion.value.options.find((opt) => opt.value === optionValue)
  return option ? option.alt : optionValue
}

// Move to the next question
const nextQuestion = () => {
  if (isQuestionAnswered.value && !isLastQuestion.value) {
    // Update score if answer is correct
    if (currentQuestion.value.selectedAnswer === currentQuestion.value.correctAnswer) {
      score.value++
    }
    currentQuestionIndex.value++
  }
}

// Move to the previous question
const previousQuestion = () => {
  if (!isFirstQuestion.value) {
    currentQuestionIndex.value--
  }
}

// Submit the quiz
const submitQuiz = async () => {
  // Update score for the last question if it's answered
  if (isQuestionAnswered.value) {
    if (currentQuestion.value.selectedAnswer === currentQuestion.value.correctAnswer) {
      score.value++
    }
  }

  // Ensure we have a quiz ID before submitting
  if (!quizId.value) {
    console.error('Quiz ID not available. Cannot submit quiz attempt.')
    alert('Gagal menghantar jawapan: Data kuiz tidak tersedia.')
    return
  }

  const completedAt = new Date().toISOString()

  // Calculate score and prepare answers for API
  const answersForApi = {}

  // Check each question's answer
  questions.value.forEach((question) => {
    const isCorrect = question.selectedAnswer === question.correctAnswer

    answersForApi[question.id] = {
      selectedAnswer: question.selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect: isCorrect,
      question: question.question,
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

  const quizAttemptData = {
    student_id: studentId,
    quiz_id: quizId.value,
    score: parseFloat(((score.value / questions.value.length) * 100).toFixed(2)),
    answers: answersForApi,
    started_at: startedAt.value,
    completed_at: completedAt,
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

  // Determine if all answers are correct for UI feedback
  const allCorrect = questions.value.every(
    (question) => question.selectedAnswer === question.correctAnswer,
  )

  if (allCorrect) {
    quizState.value = 'completed_correct'
  } else {
    quizState.value = 'completed_incorrect'
  }
}

// Reset the quiz
const resetQuiz = () => {
  questions.value.forEach((q) => {
    q.selectedAnswer = null
  })
  currentQuestionIndex.value = 0
  score.value = 0
  quizState.value = 'initial'
  showInstructions.value = true

  // Record new start time for the retry
  startedAt.value = new Date().toISOString()
}

// Function to handle image loading
const handleImageLoad = (option) => {
  option.loaded = true
  option.error = false
}

// Function to handle image error
const handleImageError = (option) => {
  console.error('Image failed to load:', option.src)
  option.error = true
  option.loaded = false
  // Try to reload from the original source once
  if (!option.retried) {
    option.retried = true
    const originalSrc = option.src
    // Clear the src and then reset it to trigger a reload
    setTimeout(() => {
      option.src = originalSrc
    }, 500)
  }
}

// Get option container border color based on answer state
const getOptionBorderColor = (option) => {
  const isSelected = currentQuestion.value.selectedAnswer === option.value

  if (quizState.value === 'initial' || quizState.value === 'in-progress') {
    return isSelected ? 'border-indigo-500' : 'border-gray-300'
  }

  if (quizState.value === 'completed') {
    if (option.value === currentQuestion.value.correctAnswer) {
      return 'border-green-500'
    } else if (isSelected) {
      return 'border-red-500'
    }
  }

  return 'border-gray-300'
}

// Set up keyboard navigation for accessibility
onMounted(async () => {
  console.log('Component mounted. Quiz identifier:', quizIdentifier.identifier.value)

  // Record quiz start time
  startedAt.value = new Date().toISOString()

  // Load quiz data first
  await loadQuizData()

  // Preload images
  console.log('Preloading images...')
  questions.value.forEach((question) => {
    question.options.forEach((option) => {
      const img = new Image()
      img.onload = () => handleImageLoad(option)
      img.onerror = () => handleImageError(option)
      img.src = option.src
    })
  })

  // Add keyboard event listener for accessibility
  window.addEventListener('keydown', handleKeyboardNavigation)
})

// Keyboard navigation
const handleKeyboardNavigation = (e) => {
  // Left arrow key
  if (e.key === 'ArrowLeft' && !isFirstQuestion.value) {
    previousQuestion()
  }
  // Right arrow key
  else if (e.key === 'ArrowRight' && !isLastQuestion.value && isQuestionAnswered.value) {
    nextQuestion()
  }
  // Number keys 1-3 for selecting options
  else if (
    ['1', '2', '3'].includes(e.key) &&
    (quizState.value === 'initial' || quizState.value === 'in-progress')
  ) {
    const optionIndex = parseInt(e.key) - 1
    if (optionIndex >= 0 && optionIndex < currentQuestion.value.options.length) {
      selectAnswer(currentQuestion.value.options[optionIndex].value)
    }
  }
  // Enter key for submitting on the last question
  else if (e.key === 'Enter' && isLastQuestion.value && isQuestionAnswered.value) {
    submitQuiz()
  }
}

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboardNavigation)
})

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
    alert('Gagal memuat data kuiz. Sila cuba lagi.')
  }
}
</script>

<template>
  <div
    class="flex items-center justify-center w-full p-0 m-0"
    :class="{
      'dyslexia-friendly': sharedSettings.dyslexiaMode.value,
      'high-contrast': sharedSettings.highContrast.value,
    }"
  >
    <Card class="h-auto w-full max-w-4xl shadow-2xl rounded-xl">
      <CardHeader
        class="text-left bg-indigo-600 text-white rounded-t-xl p-8"
        :class="[sharedSettings.fontSize.value]"
      >
        <CardTitle class="text-4xl font-bold flex items-center">
          <Sparkles class="w-10 h-10 mr-3 text-yellow-300" />
          {{ quizTitle }}
        </CardTitle>
        <CardDescription
          v-if="showInstructions && quizState === 'initial'"
          class="text-white mt-6 mb-2"
          :class="[sharedSettings.fontSize.value]"
        >
          <div class="flex items-start">
            <span class="leading-relaxed">{{ instructions }}</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent class="p-8">
        <!-- Progress Bar -->
        <div class="w-full h-2 bg-gray-200 rounded-full mb-8">
          <div
            class="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-in-out"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <div class="text-right mb-4 text-gray-500" :class="[sharedSettings.fontSize.value]">
          Soalan {{ currentQuestionIndex + 1 }} daripada {{ questions.length }}
        </div>

        <!-- Question -->
        <div v-if="!quizState.includes('completed')" class="mb-8">
          <h2
            class="text-2xl font-bold mb-8 text-indigo-800"
            :class="[sharedSettings.fontSize.value]"
          >
            {{ currentQuestion.question }}
          </h2>

          <!-- Options -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              v-for="option in currentQuestion.options"
              :key="option.id"
              :class="[
                'relative p-4 border-8 rounded-xl transition-all duration-200 ease-in-out',
                getOptionBorderColor(option),
                quizState === 'initial' || quizState === 'in-progress' ? 'cursor-pointer' : '',
              ]"
              @click="
                (quizState === 'initial' || quizState === 'in-progress') &&
                selectAnswer(option.value)
              "
              role="button"
              tabindex="0"
              :aria-label="`Pilih ${option.alt}`"
              @keydown.enter="
                (quizState === 'initial' || quizState === 'in-progress') &&
                selectAnswer(option.value)
              "
              @keydown.space="
                (quizState === 'initial' || quizState === 'in-progress') &&
                selectAnswer(option.value)
              "
            >
              <div
                v-if="option.error"
                class="flex items-center justify-center bg-gray-100 rounded-lg"
                style="min-height: 150px; min-width: 150px"
              >
                <img
                  src="/icons/icon-128x128.png"
                  :alt="`Fallback for ${option.alt}`"
                  class="w-1/2 h-auto object-contain p-4"
                />
              </div>
              <img
                v-else
                :src="option.src"
                :alt="option.alt"
                class="w-full h-auto object-contain rounded-lg bg-white p-4"
                style="height: 150px; width: 100%"
                @load="handleImageLoad(option)"
                @error="handleImageError(option)"
              />

              <p class="text-center mt-4 font-bold" :class="[sharedSettings.fontSize.value]">
                {{ option.alt }}
              </p>

              <!-- Show check/x mark for correct/incorrect answers when reviewing -->
              <div v-if="quizState.includes('completed')" class="absolute top-2 right-2">
                <CheckCircle
                  v-if="option.value === currentQuestion.correctAnswer"
                  class="w-8 h-8 text-green-500"
                />
                <XCircle
                  v-else-if="currentQuestion.selectedAnswer === option.value"
                  class="w-8 h-8 text-red-500"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Quiz Complete Screen -->
        <div
          v-if="quizState.includes('completed')"
          class="text-center p-8 rounded-lg border-4 my-6"
          :class="
            quizState === 'completed_correct'
              ? 'bg-green-100 border-green-500'
              : quizState === 'completed_incorrect'
                ? 'bg-yellow-100 border-yellow-500'
                : 'bg-indigo-100 border-indigo-500'
          "
        >
          <div class="flex flex-col items-center">
            <Sparkles class="w-16 h-16 text-yellow-500 mb-4 animate-pulse" />
            <h2
              class="text-3xl font-bold text-indigo-700 mb-4"
              :class="[sharedSettings.fontSize.value]"
            >
              Quiz Selesai!
            </h2>
            <p class="text-indigo-700 text-xl mb-6" :class="[sharedSettings.fontSize.value]">
              Anda telah menjawab <span class="font-bold">{{ score }}</span> daripada
              <span class="font-bold">{{ questions.length }}</span> soalan dengan betul!
            </p>
            <div class="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div
                class="h-4 rounded-full"
                :class="score === questions.length ? 'bg-green-500' : 'bg-indigo-500'"
                :style="{ width: `${(score / questions.length) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter
        class="flex flex-col sm:flex-row justify-between items-center gap-6 p-8 bg-gray-100 rounded-b-xl"
      >
        <!-- Navigation buttons -->
        <div class="flex gap-4">
          <Button
            v-if="!isFirstQuestion && !quizState.includes('completed') && quizState !== 'submitted'"
            @click="previousQuestion"
            class="bg-gray-600 hover:bg-gray-700"
          >
            <ArrowLeft class="w-5 h-5 mr-2" />
            Soalan Sebelumnya
          </Button>
          <Button
            v-if="!isLastQuestion && isQuestionAnswered"
            @click="nextQuestion"
            class="bg-indigo-600 hover:bg-indigo-700"
          >
            Soalan Seterusnya
            <ArrowRight class="w-5 h-5 ml-2" />
          </Button>
          <Button
            v-if="isLastQuestion && isQuestionAnswered && !quizState.includes('completed')"
            @click="submitQuiz"
            class="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle class="w-5 h-5 mr-2" />
            Tamat Quiz
          </Button>
        </div>

        <div class="flex gap-4">
          <Button
            v-if="quizState.includes('completed')"
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
/* Base spacing and accessibility styles */
.aspect-square {
  aspect-ratio: 1 / 1;
}

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
  outline: 3px solid #6366f1;
  outline-offset: 2px;
}

button:focus:not(:focus-visible) {
  outline: none;
}

button:focus-visible {
  outline: 3px solid #6366f1;
  outline-offset: 2px;
}

/* Add a subtle loading animation */
@keyframes imageFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
img:not([src='']):not([src='error']) {
  animation: imageFadeIn 0.5s ease-in-out;
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
.dyslexia-friendly span {
  line-height: 1.8;
}

/* High contrast text for readability */
.text-indigo-700,
.text-green-700,
.text-red-700 {
  font-weight: 600;
}

/* Accessibility - consistent spacing */
.p-6 {
  padding: 1.5rem;
}

.p-8 {
  padding: 2rem;
}

.gap-6 {
  gap: 1.5rem;
}

/* Ensure minimal touch target sizes for accessibility */
button,
[role='button'],
input[type='submit'],
input[type='reset'],
input[type='button'] {
  min-height: 36px;
  min-width: 36px;
}
</style>
