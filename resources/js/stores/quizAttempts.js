// Force rebuild: 2023-10-06T12:00:00.000Z
// client/src/stores/quizAttempts.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api' // Assuming you have a centralized API client

// Force cache invalidation with timestamp
const CACHE_BUSTER = new Date().getTime()
// We still need a way to make the API call.
// If you have a generic API client or want to keep API calls in @/lib/api.js, import it here.
// For this example, I'll assume the fetch logic is moved here or called from here.

export const useQuizAttemptsStore = defineStore('quizAttempts', () => {
  const currentAttemptId = ref(null)
  const error = ref(null)
  const isLoading = ref(false)
  async function submitAttempt(quizAttemptData) {
    isLoading.value = true
    error.value = null
    try {
      console.log('Submitting quiz attempt to API:', quizAttemptData)

      // Use Axios for the API call which automatically handles JSON
      const response = await api.post('/quiz-attempts', quizAttemptData)

      // Log the raw response for debugging
      console.log('Raw API response:', response)

      // With Axios, response.data is already parsed JSON
      const responseData = response.data || {}
      console.log('Processed response data:', responseData)

      if (responseData.attempt && responseData.attempt.id) {
        currentAttemptId.value = responseData.attempt.id
        console.log('Updated currentAttemptId to:', currentAttemptId.value)
      }

      // Return the processed data directly
      return responseData
    } catch (e) {
      console.error('Failed to submit quiz attempt via store:', e)
      error.value = e.message || 'An unknown error occurred.'
      throw e // Re-throw to be caught by the component if needed
    } finally {
      isLoading.value = false
    }
  }

  return {
    currentAttemptId,
    error,
    isLoading,
    submitAttempt,
  }
})
