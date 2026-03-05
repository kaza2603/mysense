<script setup>
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'vue-sonner'
import { useVideosStore } from '@/stores/videos'
import { useAuthStore } from '@/stores/auth'
import { useTeachersStore } from '@/stores/teachers'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const youtubeLink = ref('')
const videoTitle = ref('')
const videoDescription = ref('')
const selectedClassId = ref('')
const isLoading = ref(false)
const uploadedVideos = ref([])
const classes = ref([])

const videosStore = useVideosStore()
const authStore = useAuthStore()
const teachersStore = useTeachersStore()

// YouTube link validation
const isValidYouTubeUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
  return pattern.test(url)
}

// Fetch classes assigned to teacher
const fetchTeacherClasses = async () => {
  try {
    isLoading.value = true

    // Use the auth store to get teacher data
    const teacher = authStore.currentTeacher

    if (!teacher || !teacher.school_id) {
      toast.error('Ralat', { description: 'Tiada maklumat guru atau sekolah ditemui' })
      return
    }

    if (!teacher.class_id) {
      toast.error('Ralat', { description: 'Anda tidak mempunyai kelas yang ditetapkan' })
      return
    }

    // Check if we already have class name from the teacher object
    if (teacher.class_name) {
      classes.value = [
        {
          class_id: teacher.class_id,
          class_name: teacher.class_name,
          school_id: teacher.school_id,
        },
      ]
      selectedClassId.value = teacher.class_id
      console.log('Teacher class loaded from auth store:', classes.value)
      return
    }

    // If class name is not available, fetch it from the API
    const classData = await teachersStore.fetchClassById(teacher.class_id)

    if (classData) {
      classes.value = [
        {
          class_id: classData.id,
          class_name: classData.name,
          school_id: classData.school_id,
        },
      ]
      selectedClassId.value = teacher.class_id
      console.log('Teacher class loaded from API:', classes.value)
    } else {
      toast.error('Ralat', { description: 'Gagal mendapatkan maklumat kelas.' })
    }
  } catch (error) {
    console.error('Error fetching class details:', error)
    toast.error('Ralat', { description: 'Gagal mendapatkan maklumat kelas. ' + error.message })
  } finally {
    isLoading.value = false
  }
}

// Fetch existing videos
const loadVideos = async () => {
  isLoading.value = true
  try {
    const videos = await videosStore.fetchVideos()
    if (videos) {
      uploadedVideos.value = videos
    }
  } catch (error) {
    console.error('Error loading videos:', error)
    toast.error('Ralat', { description: 'Gagal mendapatkan senarai video. ' + error.message })
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  // Validate input
  if (!youtubeLink.value.trim()) {
    toast({
      title: 'Ralat',
      description: 'Sila masukkan pautan YouTube yang sah.',
      variant: 'destructive',
    })
    return
  }

  if (!isValidYouTubeUrl(youtubeLink.value)) {
    toast({
      title: 'Ralat',
      description: 'Format pautan YouTube tidak sah. Sila masukkan pautan yang betul.',
      variant: 'destructive',
    })
    return
  }

  if (!videoTitle.value.trim()) {
    toast({
      title: 'Ralat',
      description: 'Sila masukkan tajuk video.',
      variant: 'destructive',
    })
    return
  }

  if (videoTitle.value.length > 100) {
    toast({
      title: 'Ralat',
      description: 'Tajuk video terlalu panjang. Maksimum 100 aksara.',
      variant: 'destructive',
    })
    return
  }

  if (videoDescription.value && videoDescription.value.length > 500) {
    toast({
      title: 'Ralat',
      description: 'Penerangan video terlalu panjang. Maksimum 500 aksara.',
      variant: 'destructive',
    })
    return
  }

  if (!selectedClassId.value) {
    toast({
      title: 'Ralat',
      description: 'Sila pilih kelas untuk video ini.',
      variant: 'destructive',
    })
    return
  }

  isLoading.value = true

  try {
    // Prepare video data
    const videoData = {
      youtube_link: youtubeLink.value,
      title: videoTitle.value,
      description: videoDescription.value,
      class_id: selectedClassId.value,
    }

    // Submit to API
    const newVideo = await videosStore.addVideo(videoData)

    if (newVideo) {
      toast({
        title: 'Berjaya',
        description: `Pautan video "${videoTitle.value}" telah berjaya ditambah.`,
      })

      // Clear form fields
      youtubeLink.value = ''
      videoTitle.value = ''
      videoDescription.value = ''

      // Reload the videos list
      await loadVideos()
    } else {
      toast({
        title: 'Ralat',
        description: videosStore.error || 'Gagal menambah video. Sila cuba lagi.',
        variant: 'destructive',
      })
    }
  } catch (error) {
    console.error('Error submitting video:', error)
    toast({
      title: 'Ralat',
      description: error.message || 'Ralat tidak dijangka. Sila cuba lagi.',
      variant: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}

const removeVideo = async (videoId) => {
  try {
    isLoading.value = true

    // Call the store to delete the video
    const success = await videosStore.deleteVideo(videoId)

    if (success) {
      // Video successfully deleted (the store handles removing from the list)
      toast({
        title: 'Berjaya',
        description: 'Pautan video telah dipadam.',
      })

      // Refresh the video list
      await loadVideos()
    } else {
      toast({
        title: 'Ralat',
        description: videosStore.error || 'Gagal memadam video. Sila cuba lagi.',
        variant: 'destructive',
      })
    }
  } catch (error) {
    console.error('Error deleting video:', error)
    toast({
      title: 'Ralat',
      description: 'Gagal memadam video. ' + (error.message || 'Sila cuba lagi.'),
      variant: 'destructive',
    })
  } finally {
    isLoading.value = false
  }
}

// Extract video ID from YouTube URL for embedding
const getYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

// Initial load
onMounted(async () => {
  await fetchTeacherClasses()
  await loadVideos()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Muat Naik Pautan Video YouTube</h1>

    <Card class="mb-8">
      <CardHeader>
        <CardTitle>Tambah Pautan Video Baru</CardTitle>
        <CardDescription
          >Masukkan pautan URL video YouTube yang ingin dikongsikan dengan pelajar.</CardDescription
        >
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit">
          <div class="grid gap-4">
            <div class="grid gap-2">
              <Label for="youtube-link">Pautan YouTube<span class="text-red-500">*</span></Label>
              <Input
                id="youtube-link"
                v-model="youtubeLink"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
            </div>

            <div class="grid gap-2">
              <Label for="video-title">Tajuk Video<span class="text-red-500">*</span></Label>
              <Input
                id="video-title"
                v-model="videoTitle"
                type="text"
                placeholder="Tajuk Video"
                required
                maxlength="100"
              />
              <p class="text-xs text-gray-500">{{ videoTitle.length }}/100 aksara</p>
            </div>

            <div class="grid gap-2">
              <Label for="video-description">Penerangan Video</Label>
              <Textarea
                id="video-description"
                v-model="videoDescription"
                placeholder="Penerangan tentang video ini..."
                rows="3"
                maxlength="500"
              />
              <p class="text-xs text-gray-500">{{ videoDescription.length }}/500 aksara</p>
            </div>

            <div class="grid gap-2">
              <Label for="class-info">Kelas Anda<span class="text-red-500">*</span></Label>
              <div class="p-2 border rounded-md bg-gray-50">
                {{ classes.length > 0 ? classes[0].class_name : 'Tiada kelas ditetapkan' }}
              </div>
              <input type="hidden" v-model="selectedClassId" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button @click="handleSubmit" :disabled="isLoading">
          <span v-if="isLoading">Memproses...</span>
          <span v-else>Tambah Pautan</span>
        </Button>
      </CardFooter>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Senarai Pautan Dimuat Naik</CardTitle>
        <CardDescription>Pautan video yang akan dipaparkan kepada pelajar.</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="text-center py-4">
          <p class="text-gray-500">Memuat data...</p>
        </div>
        <div v-else-if="uploadedVideos.length === 0" class="text-center text-gray-500 py-4">
          Tiada pautan video dimuat naik lagi.
        </div>
        <ul v-else class="space-y-4">
          <li
            v-for="video in uploadedVideos"
            :key="video.learning_video_id"
            class="p-4 border rounded-md bg-white"
          >
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div class="flex-grow">
                <p class="font-medium text-lg">{{ video.title }}</p>
                <p v-if="video.description" class="text-sm text-gray-600 mb-2">
                  {{ video.description }}
                </p>
                <div class="mb-2">
                  <a
                    :href="video.youtube_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-blue-600 hover:underline break-all"
                    >{{ video.youtube_link }}</a
                  >
                </div>
                <div class="flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>Kelas: {{ video.class_name || 'Tidak ditetapkan' }}</span>
                  <span>• Tarikh: {{ new Date(video.created_at).toLocaleDateString() }}</span>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  @click="removeVideo(video.learning_video_id)"
                >
                  Padam
                </Button>
              </div>
            </div>
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
</template>
