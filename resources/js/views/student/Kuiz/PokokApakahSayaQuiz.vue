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
import { CheckCircle, XCircle, RotateCcw, Sparkles, Check } from 'lucide-vue-next'
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

// Use the quiz identifier composable for Unit 4, Activity 1, visual type
const quizIdentifier = useQuizIdentifier({
  unit: 'Unit 4',
  activity: 1,
  type: 'visual',
})

const quizId = ref(null)
const quizAttemptId = ref(null)
const startedAt = ref(null)

const quizTitle = ref('Unit 4: Aktiviti 1 - Pokok Apakah Saya?')
const instructions = ref('Tandakan nama pokok yang betul berdasarkan gambar yang ditunjukkan.')

// Define the plants with their correct names and options
const plants = ref([
  {
    id: 1,
    correctName: 'Pokok Nenas',
    image: '/images/student/unit4-1/1.png',
    options: [
      { id: 'a', text: 'Pokok Nenas', isCorrect: true },
      { id: 'b', text: 'Pokok Pisang', isCorrect: false },
      { id: 'c', text: 'Pokok Anggur', isCorrect: false },
      { id: 'd', text: 'Pokok Kelapa', isCorrect: false },
    ],
    selectedOption: null,
    isCorrect: null,
  },
  {
    id: 2,
    correctName: 'Pokok Mangga',
    image: '/images/student/unit4-1/2.png',
    options: [
      { id: 'a', text: 'Pokok Rambutan', isCorrect: false },
      { id: 'b', text: 'Pokok Mangga', isCorrect: true },
      { id: 'c', text: 'Pokok Durian', isCorrect: false },
      { id: 'd', text: 'Pokok Ciku', isCorrect: false },
    ],
    selectedOption: null,
    isCorrect: null,
  },
  {
    id: 3,
    correctName: 'Pokok Tembikai',
    image: '/images/student/unit4-1/3.png',
    options: [
      { id: 'a', text: 'Pokok Peria', isCorrect: false },
      { id: 'b', text: 'Pokok Labu', isCorrect: false },
      { id: 'c', text: 'Pokok Tembikai', isCorrect: true },
      { id: 'd', text: 'Pokok Timun', isCorrect: false },
    ],
    selectedOption: null,
    isCorrect: null,
  },
  {
    id: 4,
    correctName: 'Pokok Kaktus',
    image: '/images/student/unit4-1/4.png',
    options: [
      { id: 'a', text: 'Pokok Lidah Buaya', isCorrect: false },
      { id: 'b', text: 'Pokok Ros', isCorrect: false },
      { id: 'c', text: 'Pokok Pakis', isCorrect: false },
      { id: 'd', text: 'Pokok Kaktus', isCorrect: true },
    ],
    selectedOption: null,
    isCorrect: null,
  },
])

const quizState = ref('initial') // initial, submitted, completed_correct, completed_incorrect
const score = ref(0)
const showInstructions = ref(true)
const imagesLoaded = ref(0)
const totalImages = plants.value.length

// Function to handle image load
const handleImageLoad = () => {
  imagesLoaded.value++
}

// Function to handle image error
const handleImageError = (plant) => {
  console.error('Image failed to load:', plant.image)
}

// Select an option for a plant
const selectOption = (plant, optionId) => {
  plant.selectedOption = optionId

  // If this was the first selection, change state to in-progress
  if (quizState.value === 'initial') {
    quizState.value = 'in-progress'
  }
}

// Check if all plants have options selected
const allQuestionsAnswered = computed(() => {
  return plants.value.every((plant) => plant.selectedOption !== null)
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

  plants.value.forEach((plant) => {
    const selectedOption = plant.options.find((opt) => opt.id === plant.selectedOption)
    plant.isCorrect = selectedOption?.isCorrect || false

    if (plant.isCorrect) {
      totalScore++
    }

    answersForApi[plant.id] = {
      selectedOption: plant.selectedOption,
      selectedText: selectedOption?.text || '',
      correctName: plant.correctName,
      isCorrect: plant.isCorrect,
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
    score: parseFloat(((totalScore / plants.value.length) * 100).toFixed(2)),
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
  if (totalScore === plants.value.length) {
    quizState.value = 'completed_correct'
  } else {
    quizState.value = 'completed_incorrect'
  }
}

// Reset the quiz
const resetQuiz = () => {
  plants.value.forEach((plant) => {
    plant.selectedOption = null
    plant.isCorrect = null
  })
  score.value = 0
  quizState.value = 'initial'
  showInstructions.value = true
  quizAttemptId.value = null
  startedAt.value = new Date().toISOString()
}

// Get class for option buttons
const getOptionClass = (plant, option) => {
  if (quizState.value !== 'completed') {
    return plant.selectedOption === option.id ? 'bg-blue-100 border-blue-400' : ''
  }

  if (option.isCorrect) {
    return 'bg-green-100 border-green-500'
  }

  if (plant.selectedOption === option.id && !option.isCorrect) {
    return 'bg-red-100 border-red-500'
  }

  return ''
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
        description: 'Quiz tentang mengenal pasti jenis pokok',
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
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center p-6"
    :class="{ 'dyslexia-friendly': sharedSettings?.dyslexiaMode?.value }"
  >
    <Card class="h-auto w-full max-w-5xl shadow-2xl rounded-xl">
      <CardHeader
        class="text-left bg-green-600 text-white rounded-t-xl p-8"
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
        <!-- Plants Section -->
        <div class="space-y-10">
          <div
            v-for="plant in plants"
            :key="plant.id"
            class="bg-white rounded-lg border-2 border-gray-200 p-6 shadow-sm"
          >
            <div class="flex flex-col items-center gap-6">
              <!-- Plant Image -->
              <div
                class="w-full max-w-[300px] aspect-square mb-2 overflow-hidden rounded-lg flex items-center justify-center bg-white border border-gray-200"
              >
                <img
                  :src="plant.image"
                  :alt="'Gambar ' + plant.correctName"
                  class="max-w-full max-h-full object-contain"
                  @load="handleImageLoad"
                  @error="handleImageError(plant)"
                />
              </div>

              <!-- Plant Name Options -->
              <div class="w-full">
                <h3
                  class="text-xl font-bold mb-4 text-center"
                  :class="[sharedSettings?.fontSize?.value || 'text-base']"
                >
                  Pokok Apakah Ini?
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  <button
                    v-for="option in plant.options"
                    :key="option.id"
                    :disabled="
                      quizState === 'completed_correct' || quizState === 'completed_incorrect'
                    "
                    @click="selectOption(plant, option.id)"
                    :class="[
                      'p-3 border-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors text-left',
                      sharedSettings?.fontSize?.value || 'text-base',
                      getOptionClass(plant, option),
                    ]"
                  >
                    <div
                      class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                      :class="
                        plant.selectedOption === option.id
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-400'
                      "
                    >
                      <Check v-if="plant.selectedOption === option.id" class="w-4 h-4 text-white" />
                    </div>
                    {{ option.text }}
                  </button>
                </div>

                <!-- Result Feedback -->
                <div
                  v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
                  class="mt-4 flex items-center justify-center"
                >
                  <div v-if="plant.isCorrect" class="flex items-center text-green-600">
                    <CheckCircle class="w-6 h-6 mr-2" />
                    <span :class="[sharedSettings?.fontSize?.value || 'text-base', 'font-medium']"
                      >Betul! Jawapan anda tepat.</span
                    >
                  </div>
                  <div v-else class="flex items-center text-red-600">
                    <XCircle class="w-6 h-6 mr-2" />
                    <span :class="[sharedSettings?.fontSize?.value || 'text-base', 'font-medium']">
                      Tidak tepat. Jawapan yang betul ialah <strong>{{ plant.correctName }}</strong
                      >.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Quiz Complete Screen -->
        <div
          v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
          class="text-center p-8 bg-green-100 rounded-lg border-4 border-green-500 my-6"
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
              class="text-3xl font-bold text-green-700 mb-4"
              :class="[sharedSettings?.fontSize?.value || 'text-base']"
            >
              Kuiz Selesai!
            </h2>
            <p
              class="text-green-700 text-xl mb-6"
              :class="[sharedSettings?.fontSize?.value || 'text-base']"
            >
              Anda telah menjawab <span class="font-bold">{{ score }}</span> daripada
              <span class="font-bold">{{ plants.length }}</span> soalan dengan betul!
            </p>

            <div class="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div
                class="h-4 rounded-full"
                :class="score === plants.length ? 'bg-green-500' : 'bg-indigo-500'"
                :style="{ width: `${(score / plants.length) * 100}%` }"
              ></div>
            </div>

            <!-- Information about Plants -->
            <div class="mt-8 w-full text-left">
              <h3
                class="text-xl font-bold text-green-700 mb-4 text-center"
                :class="[sharedSettings?.fontSize?.value || 'text-base']"
              >
                Mengenali Jenis Pokok
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  v-for="plant in plants"
                  :key="`info-${plant.id}`"
                  class="bg-white rounded-lg shadow-md p-4"
                >
                  <div class="flex items-center gap-3 mb-2">
                    <div
                      class="w-16 h-16 rounded-lg overflow-hidden border flex items-center justify-center"
                    >
                      <img
                        :src="plant.image"
                        :alt="plant.correctName"
                        class="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <h4
                      class="text-lg font-bold text-green-600"
                      :class="[sharedSettings?.fontSize?.value || 'text-base']"
                    >
                      {{ plant.correctName }}
                    </h4>
                  </div>
                  <p
                    class="mt-1 text-sm text-gray-600"
                    :class="[sharedSettings?.fontSize?.value || 'text-base']"
                  >
                    {{ plant.correctName }} adalah salah satu jenis pokok yang terdapat di Malaysia.
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

/* Disabled button styling */
button:disabled:not([class*='bg-']) {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
