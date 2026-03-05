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
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  ArrowRightLeft,
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

// Use the quiz identifier composable for Unit 3, Activity 2, kinestetik type
const quizIdentifier = useQuizIdentifier({
  unit: 'Unit 3',
  activity: 2,
  type: 'kinestetik',
})

const quizId = ref(null)
const quizAttemptId = ref(null)
const startedAt = ref(null)

const quizTitle = ref('Unit 3: Aktiviti 2 - Pergerakanku')
const instructions = ref('Lengkapkan nama haiwan dan padankan dengan pergerakan yang betul.')

// Define the animals and their movements
const animals = ref([
  {
    id: 1,
    name: 'Ular',
    image: '/images/student/unit3-2/1.png',
    nameInput: '',
    correctMovement: 'Menyusur',
    selectedMovement: null,
    results: {
      nameCorrect: null,
      movementCorrect: null,
    },
  },
  {
    id: 2,
    name: 'Katak',
    image: '/images/student/unit3-2/2.png',
    nameInput: '',
    correctMovement: 'Melompat',
    selectedMovement: null,
    results: {
      nameCorrect: null,
      movementCorrect: null,
    },
  },
  {
    id: 3,
    name: 'Kambing',
    image: '/images/student/unit3-2/3.png',
    nameInput: '',
    correctMovement: 'Berjalan',
    selectedMovement: null,
    results: {
      nameCorrect: null,
      movementCorrect: null,
    },
  },
  {
    id: 4,
    name: 'Burung',
    image: '/images/student/unit3-2/4.png',
    nameInput: '',
    correctMovement: 'Terbang',
    selectedMovement: null,
    results: {
      nameCorrect: null,
      movementCorrect: null,
    },
  },
])

// All possible movements for selection
const movementOptions = ['Menyusur', 'Melompat', 'Berjalan', 'Terbang']

const quizState = ref('initial') // initial, submitted, completed_correct, completed_incorrect
const score = ref(0)
const showInstructions = ref(true)
const imagesLoaded = ref(0)
const totalImages = animals.value.length

// Function to handle image load
const handleImageLoad = () => {
  imagesLoaded.value++
}

// Function to handle image error
const handleImageError = (animal) => {
  console.error('Image failed to load:', animal.image)
}

// Check if all questions are answered
const allQuestionsAnswered = computed(() => {
  return animals.value.every(
    (animal) => animal.nameInput.trim() !== '' && animal.selectedMovement !== null,
  )
})

// Keep track of which movements have been selected
const selectedMovements = computed(() => {
  const selected = {}
  animals.value.forEach((animal) => {
    if (animal.selectedMovement) {
      selected[animal.selectedMovement] = (selected[animal.selectedMovement] || 0) + 1
    }
  })
  return selected
})

// Check if a movement has already been selected by another animal
const isMovementSelected = (movement, currentAnimal) => {
  if (quizState.value === 'completed') return false // Allow showing all options in completed state

  // If the current animal has this movement selected, it's available to this animal
  if (currentAnimal.selectedMovement === movement) return false

  return selectedMovements.value[movement] ? true : false
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
        description: 'Quiz tentang pergerakan haiwan',
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

  animals.value.forEach((animal) => {
    // Check name
    const nameIsCorrect = animal.nameInput.trim().toLowerCase() === animal.name.toLowerCase()
    animal.results.nameCorrect = nameIsCorrect

    // Check movement selection
    const movementIsCorrect = animal.selectedMovement === animal.correctMovement
    animal.results.movementCorrect = movementIsCorrect

    if (nameIsCorrect) totalScore++
    if (movementIsCorrect) totalScore++

    answersForApi[animal.id] = {
      nameInput: animal.nameInput.trim(),
      correctName: animal.name,
      nameIsCorrect: nameIsCorrect,
      selectedMovement: animal.selectedMovement,
      correctMovement: animal.correctMovement,
      movementIsCorrect: movementIsCorrect,
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

  const totalQuestions = animals.value.length * 2 // name + movement for each animal
  const quizAttemptData = {
    student_id: studentId,
    quiz_id: quizId.value,
    score: parseFloat(((totalScore / totalQuestions) * 100).toFixed(2)),
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
  if (totalScore === totalQuestions) {
    quizState.value = 'completed_correct'
  } else {
    quizState.value = 'completed_incorrect'
  }
}

// Reset the quiz
const resetQuiz = () => {
  animals.value.forEach((animal) => {
    animal.nameInput = ''
    animal.selectedMovement = null
    animal.results.nameCorrect = null
    animal.results.movementCorrect = null
  })
  score.value = 0
  quizState.value = 'initial'
  showInstructions.value = true
  quizAttemptId.value = null
  startedAt.value = null
}

// Get result class for name input
const getNameResultClass = (animal) => {
  if (quizState.value !== 'completed') return ''
  return animal.results.nameCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
}

// Get result class for movement option
const getMovementOptionClass = (animal, movement) => {
  if (quizState.value !== 'completed') {
    if (animal.selectedMovement === movement) {
      return 'bg-blue-100 border-blue-300'
    }
    return isMovementSelected(movement, animal) ? 'opacity-50 cursor-not-allowed' : ''
  }

  if (movement === animal.correctMovement) {
    return 'bg-green-100 border-green-500'
  }

  if (animal.selectedMovement === movement && movement !== animal.correctMovement) {
    return 'bg-red-100 border-red-500'
  }

  return 'opacity-50'
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
        class="text-left bg-indigo-600 text-white rounded-t-xl p-8"
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
        <!-- Animals Section -->
        <div class="space-y-8">
          <div
            v-for="animal in animals"
            :key="animal.id"
            class="bg-white rounded-lg border-2 border-gray-200 p-4 shadow-sm"
          >
            <div class="flex flex-col md:flex-row items-center gap-6">
              <!-- Animal Image -->
              <div
                class="w-full max-w-[200px] aspect-square mb-2 overflow-hidden rounded-lg flex items-center justify-center bg-white border border-gray-200"
              >
                <img
                  :src="animal.image"
                  :alt="'Gambar ' + animal.name"
                  class="max-w-full max-h-full object-contain"
                  @load="handleImageLoad"
                  @error="handleImageError(animal)"
                />
              </div>

              <!-- Animal Quiz Content -->
              <div class="flex-1 w-full">
                <!-- Name Input -->
                <div class="mb-5">
                  <label
                    :for="`animal-${animal.id}-name`"
                    class="block mb-2 font-medium"
                    :class="[sharedSettings?.fontSize?.value || 'text-base']"
                  >
                    Nama Haiwan:
                  </label>
                  <input
                    :id="`animal-${animal.id}-name`"
                    v-model="animal.nameInput"
                    type="text"
                    :disabled="
                      quizState === 'completed_correct' || quizState === 'completed_incorrect'
                    "
                    :class="[
                      'w-full p-3 border-2 rounded-lg',
                      sharedSettings?.fontSize?.value || 'text-base',
                      getNameResultClass(animal),
                    ]"
                    placeholder="Taip nama haiwan"
                  />

                  <!-- Name Result -->
                  <div
                    v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
                    class="mt-1 flex items-center"
                  >
                    <CheckCircle
                      v-if="animal.results.nameCorrect"
                      class="w-5 h-5 text-green-600 mr-1"
                    />
                    <XCircle v-else class="w-5 h-5 text-red-600 mr-1" />
                    <span :class="animal.results.nameCorrect ? 'text-green-600' : 'text-red-600'">
                      {{ animal.results.nameCorrect ? 'Betul' : `Jawapan: ${animal.name}` }}
                    </span>
                  </div>
                </div>

                <!-- Movement Selection -->
                <div>
                  <label
                    class="mb-2 font-medium flex items-center"
                    :class="[sharedSettings?.fontSize?.value || 'text-base']"
                  >
                    <ArrowRightLeft class="inline-block mr-2 w-5 h-5" />
                    Cara Bergerak:
                  </label>
                  <div class="flex flex-wrap gap-3">
                    <button
                      v-for="movement in movementOptions"
                      :key="movement"
                      :disabled="
                        quizState === 'completed_correct' ||
                        quizState === 'completed_incorrect' ||
                        isMovementSelected(movement, animal)
                      "
                      @click="animal.selectedMovement = movement"
                      :class="[
                        'px-4 py-2 border-2 rounded-lg transition-colors',
                        sharedSettings?.fontSize?.value || 'text-base',
                        getMovementOptionClass(animal, movement),
                      ]"
                    >
                      {{ movement }}
                    </button>
                  </div>

                  <!-- Movement Result -->
                  <div
                    v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
                    class="mt-3 flex items-center"
                  >
                    <CheckCircle
                      v-if="animal.results.movementCorrect"
                      class="w-5 h-5 text-green-600 mr-1"
                    />
                    <XCircle v-else class="w-5 h-5 text-red-600 mr-1" />
                    <span
                      :class="animal.results.movementCorrect ? 'text-green-600' : 'text-red-600'"
                    >
                      {{
                        animal.results.movementCorrect
                          ? 'Betul'
                          : `Jawapan: ${animal.correctMovement}`
                      }}
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
          class="text-center p-8 bg-indigo-100 rounded-lg border-4 border-indigo-500 my-6"
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
              class="text-3xl font-bold text-indigo-700 mb-4"
              :class="[sharedSettings?.fontSize?.value || 'text-base']"
            >
              Kuiz Selesai!
            </h2>
            <p
              class="text-indigo-700 text-xl mb-6"
              :class="[sharedSettings?.fontSize?.value || 'text-base']"
            >
              Anda telah menjawab <span class="font-bold">{{ score }}</span> daripada
              <span class="font-bold">{{ animals.length * 2 }}</span> soalan dengan betul!
            </p>

            <div class="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div
                class="h-4 rounded-full"
                :class="score === animals.length * 2 ? 'bg-green-500' : 'bg-indigo-500'"
                :style="{ width: `${(score / (animals.length * 2)) * 100}%` }"
              ></div>
            </div>

            <!-- Information about Animal Movements -->
            <div class="mt-8 w-full text-left">
              <h3
                class="text-xl font-bold text-indigo-700 mb-4 text-center"
                :class="[sharedSettings?.fontSize?.value || 'text-base']"
              >
                Cara Pergerakan Haiwan
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  v-for="animal in animals"
                  :key="`info-${animal.id}`"
                  class="bg-white rounded-lg shadow-md p-4"
                >
                  <div class="flex items-center gap-3 mb-2">
                    <div
                      class="w-16 h-16 rounded-lg overflow-hidden border flex items-center justify-center"
                    >
                      <img
                        :src="animal.image"
                        :alt="animal.name"
                        class="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <h4
                      class="text-lg font-bold text-indigo-600"
                      :class="[sharedSettings?.fontSize?.value || 'text-base']"
                    >
                      {{ animal.name }}
                    </h4>
                  </div>
                  <p :class="[sharedSettings?.fontSize?.value || 'text-base']">
                    <span class="font-medium">Pergerakan:</span> {{ animal.correctMovement }}
                  </p>
                  <p
                    class="mt-1 text-sm text-gray-600"
                    :class="[sharedSettings?.fontSize?.value || 'text-base']"
                  >
                    {{ animal.name }} bergerak dengan cara
                    {{ animal.correctMovement.toLowerCase() }}.
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
button:disabled {
  cursor: not-allowed;
}
</style>
