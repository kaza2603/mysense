<script setup>
import { ref, onMounted } from 'vue'
import { useVideosStore } from '@/stores/videos'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import StudentLayout from '@/components/StudentLayout.vue'

const videosStore = useVideosStore()
const authStore = useAuthStore()
const router = useRouter()

const videos = ref([])
const isLoading = ref(false)

// Extract video ID from YouTube URL for embedding
const getYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

// Format date to local format
const formatDate = (dateString) => {
  if (!dateString) return 'Tiada tarikh'

  return new Date(dateString).toLocaleDateString('ms-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Helper function to redirect to login
const relogin = () => {
  authStore.logoutStudent()
  router.push('/student-login')
  toast.info('Sila log masuk semula')
}

// Check if we need to refresh the auth token
const checkAndRefreshAuthToken = async () => {
  // If there's an error and it might be due to an invalid token
  if (videosStore.error && videosStore.error.includes('authentication')) {
    // Clear token refresh attempt flag
    localStorage.removeItem('tokenRefreshAttempted')

    // Get current student data
    const currentStudent = authStore.currentStudent
    if (!currentStudent) {
      console.error('No authenticated student found')
      return false
    }

    // Get credentials from localStorage
    const email = currentStudent.student_email || currentStudent.email
    const tempStoredCreds = localStorage.getItem('tempCredentials')

    if (email && tempStoredCreds) {
      try {
        // Try to parse stored credentials
        const creds = JSON.parse(tempStoredCreds)
        if (creds && creds.password) {
          console.log('Attempting to refresh token using stored credentials')
          // Try to login again to refresh the token
          await authStore.loginStudent(email, creds.password)
          return true
        }
      } catch (e) {
        console.error('Error parsing stored credentials:', e)
      }
    }
  }
  return false
}

// Load videos
const loadVideos = async () => {
  isLoading.value = true

  try {
    // Check authentication status first
    if (!authStore.isStudentAuthenticated) {
      console.error('Student is not authenticated')
      toast.error('Ralat Autentikasi', {
        description: 'Anda perlu log masuk dahulu.',
      })
      isLoading.value = false
      return
    }

    console.log('Student auth data:', {
      isAuth: authStore.isStudentAuthenticated,
      student: authStore.currentStudent,
    })

    // Try to fetch videos
    const fetchedVideos = await videosStore.fetchVideos()

    if (fetchedVideos) {
      videos.value = fetchedVideos
    } else {
      // If token issue, try to refresh and retry once
      if (await checkAndRefreshAuthToken()) {
        console.log('Retrying with refreshed token')
        const retryVideos = await videosStore.fetchVideos()
        if (retryVideos) {
          videos.value = retryVideos
          return
        }
      }

      toast.error('Ralat', {
        description: videosStore.error || 'Gagal mendapatkan senarai video pembelajaran.',
      })
    }
  } catch (error) {
    console.error('Error loading videos:', error)
    toast.error('Ralat', {
      description: 'Gagal mendapatkan senarai video. ' + error.message,
    })
  } finally {
    isLoading.value = false
  }
}

// Load videos when the component is mounted
onMounted(async () => {
  await loadVideos()
})
</script>

<template>
  <StudentLayout>
    <div class="container mx-auto px-4 py-8">
      <!-- Page Header with Back Button -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" @click="router.back()">
            <ArrowLeft class="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
        <h1 class="text-3xl font-bold tracking-tight">Video Pembelajaran</h1>
        <p class="mt-2 text-muted-foreground">
          Tonton video pembelajaran interaktif untuk meningkatkan kemahiran anda.
        </p>
      </div>

      <div v-if="isLoading" class="flex justify-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
        ></div>
      </div>
      <div v-else-if="videos.length === 0" class="text-center py-12">
        <div v-if="videosStore.error" class="text-red-500 mb-4">
          <p class="text-lg font-semibold">{{ videosStore.error }}</p>
          <p class="text-gray-600 mt-2">Sila cuba lagi atau log masuk semula.</p>
          <div class="mt-4">
            <button
              @click="loadVideos"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              Cuba Lagi
            </button>
            <button
              @click="relogin"
              class="ml-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
            >
              Log Masuk Semula
            </button>
          </div>
        </div>
        <p v-else class="text-gray-500 text-lg">Tiada video pembelajaran pada masa ini.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card v-for="video in videos" :key="video.learning_video_id" class="overflow-hidden">
          <div v-if="getYouTubeVideoId(video.youtube_link)" class="aspect-video bg-gray-100">
            <iframe
              class="w-full h-full"
              :src="`https://www.youtube.com/embed/${getYouTubeVideoId(video.youtube_link)}`"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            >
            </iframe>
          </div>

          <CardHeader>
            <CardTitle class="truncate">{{ video.title }}</CardTitle>
            <CardDescription v-if="video.teacher_name">
              Guru: {{ video.teacher_name }}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p v-if="video.description" class="text-sm text-gray-600 mb-3 line-clamp-3">
              {{ video.description }}
            </p>

            <div class="flex flex-wrap gap-2 text-xs text-gray-500">
              <span>Kelas: {{ video.class_name || 'Tidak ditetapkan' }}</span>
              <span>• {{ formatDate(video.created_at) }}</span>
            </div>

            <a
              :href="video.youtube_link"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-3 inline-flex text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Buka di YouTube
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  </StudentLayout>
</template>
