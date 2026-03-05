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

// Use the quiz identifier composable with manual overrides for Unit 1, Activity 2
const quizIdentifier = useQuizIdentifier({
  unit: 'Unit 1',
  activity: 2,
  type: 'visual',
})

const quizId = ref(null)
const quizAttemptId = ref(null)
const startedAt = ref(null)
const quizTitle = ref('Unit 1: Aktiviti 2 - Benda Di Persekitaran')
const instructions = ref('Pilih sama ada imej adalah benda hidup atau benda bukan hidup.')

const images = ref([
  {
    id: 1,
    src: '/images/student/unit1/7.png',
    alt: 'Pelajar',
    isLivingThing: true,
    selection: null,
    loaded: false,
    error: false,
  },
  {
    id: 2,
    src: '/images/student/unit1/8.png',
    alt: 'Belon',
    isLivingThing: false,
    selection: null,
    loaded: false,
    error: false,
  },
  {
    id: 3,
    src: '/images/student/unit1/9.png',
    alt: 'Sekolah',
    isLivingThing: false,
    selection: null,
    loaded: false,
    error: false,
  },
  {
    id: 4,
    src: '/images/student/unit1/10.png',
    alt: 'Arnab',
    isLivingThing: true,
    selection: null,
    loaded: false,
    error: false,
  },
])

const quizState = ref('initial') // initial, submitted, completed_correct, completed_incorrect
const showInstructions = ref(true)

// Check if all questions have been answered
const isAllAnswered = computed(() => {
  return images.value.every((img) => img.selection !== null)
})

// Check if answers are correct
const areAnswersCorrect = computed(() => {
  return images.value.every((img) => {
    if (img.isLivingThing && img.selection === 'hidup') return true
    if (!img.isLivingThing && img.selection === 'bukan_hidup') return true
    return false
  })
})

// Toggle selection between "hidup" and "bukan_hidup"
const setSelection = (image, selection) => {
  if (quizState.value === 'initial' || quizState.value === 'submitted') {
    // Record start time on first interaction
    if (quizState.value === 'initial' && !startedAt.value) {
      startedAt.value = new Date().toISOString()
    }

    image.selection = selection
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
  if (!isAllAnswered.value) {
    const message = 'Sila jawab semua soalan sebelum menyemak jawapan.'
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
    const userAnswer = image.selection
    const correctAnswer = image.isLivingThing ? 'hidup' : 'bukan_hidup'
    const isCorrect = userAnswer === correctAnswer

    if (isCorrect) {
      score++
    }

    answersForApi[image.id] = {
      userAnswer: userAnswer,
      correctAnswer: correctAnswer,
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
  if (areAnswersCorrect.value) {
    quizState.value = 'completed_correct'
  } else {
    quizState.value = 'completed_incorrect'
  }
}

const retryQuiz = () => {
  images.value.forEach((img) => (img.selection = null))
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

// Get class for radio button based on state and correctness
const getRadioClass = (image, type) => {
  if (quizState.value === 'initial' || quizState.value === 'submitted') {
    return image.selection === type ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
  }

  if (quizState.value === 'completed_correct' || quizState.value === 'completed_incorrect') {
    if (type === 'hidup' && image.isLivingThing) {
      return image.selection === type
        ? 'bg-green-500 border-green-500'
        : 'bg-white border-green-500'
    } else if (type === 'bukan_hidup' && !image.isLivingThing) {
      return image.selection === type
        ? 'bg-green-500 border-green-500'
        : 'bg-white border-green-500'
    } else if (image.selection === type) {
      return 'bg-red-500 border-red-500'
    }
  }

  return 'bg-white border-gray-300'
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
    return image.selection !== null ? 'border-blue-500' : 'border-gray-300'
  }

  if (quizState.value === 'completed_correct' || quizState.value === 'completed_incorrect') {
    // Correct answers
    if (
      (image.isLivingThing && image.selection === 'hidup') ||
      (!image.isLivingThing && image.selection === 'bukan_hidup')
    ) {
      return 'border-green-500'
    }
    // Incorrect answers
    else {
      return 'border-red-500'
    }
  }

  return 'border-gray-300'
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
        description: 'Quiz tentang mengenal pasti benda hidup dan bukan hidup',
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
    } else if (e.key === '1' || e.key === 'h') {
      // Set as "benda hidup" with 1 or h key
      setSelection(images.value[currentIndex.value], 'hidup')
    } else if (e.key === '2' || e.key === 'b') {
      // Set as "benda bukan hidup" with 2 or b key
      setSelection(images.value[currentIndex.value], 'bukan_hidup')
    }
  } else {
    // For grid view, select the focused image
    if (e.key === ' ' || e.key === 'Enter') {
      // Find the active/focused element
      const activeElement = document.activeElement
      if (activeElement && activeElement.dataset && activeElement.dataset.imageId) {
        const imageId = parseInt(activeElement.dataset.imageId)
        const tabIndex = activeElement.dataset.tabIndex

        // Get the focused image
        const image = images.value.find((img) => img.id === imageId)

        if (image) {
          // If tab index is 1, toggle as living thing, if 2 as non-living
          if (tabIndex === '1') {
            setSelection(image, 'hidup')
          } else if (tabIndex === '2') {
            setSelection(image, 'bukan_hidup')
          }
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
</script>

<template>
  <div
    class="w-full flex items-center justify-center p-0 mt-2"
    :class="{
      'dyslexia-friendly': sharedSettings.dyslexiaMode.value,
      'high-contrast': sharedSettings.highContrast.value,
    }"
  >
    <Card class="h-auto w-full max-w-8xl shadow-2xl rounded-xl">
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
        <!-- Single Item View Mode -->
        <div v-if="!showAllItems && images.length > 0" class="flex flex-col items-center">
          <div class="flex items-center justify-center mb-6 w-full">
            <Button
              @click="goToPreviousItem"
              class="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center mr-4"
              :disabled="currentIndex === 0"
              aria-label="Previous item"
            >
              <ArrowLeft class="w-8 h-8" />
            </Button>
            <span class="mx-4 text-xl font-bold">{{ currentIndex + 1 }} / {{ images.length }}</span>
            <Button
              @click="goToNextItem"
              class="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center ml-4"
              :disabled="currentIndex === images.length - 1"
              aria-label="Next item"
            >
              <ArrowRight class="w-8 h-8" />
            </Button>
          </div>

          <div class="flex flex-col items-center w-full max-w-md">
            <div
              :class="[
                'relative p-4 border-8 rounded-xl transition-all duration-200 ease-in-out mb-6',
                getBorderColor(images[currentIndex]),
              ]"
              style="max-height: 300px; max-width: 250px"
            >
              <div
                v-if="images[currentIndex].error"
                class="flex items-center justify-center bg-gray-100 rounded-lg"
                style="min-height: 200px; min-width: 200px"
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
                style="max-height: 200px; max-width: 200px"
                @load="handleImageLoad(images[currentIndex])"
                @error="handleImageError(images[currentIndex])"
              />

              <p class="text-center mt-4 font-bold" :class="[sharedSettings.fontSize.value]">
                {{ images[currentIndex].alt }}
              </p>
            </div>

            <!-- Classification Table for Single View -->
            <div class="w-full border-2 border-gray-300 rounded-lg overflow-hidden bg-white mb-6">
              <table class="w-full border-collapse">
                <caption class="sr-only">
                  Classification for
                  {{
                    images[currentIndex].alt
                  }}
                </caption>
                <thead>
                  <tr>
                    <th
                      class="border-b-2 border-gray-300 p-4 text-left bg-gray-100"
                      :class="[sharedSettings.fontSize.value]"
                    >
                      Classification
                    </th>
                    <th
                      class="border-b-2 border-gray-300 p-4 text-center bg-gray-100"
                      :class="[sharedSettings.fontSize.value]"
                    >
                      Pilihan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      class="border-b-2 border-gray-300 p-4 text-left"
                      :class="[sharedSettings.fontSize.value]"
                    >
                      Benda Hidup
                    </td>
                    <td class="border-b-2 border-gray-300 p-4 text-center">
                      <button
                        @click="setSelection(images[currentIndex], 'hidup')"
                        class="w-6 h-6 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        :class="[getRadioClass(images[currentIndex], 'hidup')]"
                        :aria-checked="images[currentIndex].selection === 'hidup'"
                        role="radio"
                        aria-label="Pilih sebagai benda hidup"
                        tabindex="0"
                      ></button>
                    </td>
                  </tr>
                  <tr>
                    <td class="p-4 text-left" :class="[sharedSettings.fontSize.value]">
                      Benda Bukan Hidup
                    </td>
                    <td class="p-4 text-center">
                      <button
                        @click="setSelection(images[currentIndex], 'bukan_hidup')"
                        class="w-6 h-6 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        :class="[getRadioClass(images[currentIndex], 'bukan_hidup')]"
                        :aria-checked="images[currentIndex].selection === 'bukan_hidup'"
                        role="radio"
                        aria-label="Pilih sebagai benda bukan hidup"
                        tabindex="0"
                      ></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Grid View Mode -->
        <div v-if="showAllItems" class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div v-for="image in images" :key="image.id" class="flex flex-col items-center">
            <div
              :class="[
                'relative p-4 border-8 rounded-xl transition-all duration-200 ease-in-out mb-4',
                getBorderColor(image),
              ]"
              :data-image-id="image.id"
              style="max-height: 230px; max-width: 200px"
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

            <!-- Classification Table for Grid View -->
            <div
              class="w-full max-w-xs border-2 border-gray-300 rounded-lg overflow-hidden bg-white mb-6"
            >
              <table class="w-full border-collapse">
                <caption class="sr-only">
                  Classification for
                  {{
                    image.alt
                  }}
                </caption>
                <thead>
                  <tr>
                    <th
                      class="border-b-2 border-gray-300 p-3 text-left bg-gray-100"
                      :class="[sharedSettings.fontSize.value]"
                    >
                      Classification
                    </th>
                    <th
                      class="border-b-2 border-gray-300 p-3 text-center bg-gray-100"
                      :class="[sharedSettings.fontSize.value]"
                    >
                      Pilihan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      class="border-b-2 border-gray-300 p-3 text-left"
                      :class="[sharedSettings.fontSize.value]"
                    >
                      Benda Hidup
                    </td>
                    <td class="border-b-2 border-gray-300 p-3 text-center">
                      <button
                        @click="setSelection(image, 'hidup')"
                        class="w-6 h-6 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        :class="[getRadioClass(image, 'hidup')]"
                        :aria-checked="image.selection === 'hidup'"
                        role="radio"
                        aria-label="Pilih sebagai benda hidup"
                        tabindex="0"
                        :data-image-id="image.id"
                        data-tab-index="1"
                      ></button>
                    </td>
                  </tr>
                  <tr>
                    <td class="p-3 text-left" :class="[sharedSettings.fontSize.value]">
                      Benda Bukan Hidup
                    </td>
                    <td class="p-3 text-center">
                      <button
                        @click="setSelection(image, 'bukan_hidup')"
                        class="w-6 h-6 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        :class="[getRadioClass(image, 'bukan_hidup')]"
                        :aria-checked="image.selection === 'bukan_hidup'"
                        role="radio"
                        aria-label="Pilih sebagai benda bukan hidup"
                        tabindex="0"
                        :data-image-id="image.id"
                        data-tab-index="2"
                      ></button>
                    </td>
                  </tr>
                </tbody>
              </table>
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
                Semua jawapan anda betul. Hebat!
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
                Jangan putus asa. Anda hampir berjaya. Jawapan yang betul telah ditandakan dengan
                hijau.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter
        class="flex flex-col sm:flex-row justify-between items-center gap-6 p-8 bg-gray-100 rounded-b-xl"
      >
        <div class="flex flex-col sm:flex-row gap-4 items-center">
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

          <!-- View Mode Toggle -->
          <Button
            @click="toggleViewMode"
            variant="outline"
            class="h-12 px-4"
            :aria-label="showAllItems ? 'Switch to single item view' : 'Switch to grid view'"
          >
            {{ showAllItems ? 'Satu demi Satu' : 'Semua Sekali' }}
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

/* Radio button styles */
button[role='radio'] {
  position: relative;
}

button[role='radio']::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: white;
  opacity: 0;
  transition: opacity 0.2s ease;
}

button[role='radio'][aria-checked='true']::after {
  opacity: 1;
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
  text-align: left;
  font-weight: bold;
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

button[role='radio']:active {
  animation: selectedPulse 0.3s ease;
}
</style>
