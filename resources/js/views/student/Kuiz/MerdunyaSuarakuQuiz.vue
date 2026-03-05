// filepath:
c:\Users\User\Desktop\istimewa-main\client\src\views\student\Kuiz\MerdonyaSuarakuQuiz.vue
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
import { CheckCircle, XCircle, RotateCcw, Sparkles, ArrowLeft } from 'lucide-vue-next'
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
  unit: 'Unit 3',
  activity: 1,
  type: 'auditori',
})

const quizId = ref(null)
const quizAttemptId = ref(null)
const startedAt = ref(null)
const quizTitle = ref('Unit 3: Aktiviti 1 - Merdunya Suaraku')
const instructions = ref(
  'Lengkapkan nama haiwan dan pilih bunyi yang dikeluarkan oleh setiap haiwan.',
)

// Load quiz data from API
const loadQuizData = async () => {
  try {
    console.log('Loading quiz data for:', quizIdentifier.identifier.value)

    const quiz = await quizzesStore.fetchQuizByIdentifier(
      quizIdentifier.unit.value,
      quizIdentifier.activity.value,
      quizIdentifier.type.value,
    )

    if (quiz) {
      quizId.value = quiz.id
      if (quiz.title) quizTitle.value = quiz.title
      if (quiz.instructions) instructions.value = quiz.instructions
      console.log('Quiz data loaded successfully:', quiz)
    }
  } catch (error) {
    console.error('Failed to load quiz data:', error)
    // Continue with default data if API fails
  }
}

// Try to use shared accessibility settings from KuizLayout
const sharedSettings = inject('accessibilitySettings', null)

// Define the animals and their sounds
const animals = ref([
  {
    id: 1,
    name: 'Burung',
    image: '/images/student/unit3-1/1.png',
    nameInput: '',
    soundOptions: [
      { id: 'a', text: 'cip-cip', isCorrect: true },
      { id: 'b', text: 'embek-embek', isCorrect: false },
      { id: 'c', text: 'kuek-kuek', isCorrect: false },
    ],
    selectedSound: null,
    results: {
      nameCorrect: null,
      soundCorrect: null,
    },
  },
  {
    id: 2,
    name: 'Kambing',
    image: '/images/student/unit3-1/2.png',
    nameInput: '',
    soundOptions: [
      { id: 'a', text: 'cip-cip', isCorrect: false },
      { id: 'b', text: 'embek-embek', isCorrect: true },
      { id: 'c', text: 'moo-moo', isCorrect: false },
    ],
    selectedSound: null,
    results: {
      nameCorrect: null,
      soundCorrect: null,
    },
  },
  {
    id: 3,
    name: 'Lembu',
    image: '/images/student/unit3-1/3.png',
    nameInput: '',
    soundOptions: [
      { id: 'a', text: 'moo-moo', isCorrect: true },
      { id: 'b', text: 'embek-embek', isCorrect: false },
      { id: 'c', text: 'guk-guk', isCorrect: false },
    ],
    selectedSound: null,
    results: {
      nameCorrect: null,
      soundCorrect: null,
    },
  },
  {
    id: 4,
    name: 'Itik',
    image: '/images/student/unit3-1/4.png',
    nameInput: '',
    soundOptions: [
      { id: 'a', text: 'cip-cip', isCorrect: false },
      { id: 'b', text: 'moo-moo', isCorrect: false },
      { id: 'c', text: 'kuek-kuek', isCorrect: true },
    ],
    selectedSound: null,
    results: {
      nameCorrect: null,
      soundCorrect: null,
    },
  },
])

const quizState = ref('initial') // initial, submitted, completed
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

// Accessibility settings with shared settings from KuizLayout

// Check if all questions are answered
const allQuestionsAnswered = computed(() => {
  return animals.value.every(
    (animal) => animal.nameInput.trim() !== '' && animal.selectedSound !== null,
  )
})

// Function to handle answer change and track quiz start
const handleAnswerChange = (animal, field, value) => {
  if (field === 'name') {
    animal.nameInput = value
  } else if (field === 'sound') {
    animal.selectedSound = value
  }

  // If this was the first input and we haven't started yet, record start time
  if (quizState.value === 'initial') {
    quizState.value = 'in-progress'
    startedAt.value = new Date().toISOString()
    console.log('Quiz started at:', startedAt.value)
  }
}

// Submit the quiz
const submitQuiz = async () => {
  console.log('submitQuiz function called')

  // Ensure we have a quiz ID before submitting
  if (!quizId.value) {
    console.warn('No quiz ID found, loading quiz data first')
    await loadQuizData()
    if (!quizId.value) {
      console.error('Could not load quiz data')
      alert('Terdapat masalah dengan kuiz. Sila cuba lagi.')
      return
    }
  }

  score.value = 0
  const completedAt = new Date().toISOString()

  const answersForApi = {}

  // Calculate score and prepare answers
  animals.value.forEach((animal) => {
    // Check name
    const nameIsCorrect = animal.nameInput.trim().toLowerCase() === animal.name.toLowerCase()
    animal.results.nameCorrect = nameIsCorrect

    // Check sound selection
    const soundOption = animal.soundOptions.find((option) => option.id === animal.selectedSound)
    animal.results.soundCorrect = soundOption?.isCorrect || false

    // Add to score
    if (nameIsCorrect) score.value++
    if (animal.results.soundCorrect) score.value++

    // Store answers for API
    answersForApi[`animal_${animal.id}_name`] = animal.nameInput.trim()
    answersForApi[`animal_${animal.id}_sound`] = animal.selectedSound
  })

  // Debug log the final score calculation
  console.log(`Score calculation completed: ${score.value}/${animals.value.length * 2}`)
  console.log(
    'Detailed results:',
    animals.value.map((animal) => ({
      name: animal.name,
      nameInput: animal.nameInput,
      nameCorrect: animal.results.nameCorrect,
      selectedSound: animal.selectedSound,
      soundCorrect: animal.results.soundCorrect,
    })),
  )

  quizState.value = 'completed'

  // Prepare data for API submission
  const studentId = authStore.currentStudent?.user_id

  if (!studentId) {
    console.error('No student ID found. AuthStore state:', authStore.currentStudent)
    alert('Sila log masuk semula.')
    return
  }

  if (!startedAt.value) {
    console.warn('No start time recorded, setting current time')
    startedAt.value = new Date().toISOString()
  }

  const totalQuestions = animals.value.length * 2 // Each animal has 2 questions: name + sound
  const scorePercentage = parseFloat(((score.value / totalQuestions) * 100).toFixed(2))

  console.log(`Score calculation: ${score.value}/${totalQuestions} = ${scorePercentage}%`)

  const quizAttemptData = {
    quiz_id: quizId.value,
    student_id: studentId,
    answers: answersForApi,
    score: scorePercentage,
    started_at: startedAt.value,
    completed_at: completedAt,
    status: 'completed', // Required by backend
    time_taken: Math.floor((new Date(completedAt) - new Date(startedAt.value)) / 1000),
  }

  try {
    console.log('Submitting quiz attempt with data:', quizAttemptData)
    const result = await quizAttemptsStore.submitAttempt(quizAttemptData)

    console.log('Quiz attempt submission result:', result)

    if (result && result.attempt) {
      quizAttemptId.value = result.attempt.id
      console.log('Quiz attempt submitted successfully with ID:', result.attempt.id)
    }

    alert('Jawapan kuiz telah berjaya dihantar!')
  } catch (error) {
    console.error('Failed to submit quiz attempt:', error)
    console.error('Error details:', error.response?.data || error.message)

    // More specific error messages
    if (error.response?.status === 400) {
      alert('Terdapat masalah dengan data kuiz. Sila cuba lagi.')
    } else if (error.response?.status === 500) {
      alert('Terdapat masalah pada pelayan. Sila cuba lagi kemudian.')
    } else {
      alert(
        'Terdapat masalah semasa menghantar jawapan. Jawapan anda telah disimpan secara tempatan.',
      )
    }
  }

  const finalMessage = `Anda telah menjawab ${score.value} daripada ${animals.value.length * 2} soalan dengan betul!`
}

// Reset the quiz
const resetQuiz = () => {
  animals.value.forEach((animal) => {
    animal.nameInput = ''
    animal.selectedSound = null
    animal.results.nameCorrect = null
    animal.results.soundCorrect = null
  })

  score.value = 0
  quizState.value = 'initial'
  showInstructions.value = true
  startedAt.value = null
  quizAttemptId.value = null
}

// Get result class for name input
const getNameResultClass = (animal) => {
  if (quizState.value !== 'completed') return ''
  return animal.results.nameCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
}

// Get result class for sound option
const getSoundOptionClass = (animal, option) => {
  if (quizState.value !== 'completed') {
    return animal.selectedSound === option.id ? 'bg-blue-100 border-blue-300' : ''
  }

  if (option.isCorrect) {
    return 'bg-green-100 border-green-500'
  }

  if (animal.selectedSound === option.id && !option.isCorrect) {
    return 'bg-red-100 border-red-500'
  }

  return ''
}

// Initialize when component mounts
onMounted(async () => {
  console.log('Component mounted. Quiz identifier:', quizIdentifier.identifier.value)

  // Load quiz data from API
  await loadQuizData()
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
                  :alt="animal.name"
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
                    @input="handleAnswerChange(animal, 'name', $event.target.value)"
                    type="text"
                    :disabled="quizState === 'completed'"
                    :class="[
                      'w-full p-3 border-2 rounded-lg',
                      sharedSettings?.fontSize?.value || 'text-base',
                      getNameResultClass(animal),
                    ]"
                    placeholder="Taip nama haiwan"
                  />

                  <!-- Name Result -->
                  <div v-if="quizState === 'completed'" class="mt-1 flex items-center">
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

                <!-- Sound Selection -->
                <div>
                  <label
                    class="block mb-2 font-medium"
                    :class="[sharedSettings?.fontSize?.value || 'text-base']"
                  >
                    Bunyi Haiwan:
                  </label>
                  <div class="flex flex-wrap gap-3">
                    <button
                      v-for="option in animal.soundOptions"
                      :key="option.id"
                      :disabled="quizState === 'completed'"
                      @click="handleAnswerChange(animal, 'sound', option.id)"
                      :class="[
                        'px-4 py-2 border-2 rounded-lg transition-colors',
                        sharedSettings?.fontSize?.value || 'text-base',
                        getSoundOptionClass(animal, option),
                      ]"
                    >
                      {{ option.text }}
                    </button>
                  </div>

                  <!-- Sound Result -->
                  <div v-if="quizState === 'completed'" class="mt-3 flex items-center">
                    <CheckCircle
                      v-if="animal.results.soundCorrect"
                      class="w-5 h-5 text-green-600 mr-1"
                    />
                    <XCircle v-else class="w-5 h-5 text-red-600 mr-1" />
                    <span :class="animal.results.soundCorrect ? 'text-green-600' : 'text-red-600'">
                      {{ animal.results.soundCorrect ? 'Betul' : 'Tidak tepat' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quiz Complete Screen -->
        <div
          v-if="quizState === 'completed'"
          class="text-center p-8 bg-indigo-100 rounded-lg border-4 border-indigo-500 my-6"
        >
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

            <!-- Information about Animal Sounds -->
            <div class="mt-8 w-full text-left">
              <h3
                class="text-xl font-bold text-indigo-700 mb-4 text-center"
                :class="[sharedSettings?.fontSize?.value || 'text-base']"
              >
                Bunyi-bunyi Haiwan
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  v-for="animal in animals"
                  :key="`info-${animal.id}`"
                  class="bg-white rounded-lg shadow-md p-4"
                >
                  <h4
                    class="text-lg font-bold text-indigo-600 mb-2"
                    :class="[sharedSettings?.fontSize?.value || 'text-base']"
                  >
                    {{ animal.name }}
                  </h4>
                  <p :class="[sharedSettings?.fontSize?.value || 'text-base']">
                    <span class="font-medium">Bunyi:</span>
                    {{ animal.soundOptions.find((opt) => opt.isCorrect)?.text || '-' }}
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
          >
            <CheckCircle class="w-5 h-5 mr-2" />
            Hantar Jawapan
          </Button>
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
/* Form input focus */
input:focus {
  outline: 3px solid #6366f1;
  outline-offset: 2px;
}

/* Animation for sparkles */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Add a fade-in effect for images */
img {
  transition: opacity 0.3s ease;
}

/* High contrast mode */
.high-contrast {
  filter: contrast(150%) brightness(110%);
}

.high-contrast img {
  filter: contrast(120%) brightness(120%);
}

.high-contrast button,
.high-contrast input {
  border-width: 3px !important;
  font-weight: 600;
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
.dyslexia-friendly input {
  line-height: 1.8;
}
</style>
