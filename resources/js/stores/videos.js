// client/src/stores/videos.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'
import { useAuthStore } from './auth'

export const useVideosStore = defineStore('videos', () => {
  const videos = ref([])
  const loading = ref(false)
  const error = ref(null)
  const authStore = useAuthStore()
  // Helper function to get authorization headers
  const getAuthHeader = () => {
    let token
    let userRole

    if (authStore.isTeacherAuthenticated && authStore.currentTeacher) {
      // Check for token in different possible fields for teachers
      token =
        authStore.currentTeacher.token ||
        authStore.currentTeacher.access_token ||
        authStore.currentTeacher.accessToken
      userRole = 'teacher'

      // Debug teacher authentication
      console.log('Teacher authentication data:', {
        isAuth: authStore.isTeacherAuthenticated,
        teacher: {
          id: authStore.currentTeacher.teacher_id,
          email: authStore.currentTeacher.teacher_email,
          hasToken: !!token,
          tokenType: token ? typeof token : 'undefined',
        },
      })

      // Log the actual token (first few characters only for security)
      if (token) {
        console.log('Found token:', token.substring(0, 10) + '...')
      } else {
        console.warn('No token found in teacher data')
      }

      // If we still don't have a token, try to find it in nested objects
      if (!token && typeof authStore.currentTeacher === 'object') {
        // Look for any property that might contain a token
        Object.keys(authStore.currentTeacher).forEach((key) => {
          const value = authStore.currentTeacher[key]
          if (
            !token &&
            typeof value === 'string' &&
            (key.includes('token') ||
              key.includes('Token') ||
              (value.length > 20 && value.includes('.')))
          ) {
            console.log(`Found potential token in field: ${key}`)
            token = value
          }
        })
      }
    } else if (authStore.isStudentAuthenticated && authStore.currentStudent) {
      // Check all possible token field names (different backends might use different field names)
      token =
        authStore.currentStudent.token ||
        authStore.currentStudent.access_token ||
        authStore.currentStudent.accessToken

      userRole = 'student'

      // Debug student authentication
      console.log('Student authentication data:', {
        isAuth: authStore.isStudentAuthenticated,
        student: authStore.currentStudent,
        hasToken: !!token,
      })

      // If we still don't have a token, try to find it in nested objects
      if (!token && typeof authStore.currentStudent === 'object') {
        // Look for any property that might contain a token
        Object.keys(authStore.currentStudent).forEach((key) => {
          const value = authStore.currentStudent[key]
          if (
            !token &&
            typeof value === 'string' &&
            (key.includes('token') ||
              key.includes('Token') ||
              (value.length > 20 && value.includes('.')))
          ) {
            console.log(`Found potential token in field: ${key}`)
            token = value
          }
        })
      }
    } else {
      console.error('No authenticated user found')
      return { headers: {} }
    }
    if (!token) {
      console.error(`No token found for ${userRole}. This will likely cause authentication errors.`)

      // Force token refresh by redirecting to login if this is a fresh load
      if (!localStorage.getItem('tokenRefreshAttempted')) {
        localStorage.setItem('tokenRefreshAttempted', 'true')
        console.log('Will attempt to refresh token')
        // The user will need to manually refresh at this point
      }

      return { headers: {} }
    }

    console.log(`Setting headers for ${userRole} with token`)
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        role: userRole,
      },
    }
  } // End of getAuthHeader function
  const fetchVideos = async () => {
    loading.value = true
    error.value = null

    try {
      // Get auth headers and check for issues
      const authHeader = getAuthHeader()

      // Extract headers from the auth header object
      const headers = authHeader.headers || {}

      if (!headers || !headers.Authorization) {
        console.error('Missing authentication token')
        error.value = 'Missing authentication token. Please log in again.'
        return null
      }

      console.log('Sending request to fetch videos with headers:', {
        auth: headers.Authorization ? 'Bearer token present' : 'No token',
        role: headers.role,
      })

      const response = await api.get('/videos', { headers })
      videos.value = response.data
      return response.data
    } catch (err) {
      console.error('Error fetching videos:', err)
      // Log detailed error information
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error data:', err.response.data)
        console.error('Response status:', err.response.status)
        console.error('Response headers:', err.response.headers)

        if (err.response.status === 401) {
          error.value = 'Sesi anda telah tamat. Sila log masuk semula.'
          // Potentially handle logout or redirect to login here
        } else {
          error.value = err.response.data?.message || 'Failed to fetch videos'
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request)
        error.value = 'Server tidak bertindak balas. Sila cuba lagi sebentar.'
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', err.message)
        error.value = 'Failed to fetch videos'
      }
      return null
    } finally {
      loading.value = false
    }
  } // Add a new video (teacher only)
  const addVideo = async (videoData) => {
    if (!authStore.isTeacherAuthenticated) {
      error.value = 'Only teachers can add videos'
      return null
    }

    loading.value = true
    error.value = null

    try {
      // Get the auth header object
      const authHeader = getAuthHeader()

      // Extract headers from the auth header object
      const headers = authHeader.headers || {}

      // Log the headers being sent to help with debugging
      console.log(
        'Sending video with authorization headers:',
        headers.Authorization ? 'Bearer token present' : 'No authorization headers',
        'Role:',
        headers.role || 'undefined',
      )

      // Pass the headers directly in the config object
      const response = await api.post('/videos', videoData, { headers })

      // Update the videos list with the new video
      videos.value = [response.data, ...videos.value]
      return response.data
    } catch (err) {
      console.error('Error adding video:', err)
      error.value = err.response?.data?.message || 'Failed to add video'
      return null
    } finally {
      loading.value = false
    }
  } // Update an existing video (teacher only)
  const updateVideo = async (videoId, videoData) => {
    if (!authStore.isTeacherAuthenticated) {
      error.value = 'Only teachers can update videos'
      return null
    }

    loading.value = true
    error.value = null

    try {
      // Get the auth header object
      const authHeader = getAuthHeader()

      // Extract headers from the auth header object
      const headers = authHeader.headers || {}

      // Log the headers being sent to help with debugging
      console.log(
        'Updating video with authorization headers:',
        headers.Authorization ? 'Bearer token present' : 'No authorization headers',
      )

      // Pass the headers directly in the config object
      const response = await api.put(`/videos/${videoId}`, videoData, { headers })

      // Update the video in the list
      const index = videos.value.findIndex((v) => v.learning_video_id === videoId)
      if (index !== -1) {
        videos.value[index] = response.data
      }

      return response.data
    } catch (err) {
      console.error('Error updating video:', err)
      error.value = err.response?.data?.message || 'Failed to update video'
      return null
    } finally {
      loading.value = false
    }
  } // Delete a video (teacher only)
  const deleteVideo = async (videoId) => {
    if (!authStore.isTeacherAuthenticated) {
      error.value = 'Only teachers can delete videos'
      return false
    }

    loading.value = true
    error.value = null

    try {
      // Get the auth header object
      const authHeader = getAuthHeader()

      // Extract headers from the auth header object
      const headers = authHeader.headers || {}

      // Log the headers being sent to help with debugging
      console.log(
        'Deleting video with authorization headers:',
        headers.Authorization ? 'Bearer token present' : 'No authorization headers',
      )

      // Pass the headers directly in the config object
      await api.delete(`/videos/${videoId}`, { headers })

      // Remove the video from the list
      const index = videos.value.findIndex((v) => v.learning_video_id === videoId)
      if (index !== -1) {
        videos.value.splice(index, 1)
      }

      return true
    } catch (err) {
      console.error('Error deleting video:', err)
      error.value = err.response?.data?.message || 'Failed to delete video'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    videos,
    loading,
    error,
    fetchVideos,
    addVideo,
    updateVideo,
    deleteVideo,
  }
})
