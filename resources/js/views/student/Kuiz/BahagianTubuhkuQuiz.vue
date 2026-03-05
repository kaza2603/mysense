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
import { CheckCircle, XCircle, RotateCcw, Sparkles } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useQuizAttemptsStore } from '@/stores/quizAttempts'
import { useQuizzesStore } from '@/stores/quizzes'
import { useQuizIdentifier } from '@/composables/useQuizIdentifier'

const router = useRouter()
const authStore = useAuthStore()
const quizAttemptsStore = useQuizAttemptsStore()
const quizzesStore = useQuizzesStore()

// Use the quiz identifier composable with manual overrides
const quizIdentifier = useQuizIdentifier({
  unit: 'Unit 4',
  activity: 2,
  type: 'visual',
})

const quizId = ref(null)
const quizAttemptId = ref(null)
const startedAt = ref(null)
const quizTitle = ref('Unit 4: Aktiviti 2 - Bahagian Tubuhku')
const instructions = ref(
  'Isikan bahagian-bahagian tumbuhan berdasarkan nombor yang ditunjukkan dalam gambar.',
)

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
        description: 'Quiz tentang bahagian-bahagian tumbuhan',
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

// Try to use shared accessibility settings from KuizLayout
const sharedSettings = inject('accessibilitySettings', null)

// Essential accessibility settings for learning disabilities (WCAG compliance)
const fontSizeClass = ref('text-base')
const dyslexiaMode = ref(false)
const highContrast = ref(false)

// Apply shared settings if available
if (sharedSettings) {
  dyslexiaMode.value = sharedSettings.dyslexiaMode.value
  fontSizeClass.value = sharedSettings.fontSize.value
  highContrast.value = sharedSettings.highContrast?.value || false

  // Set up watchers to respond to changes
  watch(
    () => sharedSettings.dyslexiaMode.value,
    (newValue) => {
      dyslexiaMode.value = newValue
    },
  )

  watch(
    () => sharedSettings.fontSize.value,
    (newValue) => {
      fontSizeClass.value = newValue
    },
  )

  if (sharedSettings.highContrast) {
    watch(
      () => sharedSettings.highContrast.value,
      (newValue) => {
        highContrast.value = newValue
      },
    )
  }
}
const plantParts = ref([
  {
    id: 1,
    number: '1',
    label: 'Bunga',
    answer: '',
    isCorrect: null,
    description: 'Bahagian tumbuhan yang berfungsi untuk pembiakan. Ia akan berubah menjadi buah.',
  },
  {
    id: 2,
    number: '2',
    label: 'Buah',
    answer: '',
    isCorrect: null,
    description: 'Bahagian tumbuhan yang mengandungi biji benih. Buah boleh dimakan.',
  },
  {
    id: 3,
    number: '3',
    label: 'Biji Benih',
    answer: '',
    isCorrect: null,
    description: 'Bahagian tumbuhan yang akan tumbuh menjadi pokok baharu.',
  },
  {
    id: 4,
    number: '4',
    label: 'Daun',
    answer: '',
    isCorrect: null,
    description:
      'Bahagian tumbuhan yang berfungsi untuk membuat makanan melalui proses fotosintesis.',
  },
  {
    id: 5,
    number: '5',
    label: 'Batang',
    answer: '',
    isCorrect: null,
    description: 'Bahagian tumbuhan yang menyokong struktur pokok dan mengalirkan air dan mineral.',
  },
  {
    id: 6,
    number: '6',
    label: 'Akar',
    answer: '',
    isCorrect: null,
    description: 'Bahagian tumbuhan yang menyerap air dan mineral dari dalam tanah.',
  },
])

const quizState = ref('initial') // initial, in-progress, completed
const score = ref(0)
const showInstructions = ref(true)
const imageLoaded = ref(false)
const activePartIndex = ref(0) // For highlighting the current question

// Plant image path
const plantImagePath = '/images/student/unit4-2/1.png'

// Function to handle answer change
const handleAnswerChange = (part, index) => {
  // Only update the active index but don't automatically move focus
  activePartIndex.value = index

  // If this was the first input, change state to in-progress
  if (quizState.value === 'initial') {
    quizState.value = 'in-progress'
    startedAt.value = new Date().toISOString() // Added: Record start time
    // Optionally, create an 'in_progress' record here if desired
    // createInitialQuizAttempt();
  }
}

// Function to handle key presses on input fields
const handleKeyPress = (event, index) => {
  // If Enter key is pressed, move to the next input
  if (event.key === 'Enter') {
    if (index < plantParts.value.length - 1) {
      activePartIndex.value = index + 1
      // Focus on the next input (with a short delay to ensure DOM is updated)
      setTimeout(() => {
        const nextInput = document.getElementById(`part-answer-${index + 1}`)
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
  const allAnswered = plantParts.value.every((part) => part.answer.trim() !== '')
  // console.log('allQuestionsAnswered computed:', allAnswered); // Log when computed property updates
  return allAnswered
})

watch(quizState, (newState) => {
  console.log('quizState changed to:', newState)
  console.log('allQuestionsAnswered at this point:', allQuestionsAnswered.value)
})

watch(
  plantParts,
  () => {
    // This will trigger when any answer changes, thus re-evaluating allQuestionsAnswered
    console.log('plantParts changed, allQuestionsAnswered is now:', allQuestionsAnswered.value)
  },
  { deep: true },
)

// Submit the quiz
const submitQuiz = async () => {
  console.log('submitQuiz function called')

  // Ensure we have a quiz ID before submitting
  if (!quizId.value) {
    console.error('Quiz ID not available. Cannot submit quiz attempt.')
    alert('Gagal menghantar jawapan: Data kuiz tidak tersedia.')
    return
  }

  score.value = 0
  const completedAt = new Date().toISOString()

  const answersForApi = {}
  plantParts.value.forEach((part) => {
    // Case-insensitive comparison and handle some common typos/variations
    const normalizedAnswer = part.answer.trim().toLowerCase()
    const normalizedLabel = part.label.toLowerCase()

    // Check if the answer matches the label (allowing for some variations)
    part.isCorrect =
      normalizedAnswer === normalizedLabel ||
      // Handle root/roots, leaf/leaves variations
      (normalizedLabel === 'akar' && normalizedAnswer === 'akar-akar') ||
      (normalizedLabel === 'daun' && normalizedAnswer === 'daun-daun') ||
      // Handle shorter versions without spaces
      (normalizedLabel === 'biji benih' &&
        (normalizedAnswer === 'biji' || normalizedAnswer === 'bijibenih'))

    if (part.isCorrect) {
      score.value++
    }
    answersForApi[part.number] = part.answer
  })

  quizState.value = 'completed'

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
    quiz_id: quizId.value, // Use the dynamically loaded quiz ID
    score: parseFloat(((score.value / plantParts.value.length) * 100).toFixed(2)),
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
}

// Reset the quiz
const resetQuiz = () => {
  plantParts.value.forEach((part) => {
    part.answer = ''
    part.isCorrect = null
  })

  score.value = 0
  quizState.value = 'initial'
  showInstructions.value = true
  activePartIndex.value = 0
}

// Function to handle image load
const handleImageLoad = () => {
  imageLoaded.value = true
}

// Function to handle image error
const handleImageError = () => {
  console.error('Image failed to load:', plantImagePath)
}

// Get input class based on answer validation
const getInputClass = (part) => {
  if (quizState.value !== 'completed') {
    return ''
  }

  return part.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
}

// Initialize when component mounts
onMounted(async () => {
  console.log('Component mounted. Quiz identifier:', quizIdentifier.identifier.value)
  console.log('Quiz identifier debug:', quizIdentifier.debug)

  // Load quiz data from the database
  await loadQuizData()

  console.log('Component mounted. Initial quizState:', quizState.value)
  console.log('Component mounted. Initial allQuestionsAnswered:', allQuestionsAnswered.value)
  console.log('Loaded quiz ID:', quizId.value)
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center p-6"
    :class="{ 'dyslexia-friendly': dyslexiaMode, 'high-contrast': highContrast }"
  >
    <Card class="h-auto w-full max-w-5xl shadow-2xl rounded-xl">
      <CardHeader
        class="text-left bg-green-600 text-white rounded-t-xl p-8"
        :class="[fontSizeClass]"
      >
        <CardTitle class="text-4xl font-bold flex items-center" role="heading" aria-level="1">
          <Sparkles class="w-10 h-10 mr-3 text-yellow-300" aria-hidden="true" />
          {{ quizTitle }}
        </CardTitle>
        <CardDescription
          v-if="showInstructions"
          class="text-white mt-6 mb-2"
          :class="[fontSizeClass]"
          role="region"
          aria-label="Arahan kuiz"
        >
          <span class="leading-relaxed">{{ instructions }}</span>
        </CardDescription>
      </CardHeader>

      <CardContent class="p-8">
        <div class="flex flex-col lg:flex-row gap-8 items-center">
          <!-- Labeled Plant Image (Left Side) -->
          <div class="w-full lg:w-1/2 flex flex-col items-center">
            <div class="relative max-w-md mx-auto">
              <img
                :src="plantImagePath"
                alt="Diagram tumbuhan dengan bahagian berlabel nombor 1 hingga 6: Bunga, Buah, Biji Benih, Daun, Batang, dan Akar"
                class="w-full h-auto object-contain rounded-lg border-2 border-green-200"
                @load="handleImageLoad"
                @error="handleImageError"
              />
              <!-- Loading indicator if image is not loaded -->
              <div
                v-if="!imageLoaded"
                class="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg"
              >
                <div class="text-green-600 animate-pulse">Memuat gambar...</div>
              </div>
            </div>
            <p class="mt-4 text-center text-sm text-gray-600" :class="[fontSizeClass]">
              Gambar tumbuhan dengan bahagian-bahagian berlabel dari 1 hingga 6.
            </p>
          </div>

          <!-- Fill in the Blanks Questions (Right Side) -->
          <div
            class="w-full lg:w-1/2 space-y-6"
            role="form"
            aria-label="Soalan kuiz bahagian tumbuhan"
          >
            <div
              v-for="(part, index) in plantParts"
              :key="part.id"
              class="p-4 rounded-lg border-2 transition-all duration-300"
              :class="[
                activePartIndex === index ? 'border-blue-400 bg-blue-50' : 'border-gray-200',
                quizState === 'completed' && part.isCorrect ? 'border-green-400 bg-green-50' : '',
                quizState === 'completed' && !part.isCorrect ? 'border-red-400 bg-red-50' : '',
              ]"
              role="group"
              :aria-label="`Soalan ${index + 1} dari ${plantParts.length}`"
            >
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
                  :class="
                    activePartIndex === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  "
                >
                  {{ part.number }}
                </div>
                <label :for="`part-answer-${index}`" class="font-medium" :class="[fontSizeClass]">
                  Bahagian bernombor {{ part.number }} adalah:
                </label>
              </div>
              <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                  :id="`part-answer-${index}`"
                  v-model="part.answer"
                  :disabled="quizState === 'completed'"
                  @input="handleAnswerChange(part, index)"
                  @keydown="handleKeyPress($event, index)"
                  @focus="activePartIndex = index"
                  type="text"
                  class="w-full p-3 border-2 rounded-lg"
                  :class="[fontSizeClass, getInputClass(part)]"
                  placeholder="Masukkan jawapan anda"
                  :aria-describedby="`part-help-${index}`"
                  :aria-invalid="quizState === 'completed' && !part.isCorrect ? 'true' : 'false'"
                  autocomplete="off"
                />
                <div
                  :id="`part-help-${index}`"
                  class="sr-only"
                  :aria-live="quizState === 'completed' ? 'polite' : 'off'"
                >
                  {{
                    quizState === 'completed'
                      ? part.isCorrect
                        ? 'Jawapan betul'
                        : `Jawapan salah. Jawapan yang betul ialah ${part.label}`
                      : `Isi nama bahagian tumbuhan untuk nombor ${part.number}`
                  }}
                </div>
                <!-- Show correct/incorrect icons when completed -->
                <div
                  v-if="quizState === 'completed'"
                  class="flex items-center"
                  role="status"
                  :aria-label="part.isCorrect ? 'Jawapan betul' : 'Jawapan salah'"
                >
                  <CheckCircle
                    v-if="part.isCorrect"
                    class="w-6 h-6 text-green-600 mr-1"
                    aria-hidden="true"
                  />
                  <XCircle v-else class="w-6 h-6 text-red-600 mr-1" aria-hidden="true" />
                  <span v-if="!part.isCorrect" class="text-red-600" :class="[fontSizeClass]">
                    Jawapan: {{ part.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quiz Complete Screen -->
        <div
          v-if="quizState === 'completed'"
          class="text-center p-8 bg-green-100 rounded-lg border-4 border-green-500 my-6"
          role="region"
          aria-label="Keputusan kuiz"
          aria-live="polite"
        >
          <div class="flex flex-col items-center">
            <Sparkles class="w-16 h-16 text-yellow-500 mb-4 animate-pulse" aria-hidden="true" />
            <h2
              class="text-3xl font-bold text-green-700 mb-4"
              :class="[fontSizeClass]"
              role="heading"
              aria-level="2"
            >
              Kuiz Selesai!
            </h2>
            <p class="text-green-700 text-xl mb-6" :class="[fontSizeClass]" role="status">
              Anda telah menjawab <span class="font-bold">{{ score }}</span> daripada
              <span class="font-bold">{{ plantParts.length }}</span> soalan dengan betul!
            </p>

            <div class="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div
                class="h-4 rounded-full"
                :class="score === plantParts.length ? 'bg-green-500' : 'bg-indigo-500'"
                :style="{ width: `${(score / plantParts.length) * 100}%` }"
              ></div>
            </div>

            <!-- Information about Plant Parts -->
            <div class="mt-8 w-full">
              <h3
                class="text-xl font-bold text-green-700 mb-4 text-center"
                :class="[fontSizeClass]"
              >
                Bahagian-bahagian Tumbuhan dan Fungsinya
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="part in plantParts"
                  :key="`info-${part.id}`"
                  class="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500"
                >
                  <h4 class="text-lg font-bold text-green-600 mb-2" :class="[fontSizeClass]">
                    {{ part.number }}. {{ part.label }}
                  </h4>
                  <p class="text-gray-700" :class="[fontSizeClass]">
                    {{ part.description }}
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
            v-if="allQuestionsAnswered && quizState !== 'completed'"
            @click="submitQuiz"
            class="bg-green-600 hover:bg-green-700"
            :aria-describedby="'submit-help'"
          >
            <CheckCircle class="w-5 h-5 mr-2" aria-hidden="true" />
            Hantar Jawapan
          </Button>
          <div id="submit-help" class="sr-only">Tekan untuk menghantar semua jawapan kuiz</div>
        </div>

        <div class="flex gap-4">
          <Button
            v-if="quizState === 'completed'"
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

/* WCAG-compliant focus styles for accessibility */
button:focus,
button:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
}

button:focus:not(:focus-visible) {
  outline: none;
}

/* Enhanced form input focus with high contrast */
input:focus,
input:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Dyslexia-friendly font settings */
.dyslexia-friendly {
  font-family: 'Comic Sans MS', 'Comic Sans', cursive;
  letter-spacing: 0.05em;
  word-spacing: 0.1em;
  line-height: 1.8;
}

.dyslexia-friendly p,
.dyslexia-friendly h1,
.dyslexia-friendly h2,
.dyslexia-friendly h3,
.dyslexia-friendly span,
.dyslexia-friendly input,
.dyslexia-friendly label {
  line-height: 1.8;
}

/* High contrast mode with improved color ratios */
.high-contrast {
  filter: contrast(1.5) brightness(1.1);
}

.high-contrast img {
  filter: contrast(1.3) brightness(1.2);
}

.high-contrast button,
.high-contrast input {
  border-width: 3px;
  font-weight: 600;
}

.high-contrast .border-gray-200 {
  border-color: #4b5563 !important;
}

.high-contrast .text-gray-600 {
  color: #111827 !important;
}

/* Better color contrast for disabled states */
input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Improved button hover states for better UX */
button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Clear focus indicators for card elements */
[role='group']:focus-within {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
</style>
