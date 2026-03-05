import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'

export const useQuizzesStore = defineStore('quizzes', () => {
  const quizzes = ref([])
  const currentQuiz = ref(null)
  const error = ref(null)
  const isLoading = ref(false)

  // Fetch quiz by unit, activity, and type
  async function fetchQuizByIdentifier(unit, activity, type) {
    isLoading.value = true
    error.value = null

    try {
      console.log(`Fetching quiz: Unit ${unit}, Activity ${activity}, Type ${type}`)

      const response = await api.get('/quizzes', {
        params: {
          quiz_unit: unit,
          no_activity: activity,
          quiz_type: type,
        },
      })

      const quizData = response.data

      if (quizData && quizData.length > 0) {
        currentQuiz.value = quizData[0] // Take the first match
        console.log('Quiz found:', currentQuiz.value)
        return currentQuiz.value
      } else {
        throw new Error('Quiz not found')
      }
    } catch (e) {
      console.error('Failed to fetch quiz:', e)
      error.value = e.message || 'Failed to fetch quiz data'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Fetch quiz by ID
  async function fetchQuizById(quizId) {
    isLoading.value = true
    error.value = null

    try {
      console.log(`Fetching quiz by ID: ${quizId}`)

      const response = await api.get(`/quizzes/${quizId}`)
      const quizData = response.data

      if (quizData) {
        currentQuiz.value = quizData
        console.log('Quiz found:', currentQuiz.value)
        return currentQuiz.value
      } else {
        throw new Error('Quiz not found')
      }
    } catch (e) {
      console.error('Failed to fetch quiz by ID:', e)
      error.value = e.message || 'Failed to fetch quiz data'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Create a new quiz
  async function createQuiz(quizData) {
    isLoading.value = true
    error.value = null

    try {
      console.log('Creating quiz:', quizData)

      const response = await api.post('/quizzes', quizData)
      const newQuiz = response.data

      if (newQuiz) {
        quizzes.value.push(newQuiz)
        currentQuiz.value = newQuiz
        console.log('Quiz created:', newQuiz)
        return newQuiz
      }
    } catch (e) {
      console.error('Failed to create quiz:', e)
      error.value = e.message || 'Failed to create quiz'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // Clear current quiz
  function clearCurrentQuiz() {
    currentQuiz.value = null
    error.value = null
  }

  return {
    quizzes,
    currentQuiz,
    error,
    isLoading,
    fetchQuizByIdentifier,
    fetchQuizById,
    createQuiz,
    clearCurrentQuiz,
  }
})
