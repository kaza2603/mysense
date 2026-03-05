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
import { CheckCircle, XCircle, RotateCcw, Sparkles, ArrowLeft, ArrowRight } from 'lucide-vue-next'
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

// Use the quiz identifier composable with manual overrides for Unit 1, Activity 4
const quizIdentifier = useQuizIdentifier({
  unit: 'Unit 1',
  activity: 4,
  type: 'kinestetik',
})

const quizId = ref(null)
const quizAttemptId = ref(null)
const startedAt = ref(null)

const quizTitle = ref('Unit 1: Aktiviti 4 - Mari Mengelas')
const instructions = ref(
  'Seret dan lepaskan gambar ke dalam jadual yang betul untuk mengelas benda hidup dan benda bukan hidup.',
)

// Define the items to classify
const items = ref([
  {
    id: 1,
    name: 'Pokok Kelapa',
    image: '/images/student/unit1/17.png',
    correctCategory: 'hidup',
    currentCategory: null,
  },
  {
    id: 2,
    name: 'Burung',
    image: '/images/student/unit1/19.png',
    correctCategory: 'hidup',
    currentCategory: null,
  },
  {
    id: 3,
    name: 'Bayi',
    image: '/images/student/unit1/20.png',
    correctCategory: 'hidup',
    currentCategory: null,
  },
  {
    id: 4,
    name: 'Pensel',
    image: '/images/student/unit1/15.png',
    correctCategory: 'bukan-hidup',
    currentCategory: null,
  },
  {
    id: 5,
    name: 'Kipas',
    image: '/images/student/unit1/16.png',
    correctCategory: 'bukan-hidup',
    currentCategory: null,
  },
  {
    id: 6,
    name: 'Komputer',
    image: '/images/student/unit1/18.png',
    correctCategory: 'bukan-hidup',
    currentCategory: null,
  },
])

const quizState = ref('initial') // initial, submitted, completed
const score = ref(0)
const showInstructions = ref(true)
const imagesLoaded = ref(0)
const totalImages = items.value.length

// Function to handle image load
const handleImageLoad = () => {
  imagesLoaded.value++
}

// Function to handle image error
const handleImageError = (item) => {
  console.error('Image failed to load:', item.image)
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
    alert('Gagal memuat data kuiz. Sila cuba lagi.')
  }
}

// Track dragging state
const isDragging = ref(false)
const draggedItem = ref(null)

// Start drag
const startDrag = (item) => {
  isDragging.value = true
  draggedItem.value = item
}

// Allow drop
const allowDrop = (e) => {
  e.preventDefault()
}

// Handle drop
const handleDrop = (category) => {
  if (draggedItem.value) {
    draggedItem.value.currentCategory = category

    isDragging.value = false
    draggedItem.value = null

    // Change state if this is the first interaction
    if (quizState.value === 'initial') {
      quizState.value = 'in-progress'
    }
  }
}

// Remove item from category (move back to available items)
const removeItem = (item) => {
  item.currentCategory = null
}

// Check if all items have been classified
const allItemsClassified = computed(() => {
  return items.value.every((item) => item.currentCategory !== null)
})

// Filter items by current category
const itemsInCategory = (category) => {
  return items.value.filter((item) => item.currentCategory === category)
}

// Available items (not yet classified)
const availableItems = computed(() => {
  return items.value.filter((item) => item.currentCategory === null)
})

// Submit the quiz
const submitQuiz = async () => {
  // Check if all items have been categorized
  const uncategorizedItems = items.value.filter((item) => !item.currentCategory)
  if (uncategorizedItems.length > 0) {
    const message = 'Sila kategorikan semua item sebelum menghantar.'
    alert(message)
    return
  } // Ensure we have a quiz ID before submitting
  if (!quizId.value) {
    console.error('Quiz ID not available. Cannot submit quiz attempt.')
    alert('Gagal menghantar jawapan: Data kuiz tidak tersedia.')
    return
  }

  const completedAt = new Date().toISOString()

  // Calculate score and prepare answers for API
  score.value = 0
  const answersForApi = {}

  // Check each item categorization
  items.value.forEach((item) => {
    const isCorrect = item.currentCategory === item.correctCategory

    if (isCorrect) {
      score.value++
    }

    answersForApi[item.id] = {
      selectedCategory: item.currentCategory,
      correctCategory: item.correctCategory,
      isCorrect: isCorrect,
      itemName: item.name,
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
    score: parseFloat(((score.value / items.value.length) * 100).toFixed(2)),
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
  const allCorrect = items.value.every((item) => item.currentCategory === item.correctCategory)

  if (allCorrect) {
    quizState.value = 'completed_correct'
  } else {
    quizState.value = 'completed_incorrect'
  }
}

// Reset the quiz
const resetQuiz = () => {
  items.value.forEach((item) => {
    item.currentCategory = null
  })
  score.value = 0
  quizState.value = 'initial'
  showInstructions.value = true

  // Record new start time for the retry
  startedAt.value = new Date().toISOString()
}

// Get color class based on correctness (for completed state)
const getCategoryItemColor = (item) => {
  if (!quizState.value.includes('completed')) {
    return 'border-gray-200'
  }

  return item.currentCategory === item.correctCategory
    ? 'border-green-400 bg-green-50'
    : 'border-red-400 bg-red-50'
}

// Initialize component when mounted
onMounted(async () => {
  console.log('Component mounted. Quiz identifier:', quizIdentifier.identifier.value)

  // Record quiz start time
  startedAt.value = new Date().toISOString()

  // Load quiz data
  await loadQuizData()
})

// Clean up event listeners
onBeforeUnmount(() => {
  // Any cleanup needed
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center p-6"
    :class="{
      'dyslexia-friendly': sharedSettings.dyslexiaMode.value,
      'high-contrast': sharedSettings.highContrast.value,
    }"
  >
    <Card class="h-auto w-full max-w-5xl shadow-2xl rounded-xl">
      <CardHeader
        class="text-left bg-indigo-600 text-white rounded-t-xl p-8"
        :class="[sharedSettings.fontSize.value]"
      >
        <CardTitle class="text-4xl font-bold flex items-center">
          <Sparkles class="w-10 h-10 mr-3 text-yellow-300" />
          {{ quizTitle }}
        </CardTitle>
        <CardDescription
          v-if="showInstructions"
          class="text-white mt-6 mb-2"
          :class="[sharedSettings.fontSize.value]"
        >
          <div class="flex items-start">
            <span class="leading-relaxed">{{ instructions }}</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent class="p-8">
        <!-- Quiz Content -->
        <div v-if="!quizState.includes('completed')" class="mb-8">
          <!-- Available Items Section -->
          <div class="mb-8">
            <h3 class="text-xl font-bold mb-4" :class="[sharedSettings.fontSize.value]">
              Sila klasifikasikan gambar-gambar berikut:
            </h3>
            <div
              class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
            >
              <div
                v-for="item in availableItems"
                :key="`available-${item.id}`"
                class="flex flex-col items-center justify-center cursor-move border-2 border-gray-300 rounded-lg p-3 bg-white hover:shadow-md transition-shadow"
                draggable="true"
                @dragstart="startDrag(item)"
              >
                <div
                  class="w-full aspect-square mb-2 overflow-hidden rounded flex items-center justify-center bg-white"
                >
                  <img
                    :src="item.image"
                    :alt="item.name"
                    class="max-w-full max-h-full object-contain"
                    @load="handleImageLoad"
                    @error="handleImageError(item)"
                  />
                </div>
                <p class="text-center text-sm font-medium" :class="[sharedSettings.fontSize.value]">
                  {{ item.name }}
                </p>
              </div>

              <div
                v-if="availableItems.length === 0"
                class="col-span-full text-center py-4 text-gray-500 italic"
                :class="[sharedSettings.fontSize.value]"
              >
                Semua gambar telah diklasifikasikan
              </div>
            </div>
          </div>

          <!-- Classification Tables -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Living Things Table -->
            <div
              class="border-2 rounded-lg border-green-500 overflow-hidden"
              @dragover="allowDrop"
              @drop="handleDrop('hidup')"
            >
              <div
                class="bg-green-500 text-white p-3 text-center font-bold"
                :class="[sharedSettings.fontSize.value]"
              >
                Benda Hidup
              </div>
              <div class="p-4 min-h-[200px] grid grid-cols-2 gap-3">
                <div
                  v-for="item in itemsInCategory('hidup')"
                  :key="`hidup-${item.id}`"
                  class="flex flex-col items-center cursor-pointer border-2 rounded-lg p-3 bg-white hover:shadow-md transition-shadow"
                  :class="[getCategoryItemColor(item)]"
                  @click="!quizState.includes('completed') && removeItem(item)"
                >
                  <div
                    class="w-full aspect-square mb-2 overflow-hidden rounded flex items-center justify-center bg-white"
                  >
                    <img
                      :src="item.image"
                      :alt="item.name"
                      class="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <p
                    class="text-center text-sm font-medium"
                    :class="[sharedSettings.fontSize.value]"
                  >
                    {{ item.name }}
                  </p>
                  <!-- Correct/Incorrect indicators (shown when quiz is completed) -->
                  <div v-if="quizState.includes('completed')" class="mt-1">
                    <CheckCircle
                      v-if="item.correctCategory === 'hidup'"
                      class="w-5 h-5 text-green-600"
                    />
                    <XCircle v-else class="w-5 h-5 text-red-600" />
                  </div>
                </div>

                <div
                  v-if="itemsInCategory('hidup').length === 0"
                  class="col-span-full flex items-center justify-center min-h-[100px] text-gray-400 border-2 border-dashed border-gray-300 rounded-lg"
                >
                  <p :class="[sharedSettings.fontSize.value]">Lepaskan gambar di sini</p>
                </div>
              </div>
            </div>

            <!-- Non-Living Things Table -->
            <div
              class="border-2 rounded-lg border-blue-500 overflow-hidden"
              @dragover="allowDrop"
              @drop="handleDrop('bukan-hidup')"
            >
              <div
                class="bg-blue-500 text-white p-3 text-center font-bold"
                :class="[sharedSettings.fontSize.value]"
              >
                Benda Bukan Hidup
              </div>
              <div class="p-4 min-h-[200px] grid grid-cols-2 gap-3">
                <div
                  v-for="item in itemsInCategory('bukan-hidup')"
                  :key="`bukan-hidup-${item.id}`"
                  class="flex flex-col items-center cursor-pointer border-2 rounded-lg p-3 bg-white hover:shadow-md transition-shadow"
                  :class="[getCategoryItemColor(item)]"
                  @click="!quizState.includes('completed') && removeItem(item)"
                >
                  <div
                    class="w-full aspect-square mb-2 overflow-hidden rounded flex items-center justify-center bg-white"
                  >
                    <img
                      :src="item.image"
                      :alt="item.name"
                      class="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <p
                    class="text-center text-sm font-medium"
                    :class="[sharedSettings.fontSize.value]"
                  >
                    {{ item.name }}
                  </p>
                  <!-- Correct/Incorrect indicators (shown when quiz is completed) -->
                  <div v-if="quizState.includes('completed')" class="mt-1">
                    <CheckCircle
                      v-if="item.correctCategory === 'bukan-hidup'"
                      class="w-5 h-5 text-green-600"
                    />
                    <XCircle v-else class="w-5 h-5 text-red-600" />
                  </div>
                </div>

                <div
                  v-if="itemsInCategory('bukan-hidup').length === 0"
                  class="col-span-full flex items-center justify-center min-h-[100px] text-gray-400 border-2 border-dashed border-gray-300 rounded-lg"
                >
                  <p :class="[sharedSettings.fontSize.value]">Lepaskan gambar di sini</p>
                </div>
              </div>
            </div>
          </div>
          <!-- Help Text -->
          <div v-if="!quizState.includes('completed')" class="mt-4 text-center text-gray-600">
            <p :class="[sharedSettings.fontSize.value]">
              <span v-if="availableItems.length > 0">
                Klik dan seret gambar ke jadual yang betul.
                {{ availableItems.length }} gambar masih belum diklasifikasikan.
              </span>
              <span v-else> Klik pada gambar untuk mengeluarkannya dari jadual. </span>
            </p>
          </div>
        </div>
        <!-- Quiz Complete Screen -->
        <div
          v-if="
            quizState === 'completed' ||
            quizState === 'completed_correct' ||
            quizState === 'completed_incorrect'
          "
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
              Kuiz Selesai!
            </h2>
            <p class="text-indigo-700 text-xl mb-6" :class="[sharedSettings.fontSize.value]">
              Anda telah menjawab <span class="font-bold">{{ score }}</span> daripada
              <span class="font-bold">{{ items.length }}</span> soalan dengan betul!
            </p>

            <div class="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div
                class="h-4 rounded-full"
                :class="score === items.length ? 'bg-green-500' : 'bg-indigo-500'"
                :style="{ width: `${(score / items.length) * 100}%` }"
              ></div>
            </div>

            <!-- Information about Living and Non-Living Things -->
            <div class="mt-8 w-full">
              <h3
                class="text-xl font-bold text-indigo-700 mb-4"
                :class="[sharedSettings.fontSize.value]"
              >
                Ciri-ciri Benda Hidup dan Bukan Hidup
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div class="bg-white rounded-lg shadow-md p-4">
                  <h4
                    class="text-lg font-bold text-green-600 mb-2"
                    :class="[sharedSettings.fontSize.value]"
                  >
                    Benda Hidup
                  </h4>
                  <ul
                    class="list-disc list-inside space-y-1"
                    :class="[sharedSettings.fontSize.value]"
                  >
                    <li>Boleh bernafas</li>
                    <li>Memerlukan makanan</li>
                    <li>Boleh membesar</li>
                    <li>Boleh membiak</li>
                    <li>Boleh bergerak</li>
                    <li>Bertindak balas terhadap rangsangan</li>
                  </ul>
                </div>

                <div class="bg-white rounded-lg shadow-md p-4">
                  <h4
                    class="text-lg font-bold text-blue-600 mb-2"
                    :class="[sharedSettings.fontSize.value]"
                  >
                    Benda Bukan Hidup
                  </h4>
                  <ul
                    class="list-disc list-inside space-y-1"
                    :class="[sharedSettings.fontSize.value]"
                  >
                    <li>Tidak bernafas</li>
                    <li>Tidak memerlukan makanan</li>
                    <li>Tidak boleh membesar</li>
                    <li>Tidak boleh membiak</li>
                    <li>Tidak boleh bergerak sendiri</li>
                    <li>Tidak bertindak balas terhadap rangsangan</li>
                  </ul>
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
            v-if="allItemsClassified && !quizState.includes('completed')"
            @click="submitQuiz"
            class="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle class="w-5 h-5 mr-2" />
            Hantar Jawapan
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
/* Dragging style */
[draggable='true'] {
  user-select: none;
  -webkit-user-drag: element;
}

[draggable='true']:active {
  opacity: 0.7;
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
</style>
