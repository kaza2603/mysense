<script setup>
import { ref, computed, onMounted, onBeforeUnmount, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  ArrowLeft,
  Volume2,
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

// Try to use shared accessibility settings from KuizLayout
const sharedSettings = inject('accessibilitySettings', null)

// Use the quiz identifier composable for Unit 2, Activity 2, visual type
const quizIdentifier = useQuizIdentifier({
  unit: 'Unit 2',
  activity: 2,
  type: 'visual',
})

const quizId = ref(null)
const quizAttemptId = ref(null)
const startedAt = ref(null)

const quizTitle = 'Unit 2: Aktiviti 2 - Label Organ Deria Manusia'
const instructions =
  'Isi tempat kosong dengan label organ deria yang betul (mata, telinga, lidah, hidung, kulit) untuk setiap nombor pada gambar.'

// Define the labels for the quiz
const labels = ref([
  {
    id: 1,
    number: '1',
    correctAnswer: 'mata',
    userAnswer: '',
    isCorrect: null,
  },
  {
    id: 2,
    number: '2',
    correctAnswer: 'telinga',
    userAnswer: '',
    isCorrect: null,
  },
  {
    id: 3,
    number: '3',
    correctAnswer: 'lidah',
    userAnswer: '',
    isCorrect: null,
  },
  {
    id: 4,
    number: '4',
    correctAnswer: 'hidung',
    userAnswer: '',
    isCorrect: null,
  },
  {
    id: 5,
    number: '5',
    correctAnswer: 'kulit',
    userAnswer: '',
    isCorrect: null,
  },
])

const quizState = ref('initial') // initial, submitted, completed_correct, completed_incorrect
const showInstructions = ref(true)
const score = ref(0)
const imageLoaded = ref(false)
const imageError = ref(false)

// Path to the main image with numbered labels
const mainImagePath = '/images/student/unit2-2/1.png'

// Calculate progress based on filled answers
const progressPercentage = computed(() => {
  const filledAnswers = labels.value.filter((label) => label.userAnswer.trim() !== '').length
  return (filledAnswers / labels.value.length) * 100
})

// Check if all labels have been filled
const allLabelsFilled = computed(() => {
  return labels.value.every((label) => label.userAnswer.trim() !== '')
})

// Handle label input change
const handleInputChange = (label) => {
  if (quizState.value === 'initial') {
    quizState.value = 'in-progress'
  }
}

// Focus the next input field
const focusNextInput = (currentIndex) => {
  if (currentIndex < labels.value.length - 1) {
    const nextInput = document.getElementById(`label-input-${currentIndex + 1}`)
    if (nextInput) {
      nextInput.focus()
    }
  }
}

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
  let calculatedScore = 0
  const answersForApi = {}

  labels.value.forEach((label) => {
    // Case insensitive comparison and trimming whitespace
    const isCorrect = label.userAnswer.trim().toLowerCase() === label.correctAnswer.toLowerCase()

    if (isCorrect) {
      calculatedScore++
      label.isCorrect = true
    } else {
      label.isCorrect = false
    }

    answersForApi[label.id] = {
      userAnswer: label.userAnswer.trim(),
      correctAnswer: label.correctAnswer,
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
    score: parseFloat(((calculatedScore / labels.value.length) * 100).toFixed(2)),
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
  score.value = calculatedScore

  // Determine if all answers are correct for UI feedback
  if (calculatedScore === labels.value.length) {
    quizState.value = 'completed_correct'
  } else {
    quizState.value = 'completed_incorrect'
  }
}

// Reset the quiz
const resetQuiz = () => {
  labels.value.forEach((label) => {
    label.userAnswer = ''
    label.isCorrect = null
  })
  score.value = 0
  quizState.value = 'initial'
  showInstructions.value = true

  // Reset quiz tracking
  quizAttemptId.value = null
  startedAt.value = new Date().toISOString()
}

// Function to handle image loading
const handleImageLoad = () => {
  imageLoaded.value = true
  imageError.value = false
}

// Function to handle image error
const handleImageError = () => {
  console.error('Image failed to load:', mainImagePath)
  imageError.value = true
  imageLoaded.value = false
  // Try to reload the image once
  if (!imageRetried.value) {
    imageRetried.value = true
    const originalSrc = mainImagePath
    // Clear the src and then reset it to trigger a reload
    setTimeout(() => {
      const img = document.getElementById('main-image')
      if (img) {
        img.src = originalSrc
      }
    }, 500)
  }
}

const imageRetried = ref(false)

// Get input border color based on answer state
const getInputBorderColor = (label) => {
  if (quizState.value !== 'completed_correct' && quizState.value !== 'completed_incorrect') {
    return label.userAnswer ? 'border-indigo-500' : 'border-gray-300'
  }

  return label.isCorrect ? 'border-green-500' : 'border-red-500'
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
        title: quizTitle,
        description: 'Quiz tentang label organ deria manusia',
        instructions: instructions,
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

// Set up keyboard navigation for accessibility
onMounted(async () => {
  console.log('Component mounted. Quiz identifier:', quizIdentifier.identifier.value)

  // Record when the quiz started
  startedAt.value = new Date().toISOString()

  // Load quiz data from API
  await loadQuizData()

  // Preload main image
  console.log('Preloading main image...')
  const img = new Image()
  img.onload = handleImageLoad
  img.onerror = handleImageError
  img.src = mainImagePath

  // Add keyboard event listener for accessibility
  window.addEventListener('keydown', handleKeyboardNavigation)
})

// Keyboard navigation
const handleKeyboardNavigation = (e) => {
  // Tab key will automatically move between inputs

  // Enter key to submit when all fields are filled
  if (
    e.key === 'Enter' &&
    allLabelsFilled.value &&
    quizState.value !== 'completed_correct' &&
    quizState.value !== 'completed_incorrect' &&
    quizState.value !== 'submitted'
  ) {
    submitQuiz()
  }
}

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboardNavigation)
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center p-6"
    :class="{ 'dyslexia-friendly': sharedSettings?.dyslexiaMode?.value }"
  >
    <Card class="h-auto w-full max-w-8xl shadow-2xl rounded-xl">
      <CardHeader
        class="text-left bg-indigo-600 text-white rounded-t-xl p-8"
        :class="sharedSettings?.fontSize?.value || 'text-base'"
      >
        <CardTitle class="text-4xl font-bold flex items-center">
          <Sparkles class="w-10 h-10 mr-3 text-yellow-300" />
          {{ quizTitle }}
        </CardTitle>
        <CardDescription
          v-if="showInstructions && quizState === 'initial'"
          class="text-white mt-6 mb-2"
          :class="sharedSettings?.fontSize?.value || 'text-base'"
        >
          <span class="leading-relaxed">{{ instructions }}</span>
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

        <!-- Available answers -->
        <div
          v-if="quizState !== 'completed_correct' && quizState !== 'completed_incorrect'"
          class="flex flex-wrap gap-2 justify-center mb-6"
        >
          <div
            class="text-center p-2 bg-gray-100 rounded-lg border border-gray-300"
            :class="sharedSettings?.fontSize?.value || 'text-base'"
          >
            <span class="font-bold">Pilihan jawapan:</span>
            <span class="inline-block mx-1 px-2 py-1 bg-indigo-100 rounded-md">mata</span>
            <span class="inline-block mx-1 px-2 py-1 bg-indigo-100 rounded-md">telinga</span>
            <span class="inline-block mx-1 px-2 py-1 bg-indigo-100 rounded-md">lidah</span>
            <span class="inline-block mx-1 px-2 py-1 bg-indigo-100 rounded-md">hidung</span>
            <span class="inline-block mx-1 px-2 py-1 bg-indigo-100 rounded-md">kulit</span>
          </div>
        </div>

        <!-- Main Image with Labels -->
        <div
          v-if="quizState !== 'completed_correct' && quizState !== 'completed_incorrect'"
          class="mb-8"
        >
          <div class="flex justify-center mb-8">
            <div
              v-if="imageError"
              class="flex items-center justify-center bg-gray-100 rounded-lg w-full max-w-lg h-80"
            >
              <img
                src="/icons/icon-128x128.png"
                alt="Fallback image"
                class="w-1/3 h-auto object-contain p-4"
              />
            </div>
            <div v-else class="relative bg-white rounded-lg p-4 shadow-md w-full max-w-lg">
              <img
                id="main-image"
                :src="mainImagePath"
                alt="Organ deria manusia dengan label 1 hingga 5"
                class="w-full h-auto object-contain rounded-lg"
                style="max-height: 400px"
                @load="handleImageLoad"
                @error="handleImageError"
              />
            </div>
          </div>

          <!-- Labels Input Section -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mt-8">
            <div
              v-for="(label, index) in labels"
              :key="label.id"
              class="border-2 rounded-xl p-4 bg-white shadow-sm"
              :class="[getInputBorderColor(label)]"
            >
              <div class="flex items-center mb-2">
                <div
                  class="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-2"
                >
                  {{ label.number }}
                </div>
                <label
                  :for="`label-input-${index}`"
                  class="font-bold"
                  :class="sharedSettings?.fontSize?.value || 'text-base'"
                >
                  Nombor {{ label.number }} :
                </label>
              </div>
              <Input
                :id="`label-input-${index}`"
                v-model="label.userAnswer"
                :placeholder="`Masukkan nama organ deria`"
                class="w-full"
                :class="sharedSettings?.fontSize?.value || 'text-base'"
                @input="handleInputChange(label)"
                @keyup.enter="focusNextInput(index)"
                :disabled="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
                :aria-label="`Organ deria untuk nombor ${label.number}`"
              />

              <!-- Show correct/incorrect for completed quiz -->
              <div
                v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
                class="mt-2 flex items-center"
              >
                <div v-if="label.isCorrect" class="flex items-center text-green-600">
                  <CheckCircle class="w-5 h-5 mr-1" />
                  <span :class="sharedSettings?.fontSize?.value || 'text-base'">Betul!</span>
                </div>
                <div v-else class="flex items-center text-red-600">
                  <XCircle class="w-5 h-5 mr-1" />
                  <span :class="sharedSettings?.fontSize?.value || 'text-base'"
                    >Jawapan betul: {{ label.correctAnswer }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quiz Complete Screen -->
        <div
          v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
          class="text-center p-8 bg-indigo-100 rounded-lg border-4 border-indigo-500 my-6"
        >
          <!-- Success Message -->
          <div v-if="quizState === 'completed_correct'">
            <div class="flex flex-col items-center">
              <CheckCircle class="w-24 h-24 text-green-500 mb-4 animate-bounce" />
              <h2
                class="text-4xl font-bold text-green-600 mb-4"
                :class="sharedSettings?.fontSize?.value || 'text-base'"
              >
                🎉 TAHNIAH! 🎉
              </h2>
              <p
                class="text-green-700 text-2xl mb-6 font-bold"
                :class="sharedSettings?.fontSize?.value || 'text-base'"
              >
                ANDA BERJAYA!
              </p>
              <p
                class="text-green-600 text-lg mb-6"
                :class="sharedSettings?.fontSize?.value || 'text-base'"
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
                :class="sharedSettings?.fontSize?.value || 'text-base'"
              >
                CUBA LAGI!
              </h2>
              <p
                class="text-orange-700 text-2xl mb-6 font-bold"
                :class="sharedSettings?.fontSize?.value || 'text-base'"
              >
                Jangan putus asa!
              </p>
              <p
                class="text-orange-600 text-lg mb-6"
                :class="sharedSettings?.fontSize?.value || 'text-base'"
              >
                Anda hampir berjaya. Teruskan usaha!
              </p>
            </div>
          </div>

          <div class="flex flex-col items-center">
            <Sparkles class="w-16 h-16 text-yellow-500 mb-4 animate-pulse" />
            <h2
              class="text-3xl font-bold text-indigo-700 mb-4"
              :class="sharedSettings?.fontSize?.value || 'text-base'"
            >
              Quiz Selesai!
            </h2>
            <p
              class="text-indigo-700 text-xl mb-6"
              :class="sharedSettings?.fontSize?.value || 'text-base'"
            >
              Anda telah menjawab <span class="font-bold">{{ score }}</span> daripada
              <span class="font-bold">{{ labels.length }}</span> soalan dengan betul!
            </p>
            <div class="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div
                class="h-4 rounded-full"
                :class="score === labels.length ? 'bg-green-500' : 'bg-indigo-500'"
                :style="{ width: `${(score / labels.length) * 100}%` }"
              ></div>
            </div>
            <!-- Display all correct answers -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4">
              <div
                v-for="label in labels"
                :key="label.id"
                class="flex items-center border-2 rounded-lg p-4 bg-white"
                :class="label.isCorrect ? 'border-green-500' : 'border-red-500'"
              >
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center font-bold mr-2 text-white"
                  :class="label.isCorrect ? 'bg-green-500' : 'bg-red-500'"
                >
                  {{ label.number }}
                </div>
                <div>
                  <p class="font-semibold" :class="sharedSettings?.fontSize?.value || 'text-base'">
                    {{ label.correctAnswer }}
                  </p>
                  <p v-if="!label.isCorrect" class="text-gray-500 text-sm">
                    Jawapan anda: {{ label.userAnswer || '(kosong)' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Additional information about sensory organs -->
            <div class="mt-8 w-full">
              <h3
                class="text-xl font-bold text-indigo-700 mb-4"
                :class="sharedSettings?.fontSize?.value || 'text-base'"
              >
                Fungsi Organ Deria
              </h3>
              <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="bg-indigo-100">
                      <th
                        class="border border-indigo-200 p-2 text-left"
                        :class="sharedSettings?.fontSize?.value || 'text-base'"
                      >
                        Organ Deria
                      </th>
                      <th
                        class="border border-indigo-200 p-2 text-left"
                        :class="sharedSettings?.fontSize?.value || 'text-base'"
                      >
                        Fungsi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        class="border border-indigo-200 p-2 font-semibold"
                        :class="sharedSettings?.fontSize?.value || 'text-base'"
                      >
                        Mata
                      </td>
                      <td
                        class="border border-indigo-200 p-2"
                        :class="sharedSettings?.fontSize?.value || 'text-base'"
                      >
                        Untuk melihat
                      </td>
                    </tr>
                    <tr>
                      <td
                        class="border border-indigo-200 p-2 font-semibold"
                        :class="sharedSettings?.fontSize?.value || 'text-base'"
                      >
                        Telinga
                      </td>
                      <td
                        class="border border-indigo-200 p-2"
                        :class="sharedSettings?.fontSize?.value || 'text-base'"
                      >
                        Untuk mendengar
                      </td>
                    </tr>
                    <tr>
                      <td
                        class="border border-indigo-200 p-2 font-semibold"
                        :class="sharedSettings?.fontSize?.value || 'text-base'"
                      >
                        Lidah
                      </td>
                      <td
                        class="border border-indigo-200 p-2"
                        :class="sharedSettings?.fontSize?.value || 'text-base'"
                      >
                        Untuk merasa
                      </td>
                    </tr>
                    <tr>
                      <td
                        class="border border-indigo-200 p-2 font-semibold"
                        :class="sharedSettings?.fontSize?.value || 'text-base'"
                      >
                        Hidung
                      </td>
                      <td
                        class="border border-indigo-200 p-2"
                        :class="sharedSettings?.fontSize?.value || 'text-base'"
                      >
                        Untuk menghidu
                      </td>
                    </tr>
                    <tr>
                      <td
                        class="border border-indigo-200 p-2 font-semibold"
                        :class="sharedSettings?.fontSize?.value || 'text-base'"
                      >
                        Kulit
                      </td>
                      <td
                        class="border border-indigo-200 p-2"
                        :class="sharedSettings?.fontSize?.value || 'text-base'"
                      >
                        Untuk menyentuh/merasa
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter
        class="flex flex-col sm:flex-row justify-between items-center gap-6 p-8 bg-gray-100 rounded-b-xl"
      >
        <!-- Submit button -->
        <div class="flex gap-4">
          <Button
            v-if="
              allLabelsFilled &&
              quizState !== 'completed_correct' &&
              quizState !== 'completed_incorrect' &&
              quizState !== 'submitted'
            "
            @click="submitQuiz"
            class="bg-green-600 hover:bg-green-700"
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
