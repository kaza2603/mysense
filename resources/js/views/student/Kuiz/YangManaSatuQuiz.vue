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
import StudentLayout from '@/components/StudentLayout.vue'
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

// Use the quiz identifier composable with manual overrides
const quizIdentifier = useQuizIdentifier({
  unit: 'Unit 1',
  activity: 3,
  type: 'visual',
})

const quizId = ref(null)
const quizAttemptId = ref(null)
const startedAt = ref(null)
const quizTitle = ref('Unit 1: Aktiviti 3 - Lengkapkan Jadual Perbandukan Gambar')
const instructions = ref(
  'Pilih gambar dan klasifikasikan sebagai benda hidup atau benda bukan hidup dengan meletakkannya dalam kolum yang betul.',
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
        description: 'Quiz tentang klasifikasi benda hidup dan benda bukan hidup',
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

const images = ref([
  {
    id: 1,
    src: '/images/student/unit1/11.png',
    alt: 'Itik',
    isLivingThing: true,
    classification: null,
    loaded: false,
    error: false,
  },
  {
    id: 2,
    src: '/images/student/unit1/12.png',
    alt: 'Beg sekolah',
    isLivingThing: false,
    classification: null,
    loaded: false,
    error: false,
  },
  {
    id: 3,
    src: '/images/student/unit1/13.png',
    alt: 'Payung',
    isLivingThing: false,
    classification: null,
    loaded: false,
    error: false,
  },
  {
    id: 4,
    src: '/images/student/unit1/14.png',
    alt: 'Pokok Pisang',
    isLivingThing: true,
    classification: null,
    loaded: false,
    error: false,
  },
])

const quizState = ref('initial') // initial, in-progress, submitted, completed_correct, completed_incorrect
const showInstructions = ref(true)
const draggedItem = ref(null)

// Check if all items have been classified
const isAllClassified = computed(() => {
  return images.value.every((img) => img.classification !== null)
})

// Check if classifications are correct
const areClassificationsCorrect = computed(() => {
  return images.value.every((img) => {
    if (img.isLivingThing && img.classification === 'hidup') return true
    if (!img.isLivingThing && img.classification === 'bukan_hidup') return true
    return false
  })
})

// Living things and non-living things classifications
const livingThings = computed(() => {
  return images.value.filter((img) => img.classification === 'hidup')
})

const nonLivingThings = computed(() => {
  return images.value.filter((img) => img.classification === 'bukan_hidup')
})

// Reset an item to unclassified state
const resetItem = (item) => {
  if (
    quizState.value === 'initial' ||
    quizState.value === 'submitted' ||
    quizState.value === 'in-progress'
  ) {
    item.classification = null
  }
}

// Classify an item as living or non-living
const classifyItem = (item, type) => {
  if (
    quizState.value === 'initial' ||
    quizState.value === 'submitted' ||
    quizState.value === 'in-progress'
  ) {
    // If this is the first classification, change state to in-progress and record start time
    if (quizState.value === 'initial') {
      quizState.value = 'in-progress'
      startedAt.value = new Date().toISOString()
    }

    item.classification = type
  }
}

// Handle drag start
const handleDragStart = (item) => {
  if (
    quizState.value === 'initial' ||
    quizState.value === 'submitted' ||
    quizState.value === 'in-progress'
  ) {
    draggedItem.value = item
  }
}

// Handle drag over
const allowDrop = (event) => {
  event.preventDefault()
}

// Handle drop
const handleDrop = (event, classification) => {
  event.preventDefault()
  if (
    draggedItem.value &&
    (quizState.value === 'initial' ||
      quizState.value === 'submitted' ||
      quizState.value === 'in-progress')
  ) {
    classifyItem(draggedItem.value, classification)
    draggedItem.value = null
  }
}

const checkAnswers = async () => {
  if (!isAllClassified.value) {
    const message = 'Sila klasifikasikan semua item sebelum menyemak jawapan.'
    alert(message)
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
  let score = 0
  const answersForApi = {}

  images.value.forEach((image) => {
    const isCorrect =
      (image.isLivingThing && image.classification === 'hidup') ||
      (!image.isLivingThing && image.classification === 'bukan_hidup')

    if (isCorrect) {
      score++
    }

    answersForApi[image.id] = {
      classification: image.classification,
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

  const quizAttemptData = {
    student_id: studentId,
    quiz_id: quizId.value,
    score: parseFloat(((score / images.value.length) * 100).toFixed(2)),
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

  // Determine if classifications are correct for UI feedback
  if (areClassificationsCorrect.value) {
    quizState.value = 'completed_correct'
  } else {
    quizState.value = 'completed_incorrect'
  }
}

const retryQuiz = () => {
  images.value.forEach((img) => (img.classification = null))
  quizState.value = 'initial'
  showInstructions.value = true
  startedAt.value = null
  quizAttemptId.value = null
}

// Function to handle image loading
const handleImageLoad = (image) => {
  image.loaded = true
  image.error = false
}

// Function to handle image error
const handleImageError = (image) => {
  console.error('Image failed to load:', image.src)
  image.error = true
  image.loaded = false
  // Try to reload from the original source once
  if (!image.retried) {
    image.retried = true
    const originalSrc = image.src
    // Clear the src and then reset it to trigger a reload
    setTimeout(() => {
      image.src = originalSrc
    }, 500)
  }
}

// Get image container border color based on answer state
const getBorderColor = (image) => {
  if (quizState.value === 'initial' || quizState.value === 'submitted') {
    return image.classification !== null ? 'border-blue-500' : 'border-gray-300'
  }

  if (quizState.value === 'completed_correct' || quizState.value === 'completed_incorrect') {
    // Correct classifications
    if (
      (image.isLivingThing && image.classification === 'hidup') ||
      (!image.isLivingThing && image.classification === 'bukan_hidup')
    ) {
      return 'border-green-500'
    }
    // Incorrect classifications
    else if (image.classification !== null) {
      return 'border-red-500'
    }
  }

  return 'border-gray-300'
}

// Get classification area border color based on state
const getClassificationAreaBorderColor = (type) => {
  if (quizState.value === 'completed_correct' || quizState.value === 'completed_incorrect') {
    return 'border-green-500'
  }
  return draggedItem.value ? 'border-blue-500 border-dashed' : 'border-gray-300'
}

// Set up keyboard navigation for accessibility
onMounted(async () => {
  console.log('Component mounted. Quiz identifier:', quizIdentifier.identifier.value)
  console.log('Quiz identifier debug:', quizIdentifier.debug)

  // Load quiz data from the database
  await loadQuizData()

  console.log('Loaded quiz ID:', quizId.value)

  // Check if the public directory exists
  console.log('Preloading images...')
  images.value.forEach((image) => {
    const img = new Image()
    img.onload = () => handleImageLoad(image)
    img.onerror = () => handleImageError(image)
    img.src = image.src
  })

  // Add keyboard event listener for accessibility
  window.addEventListener('keydown', handleKeyboardNavigation)
})

// Keyboard navigation
const handleKeyboardNavigation = (e) => {
  // Implementation for keyboard navigation
  // This would need to be adapted for the drag and drop interface
}

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboardNavigation)
})
</script>

<template>
  <div
    class="w-full flex items-center justify-center p-0 m-0"
    :class="{
      'dyslexia-friendly': sharedSettings.dyslexiaMode.value,
      'high-contrast': sharedSettings.highContrast.value,
    }"
  >
    <Card class="h-auto w-full max-w-4xl shadow-2xl rounded-xl">
      <CardHeader
        class="text-left bg-pink-600 text-white rounded-t-xl p-8"
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
        <!-- Image Grid -->
        <div class="grid grid-cols-4 gap-6 mb-8">
          <div v-for="image in images" :key="image.id" class="flex flex-col items-center">
            <div
              :class="[
                'relative p-4 border-8 rounded-xl transition-all duration-200 ease-in-out mb-4',
                getBorderColor(image),
                image.classification === null ? 'cursor-move' : 'cursor-pointer',
              ]"
              draggable="true"
              @dragstart="handleDragStart(image)"
              @click="image.classification !== null ? resetItem(image) : null"
              style="max-height: 230px; max-width: 200px"
              :data-image-id="image.id"
            >
              <div
                v-if="image.error"
                class="flex items-center justify-center bg-gray-100 rounded-lg"
                style="min-height: 150px; min-width: 150px"
              >
                <img
                  src="/icons/icon-128x128.png"
                  :alt="`Fallback for ${image.alt}`"
                  class="w-1/2 h-auto object-contain p-4"
                />
              </div>
              <img
                v-else
                :src="image.src"
                :alt="image.alt"
                class="w-full h-auto object-contain rounded-lg bg-white p-4"
                style="max-height: 150px; max-width: 150px"
                @load="handleImageLoad(image)"
                @error="handleImageError(image)"
              />

              <p class="text-center mt-4 font-bold" :class="[sharedSettings.fontSize.value]">
                {{ image.alt }}
              </p>
            </div>
          </div>
        </div>

        <!-- Classification Table -->
        <div class="w-full border-2 border-gray-300 rounded-lg overflow-hidden bg-white mb-8">
          <table class="w-full border-collapse">
            <caption class="sr-only">
              Classification Table
            </caption>
            <thead>
              <tr>
                <th
                  class="border-b-2 border-gray-300 p-4 text-center bg-gray-100 w-1/2"
                  :class="[sharedSettings.fontSize.value]"
                >
                  Benda Hidup
                </th>
                <th
                  class="border-b-2 border-gray-300 p-4 text-center bg-gray-100 w-1/2"
                  :class="[sharedSettings.fontSize.value]"
                >
                  Benda Bukan Hidup
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  class="border-r-2 border-gray-300 p-4 align-top"
                  @dragover="allowDrop($event)"
                  @drop="handleDrop($event, 'hidup')"
                >
                  <div
                    class="min-height-200 border-4 rounded-xl p-4 flex flex-col items-center gap-4"
                    :class="getClassificationAreaBorderColor('hidup')"
                    style="min-height: 250px"
                  >
                    <div
                      v-for="item in livingThings"
                      :key="item.id"
                      class="flex flex-col items-center cursor-pointer"
                      @click="resetItem(item)"
                    >
                      <div
                        :class="[
                          'relative p-2 border-4 rounded-xl transition-all duration-200 ease-in-out mb-2',
                          getBorderColor(item),
                        ]"
                        style="max-height: 120px; max-width: 120px"
                      >
                        <img
                          v-if="!item.error"
                          :src="item.src"
                          :alt="item.alt"
                          class="w-full h-auto object-contain rounded-lg bg-white p-2"
                          style="max-height: 80px; max-width: 80px"
                        />
                      </div>
                      <p
                        class="text-center text-sm font-bold"
                        :class="[sharedSettings.fontSize.value]"
                      >
                        {{ item.alt }}
                      </p>
                    </div>
                  </div>
                </td>
                <td
                  class="p-4 align-top"
                  @dragover="allowDrop($event)"
                  @drop="handleDrop($event, 'bukan_hidup')"
                >
                  <div
                    class="min-height-200 border-4 rounded-xl p-4 flex flex-col items-center gap-4"
                    :class="getClassificationAreaBorderColor('bukan_hidup')"
                    style="min-height: 250px"
                  >
                    <div
                      v-for="item in nonLivingThings"
                      :key="item.id"
                      class="flex flex-col items-center cursor-pointer"
                      @click="resetItem(item)"
                    >
                      <div
                        :class="[
                          'relative p-2 border-4 rounded-xl transition-all duration-200 ease-in-out mb-2',
                          getBorderColor(item),
                        ]"
                        style="max-height: 120px; max-width: 120px"
                      >
                        <img
                          v-if="!item.error"
                          :src="item.src"
                          :alt="item.alt"
                          class="w-full h-auto object-contain rounded-lg bg-white p-2"
                          style="max-height: 80px; max-width: 80px"
                        />
                      </div>
                      <p
                        class="text-center text-sm font-bold"
                        :class="[sharedSettings.fontSize.value]"
                      >
                        {{ item.alt }}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Alternative Click-to-Classify Interface for Accessibility -->
        <div class="bg-blue-50 rounded-xl p-6 mb-8">
          <h3 class="text-xl font-bold mb-4" :class="[sharedSettings.fontSize.value]">
            Tidak dapat seret? Tekan butang di bawah untuk mengklasifikasikan:
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="image in images"
              :key="image.id"
              class="flex flex-col items-center bg-white p-4 rounded-xl border-2"
              :class="
                image.classification === null
                  ? 'border-gray-300'
                  : image.classification === 'hidup'
                    ? 'border-green-500 bg-green-50'
                    : 'border-blue-500 bg-blue-50'
              "
            >
              <div class="flex items-center gap-2 mb-2">
                <img
                  v-if="!image.error"
                  :src="image.src"
                  :alt="image.alt"
                  class="w-16 h-16 object-contain"
                />
                <span class="font-bold" :class="[sharedSettings.fontSize.value]">{{
                  image.alt
                }}</span>
              </div>
              <div class="flex gap-2 mt-2">
                <Button
                  @click="classifyItem(image, 'hidup')"
                  :class="
                    image.classification === 'hidup'
                      ? 'bg-green-700 ring-4 ring-green-300'
                      : 'bg-green-600 hover:bg-green-700'
                  "
                >
                  Benda Hidup
                  <CheckCircle v-if="image.classification === 'hidup'" class="w-4 h-4 ml-1" />
                </Button>
                <Button
                  @click="classifyItem(image, 'bukan_hidup')"
                  :class="
                    image.classification === 'bukan_hidup'
                      ? 'bg-blue-700 ring-4 ring-blue-300'
                      : 'bg-blue-600 hover:bg-blue-700'
                  "
                >
                  Benda Bukan Hidup
                  <CheckCircle v-if="image.classification === 'bukan_hidup'" class="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Result Messages -->
        <div
          v-if="quizState === 'completed_correct'"
          class="text-left p-8 bg-green-100 rounded-lg border-4 border-green-500 my-6"
        >
          <div class="flex items-start">
            <Sparkles class="w-16 h-16 text-yellow-500 mr-4 animate-pulse" />
            <div>
              <h2
                class="text-3xl font-bold text-green-700 mb-4"
                :class="[sharedSettings.fontSize.value]"
              >
                Tahniah! Anda Berjaya!
              </h2>
              <p class="text-green-700 leading-relaxed" :class="[sharedSettings.fontSize.value]">
                Semua klasifikasi anda betul. Hebat!
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="quizState === 'completed_incorrect'"
          class="text-left p-8 bg-red-100 rounded-lg border-4 border-red-500 my-6"
        >
          <div class="flex items-start">
            <XCircle class="w-16 h-16 text-red-600 mr-4" />
            <div>
              <h2
                class="text-3xl font-bold text-red-700 mb-4"
                :class="[sharedSettings.fontSize.value]"
              >
                Cuba Lagi!
              </h2>
              <p class="text-red-700 leading-relaxed" :class="[sharedSettings.fontSize.value]">
                Jangan putus asa. Anda hampir berjaya. Klasifikasi yang betul telah ditandakan
                dengan hijau.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter
        class="flex flex-col sm:flex-row justify-between items-center gap-6 p-8 bg-gray-100 rounded-b-xl"
      >
        <div>
          <Button
            v-if="
              quizState === 'initial' || quizState === 'submitted' || quizState === 'in-progress'
            "
            @click="checkAnswers"
            class="bg-green-600 hover:bg-green-700 text-white text-xl py-6 px-10 rounded-xl shadow-lg"
            size="lg"
            style="min-height: 64px; min-width: 200px"
          >
            <CheckCircle class="w-8 h-8 mr-3" />
            Semak Jawapan
          </Button>
          <Button
            v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'"
            @click="retryQuiz"
            class="bg-blue-600 hover:bg-blue-700 text-white text-xl py-6 px-10 rounded-xl shadow-lg"
            size="lg"
            style="min-height: 64px; min-width: 200px"
          >
            <RotateCcw class="w-8 h-8 mr-3" />
            Cuba Lagi
          </Button>
        </div>

        <Button variant="outline" @click="router.push('/student/kuiz-index')">
          Kembali ke Index Kuiz
        </Button>
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
  outline: 3px solid #4299e1;
  outline-offset: 2px;
}

button:focus:not(:focus-visible) {
  outline: none;
}

button:focus-visible {
  outline: 3px solid #4299e1;
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
.dyslexia-friendly span,
.dyslexia-friendly th,
.dyslexia-friendly td {
  line-height: 1.8;
}

/* High contrast text for readability */
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

/* Table accessibility styles */
table {
  border-collapse: separate;
  border-spacing: 0;
}

th {
  text-align: center;
  font-weight: bold;
}

/* High contrast mode */
.high-contrast {
  filter: contrast(1.4);
}

.high-contrast img {
  filter: contrast(1.2) brightness(1.1);
}

.high-contrast button {
  border-width: 2px;
}

/* Drag and drop visual effects */
[draggable='true'] {
  cursor: move;
  user-select: none;
  -webkit-user-drag: element;
}

[draggable='true']:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@keyframes dropTargetPulse {
  0% {
    border-color: #3182ce;
  }
  50% {
    border-color: #63b3ed;
  }
  100% {
    border-color: #3182ce;
  }
}

.border-dashed {
  animation: dropTargetPulse 1.5s infinite;
}
</style>
