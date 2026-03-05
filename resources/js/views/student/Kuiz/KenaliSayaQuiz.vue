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

// Inject shared accessibility settings from KuizLayout
const sharedAccessibility = inject('accessibilitySettings', {
  fontSize: ref('text-lg'),
  dyslexiaMode: ref(false),
  highContrast: ref(false),
})

// Use the quiz identifier composable with manual overrides for Unit 1, Activity 1
const quizIdentifier = useQuizIdentifier({
  unit: 'Unit 1',
  activity: 1,
  type: 'visual',
})

const quizId = ref(null)
const quizAttemptId = ref(null)
const startedAt = ref(null)
const quizTitle = ref('Unit 1: Aktiviti 1 - Kenali Saya')
const instructions = ref('Pilih semua gambar benda hidup. Klik pada gambar untuk memilih.')

const images = ref([
  {
    id: 1,
    src: '/images/student/unit1/1.png',
    alt: 'Pelajar',
    isLivingThing: true,
    selected: false,
    loaded: false,
    error: false,
  },
  {
    id: 2,
    src: '/images/student/unit1/2.png',
    alt: 'Duit Syiling',
    isLivingThing: false,
    selected: false,
    loaded: false,
    error: false,
  },
  {
    id: 3,
    src: '/images/student/unit1/3.png',
    alt: 'Bunga Raya',
    isLivingThing: true,
    selected: false,
    loaded: false,
    error: false,
  },
  {
    id: 4,
    src: '/images/student/unit1/4.png',
    alt: 'Kasut Roda',
    isLivingThing: false,
    selected: false,
    loaded: false,
    error: false,
  },
  {
    id: 5,
    src: '/images/student/unit1/5.png',
    alt: 'Kucing',
    isLivingThing: true,
    selected: false,
    loaded: false,
    error: false,
  },
])

const correctAnswers = [1, 3, 5]
const quizState = ref('initial') // initial, submitted, completed_correct, completed_incorrect
const showInstructions = ref(true)

const selectedImageIds = computed(() => {
  return images.value.filter((img) => img.selected).map((img) => img.id)
})

const toggleImageSelection = (image) => {
  if (quizState.value === 'initial' || quizState.value === 'submitted') {
    // Record start time on first interaction
    if (quizState.value === 'initial' && !startedAt.value) {
      startedAt.value = new Date().toISOString()
    }

    image.selected = !image.selected
  }
}

// Navigation for single item view
const goToNextItem = () => {
  if (currentIndex.value < images.value.length - 1) {
    currentIndex.value++
  }
}

const goToPreviousItem = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const checkAnswers = async () => {
  if (selectedImageIds.value.length === 0) {
    const message = 'Sila pilih sekurang-kurangnya satu gambar.'
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

  // Check each image selection
  images.value.forEach((image) => {
    const isSelected = selectedImageIds.value.includes(image.id)
    const isCorrect = (image.isLivingThing && isSelected) || (!image.isLivingThing && !isSelected)

    if (isCorrect) {
      score++
    }

    answersForApi[image.id] = {
      selected: isSelected,
      isCorrect: isCorrect,
      isLivingThing: image.isLivingThing,
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

  // Determine if all answers are correct for UI feedback
  const sortedSelected = [...selectedImageIds.value].sort((a, b) => a - b)
  const sortedCorrect = [...correctAnswers].sort((a, b) => a - b)

  if (JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect)) {
    quizState.value = 'completed_correct'
  } else {
    quizState.value = 'completed_incorrect'
  }
}

const retryQuiz = () => {
  images.value.forEach((img) => (img.selected = false))
  quizState.value = 'initial'
  showInstructions.value = true
  startedAt.value = null
  quizAttemptId.value = null
}

// Toggle view mode (single item or all items)
const toggleViewMode = () => {
  showAllItems.value = !showAllItems.value
  if (!showAllItems.value) {
    currentIndex.value = 0
  }
}

// Placeholder for sound playing function
// const playSound = (soundType) => {
//   // Implementation for playing sound based on soundType ('select', 'success', 'failure')
//   console.log(`Playing sound: ${soundType}`)
// }

const getBorderColor = (image) => {
  if (quizState.value === 'initial' || quizState.value === 'submitted') {
    return image.selected ? 'border-blue-500' : 'border-gray-300'
  }
  if (quizState.value === 'completed_correct' || quizState.value === 'completed_incorrect') {
    if (image.selected && image.isLivingThing) return 'border-green-500' // Correctly selected
    if (image.selected && !image.isLivingThing) return 'border-red-500' // Incorrectly selected
    if (!image.selected && image.isLivingThing) return 'border-yellow-500' // Missed correct answer
  }
  return 'border-gray-300'
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
        description: 'Quiz tentang mengenal pasti benda hidup',
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
  if (!showAllItems.value) {
    // For single item view
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      goToNextItem()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      goToPreviousItem()
    } else if (e.key === ' ' || e.key === 'Enter') {
      // Toggle selection with space or enter
      if (currentIndex.value < images.value.length) {
        toggleImageSelection(images.value[currentIndex.value])
      }
    }
  } else {
    // For grid view, allow tabbing between items
    if (e.key === ' ' || e.key === 'Enter') {
      // Find the active/focused element and toggle if it's an image
      const activeElement = document.activeElement
      if (activeElement && activeElement.dataset && activeElement.dataset.imageId) {
        const imageId = parseInt(activeElement.dataset.imageId)
        const image = images.value.find((img) => img.id === imageId)
        if (image) {
          toggleImageSelection(image)
        }
      }
    }
  }
}

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboardNavigation)
})

const currentIndex = ref(0) // For single question mode
const showAllItems = ref(false) // Toggle between single item and all items view

// Text-to-speech function removed for accessibility compliance
</script>

<template>
  <div
    class="w-full flex items-center justify-center p-0 m-0"
    :class="{
      'dyslexia-friendly': sharedAccessibility.dyslexiaMode.value,
      'high-contrast': sharedAccessibility.highContrast.value,
    }"
  >
    <Card
      class="h-auto w-full max-w-8xl shadow-2xl rounded-xl mt-8"
      role="main"
      aria-label="Kenali Saya Quiz"
    >
      <CardHeader
        class="text-left bg-pink-600 text-white rounded-t-xl p-8"
        :class="[sharedAccessibility.fontSize.value]"
        role="banner"
      >
        <CardTitle class="text-4xl font-bold flex items-center" id="quiz-title">
          <Sparkles class="w-10 h-10 mr-3 text-yellow-300" aria-hidden="true" />
          {{ quizTitle }}
        </CardTitle>
        <CardDescription
          v-if="showInstructions && quizState === 'initial'"
          class="text-white mt-6 mb-2"
          :class="[sharedAccessibility.fontSize.value]"
          id="quiz-instructions"
          role="region"
          aria-labelledby="quiz-title"
        >
          <div class="flex items-start">
            <span class="leading-relaxed">{{ instructions }}</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent class="p-8" role="main" aria-describedby="quiz-instructions">
        <!-- Single Item View Mode -->
        <div
          v-if="!showAllItems && images.length > 0"
          class="flex flex-col items-center"
          role="region"
          aria-label="Single item view"
        >
          <div
            class="flex items-center justify-center mb-6 w-full"
            role="navigation"
            aria-label="Image navigation"
          >
            <Button
              @click="goToPreviousItem"
              class="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center mr-4"
              :disabled="currentIndex === 0"
              aria-label="Previous item"
              :aria-describedby="currentIndex === 0 ? 'nav-disabled-prev' : undefined"
            >
              <ArrowLeft class="w-8 h-8" aria-hidden="true" />
            </Button>
            <span class="mx-4 text-xl font-bold" aria-live="polite"
              >{{ currentIndex + 1 }} / {{ images.length }}</span
            >
            <Button
              @click="goToNextItem"
              class="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center ml-4"
              :disabled="currentIndex === images.length - 1"
              aria-label="Next item"
              :aria-describedby="
                currentIndex === images.length - 1 ? 'nav-disabled-next' : undefined
              "
            >
              <ArrowRight class="w-8 h-8" aria-hidden="true" />
            </Button>
            <span id="nav-disabled-prev" class="sr-only">You are at the first item</span>
            <span id="nav-disabled-next" class="sr-only">You are at the last item</span>
          </div>

          <div
            @click="toggleImageSelection(images[currentIndex])"
            :class="[
              'relative p-4 border-8 rounded-xl cursor-pointer transition-all duration-200 ease-in-out hover:scale-102',
              getBorderColor(images[currentIndex]),
            ]"
            tabindex="0"
            :aria-label="`${images[currentIndex].alt}${images[currentIndex].selected ? ' - Selected' : ''}`"
            :aria-pressed="images[currentIndex].selected"
            :data-image-id="images[currentIndex].id"
            role="button"
            @keydown.space.prevent="toggleImageSelection(images[currentIndex])"
            @keydown.enter.prevent="toggleImageSelection(images[currentIndex])"
            style="max-height: 250px; max-width: 200px"
          >
            <div
              v-if="images[currentIndex].error"
              class="flex items-center justify-center bg-gray-100 rounded-lg"
              style="min-height: 300px; min-width: 300px"
            >
              <img
                src="/icons/icon-128x128.png"
                :alt="`Fallback for ${images[currentIndex].alt}`"
                class="w-1/2 h-auto object-contain p-4"
              />
            </div>
            <img
              v-else
              :src="images[currentIndex].src"
              :alt="images[currentIndex].alt"
              class="w-full h-auto object-contain rounded-lg bg-white p-4"
              style="max-height: 300px; max-width: 300px"
              @load="handleImageLoad(images[currentIndex])"
              @error="handleImageError(images[currentIndex])"
            />

            <div
              v-if="
                images[currentIndex].selected &&
                (quizState === 'initial' || quizState === 'submitted')
              "
              class="absolute top-4 right-4 bg-blue-600 text-white rounded-full p-2"
              aria-label="Selected"
            >
              <CheckCircle class="w-8 h-8" />
            </div>
            <div v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'">
              <div
                v-if="images[currentIndex].isLivingThing && images[currentIndex].selected"
                class="absolute top-4 right-4 bg-green-600 text-white rounded-full p-2"
                aria-label="Correct answer"
              >
                <CheckCircle class="w-8 h-8" />
              </div>
              <div
                v-else-if="!images[currentIndex].isLivingThing && images[currentIndex].selected"
                class="absolute top-4 right-4 bg-red-600 text-white rounded-full p-2"
                aria-label="Incorrect answer"
              >
                <XCircle class="w-8 h-8" />
              </div>
              <div
                v-else-if="images[currentIndex].isLivingThing && !images[currentIndex].selected"
                class="absolute top-4 right-4 bg-yellow-500 text-white rounded-full p-2"
                aria-label="Missed correct answer"
              >
                <HelpCircle class="w-8 h-8" />
              </div>
            </div>

            <p class="text-center mt-4 font-bold" :class="[sharedAccessibility.fontSize.value]">
              {{ images[currentIndex].alt }}
            </p>
          </div>
        </div>

        <!-- Grid View Mode -->
        <div
          v-if="showAllItems"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-4"
          role="region"
          aria-label="Grid view of all items"
        >
          <div
            v-for="image in images"
            :key="image.id"
            @click="toggleImageSelection(image)"
            :class="[
              'relative p-4 border-8 rounded-xl cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105',
              getBorderColor(image),
              {
                'opacity-60':
                  (quizState.value === 'completed_correct' ||
                    quizState.value === 'completed_incorrect') &&
                  !image.selected &&
                  !image.isLivingThing,
              },
            ]"
            tabindex="0"
            :aria-label="`${image.alt}${image.selected ? ' - Selected' : ''}`"
            :aria-pressed="image.selected"
            :data-image-id="image.id"
            role="button"
            @keydown.space.prevent="toggleImageSelection(image)"
            @keydown.enter.prevent="toggleImageSelection(image)"
          >
            <div
              v-if="image.error"
              class="flex items-center justify-center bg-gray-100 rounded-lg aspect-square"
              style="min-height: 300px"
            >
              <img
                src="/icons/icon-128x128.png"
                :alt="`Fallback for ${image.alt}`"
                class="w-3/4 h-auto object-contain p-4"
              />
            </div>
            <img
              v-else
              :src="image.src"
              :alt="image.alt"
              class="w-full h-auto object-contain rounded-lg bg-white p-4 aspect-square"
              style="min-height: 300px"
              @load="handleImageLoad(image)"
              @error="handleImageError(image)"
            />

            <div
              v-if="image.selected && (quizState === 'initial' || quizState === 'submitted')"
              class="absolute top-4 right-4 bg-blue-600 text-white rounded-full p-2"
              aria-label="Selected"
            >
              <CheckCircle class="w-8 h-8" />
            </div>
            <div v-if="quizState === 'completed_correct' || quizState === 'completed_incorrect'">
              <div
                v-if="image.isLivingThing && image.selected"
                class="absolute top-4 right-4 bg-green-600 text-white rounded-full p-2"
                aria-label="Correct answer"
                title="Jawapan betul"
              >
                <CheckCircle class="w-8 h-8" />
              </div>
              <div
                v-else-if="!image.isLivingThing && image.selected"
                class="absolute top-4 right-4 bg-red-600 text-white rounded-full p-2"
                aria-label="Incorrect answer"
                title="Jawapan salah"
              >
                <XCircle class="w-8 h-8" />
              </div>
              <div
                v-else-if="image.isLivingThing && !image.selected"
                class="absolute top-4 right-4 bg-yellow-500 text-white rounded-full p-2"
                aria-label="Missed correct answer"
                title="Jawapan terlepas"
              >
                <HelpCircle class="w-8 h-8" />
              </div>
            </div>

            <p class="text-center mt-4 font-bold" :class="[sharedAccessibility.fontSize.value]">
              {{ image.alt }}
            </p>
          </div>
        </div>

        <!-- Result Messages with Improved Accessibility -->
        <div
          v-if="quizState === 'completed_correct'"
          class="text-left p-8 bg-green-100 rounded-lg border-4 border-green-500 my-6"
          role="alert"
          aria-live="assertive"
          aria-labelledby="success-heading"
        >
          <div class="flex items-start">
            <Sparkles class="w-16 h-16 text-yellow-500 mr-4 animate-pulse" aria-hidden="true" />
            <div>
              <h2
                id="success-heading"
                class="text-3xl font-bold text-green-700 mb-4"
                :class="[sharedAccessibility.fontSize.value]"
              >
                Tahniah! Anda Berjaya!
              </h2>
              <p
                class="text-green-700 leading-relaxed"
                :class="[sharedAccessibility.fontSize.value]"
              >
                Semua jawapan anda betul. Hebat!
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="quizState === 'completed_incorrect'"
          class="text-left p-8 bg-red-100 rounded-lg border-4 border-red-500 my-6"
          role="alert"
          aria-live="assertive"
          aria-labelledby="retry-heading"
        >
          <div class="flex items-start">
            <XCircle class="w-16 h-16 text-red-600 mr-4" aria-hidden="true" />
            <div>
              <h2
                id="retry-heading"
                class="text-3xl font-bold text-red-700 mb-4"
                :class="[sharedAccessibility.fontSize.value]"
              >
                Cuba Lagi!
              </h2>
              <p class="text-red-700 leading-relaxed" :class="[sharedAccessibility.fontSize.value]">
                Jangan putus asa. Anda hampir berjaya. Jawapan yang betul telah ditandakan dengan
                hijau atau kuning (jika anda terlepas).
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter
        class="flex flex-col sm:flex-row justify-between items-center gap-6 p-8 bg-gray-100 rounded-b-xl"
      >
        <div class="flex flex-col sm:flex-row gap-4 items-center">
          <div>
            <Button
              v-if="quizState === 'initial' || quizState === 'submitted'"
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

          <!-- View Mode Toggle -->
          <Button
            @click="toggleViewMode"
            :class="showAllItems ? 'bg-purple-600' : 'bg-orange-600'"
            class="h-12 px-4 rounded-lg flex items-center justify-center text-white"
            aria-label="Toggle view mode"
            title="Toggle between single item and grid view"
          >
            <span v-if="showAllItems" class="mr-2">📱</span>
            <span v-else class="mr-2">🔲</span>
            {{ showAllItems ? 'Paparan Tunggal' : 'Paparan Grid' }}
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

/* Image focus and selection styles */
div[tabindex='0']:focus,
[role='button']:focus {
  outline: 4px solid #4299e1;
  box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.5);
}

div[tabindex='0']:focus:not(:focus-visible),
[role='button']:focus:not(:focus-visible) {
  outline: none;
  box-shadow: none;
}

div[tabindex='0']:focus-visible,
[role='button']:focus-visible {
  outline: 4px solid #4299e1;
  box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.5);
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
  font-family: 'Comic Sans MS', 'Comic Sans', cursive, 'OpenDyslexic', sans-serif;
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

/* Improved button focus states */
button:focus {
  outline: 3px solid #4299e1;
  outline-offset: 2px;
}

/* Ensure minimal touch target sizes for accessibility */
button,
[role='button'],
input[type='submit'],
input[type='reset'],
input[type='button'] {
  min-height: 48px;
  min-width: 48px;
}

/* Animation for selection feedback */
@keyframes selectedPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}

div[data-image-id] {
  transition: all 0.3s ease;
}

div[data-image-id]:active {
  animation: selectedPulse 0.3s ease;
}

/* High contrast mode */
.high-contrast {
  filter: contrast(1.4) brightness(1.1);
}

.high-contrast img {
  filter: contrast(1.3) brightness(1.2);
}

.high-contrast button {
  border-width: 2px;
  border-color: currentColor;
}

.high-contrast .text-green-700 {
  color: #065f46 !important;
}

.high-contrast .text-red-700 {
  color: #991b1b !important;
}

/* Focus indicators for keyboard navigation */
.focus-visible\:ring-4:focus-visible {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width)
    var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(4px + var(--tw-ring-offset-width))
    var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}

/* Enhanced contrast for borders in high contrast mode */
.high-contrast .border-blue-500 {
  border-color: #1e40af !important;
  border-width: 4px;
}

.high-contrast .border-green-500 {
  border-color: #059669 !important;
  border-width: 4px;
}

.high-contrast .border-red-500 {
  border-color: #dc2626 !important;
  border-width: 4px;
}

.high-contrast .border-yellow-500 {
  border-color: #d97706 !important;
  border-width: 4px;
}
</style>
