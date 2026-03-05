<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue' // Import onUnmounted and computed
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import VuePdfEmbed from 'vue-pdf-embed'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, ArrowLeft } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { useRouter } from 'vue-router'

const router = useRouter()
const pdfUrl = ref(
  'https://mietjppkaxrngwuimckz.supabase.co/storage/v1/object/sign/istimewaku/sains4.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV83YmY1M2YzZi1iZDgzLTQwMWMtYTc3Ny04NWY5ZWFjNmIwM2MiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpc3RpbWV3YWt1L3NhaW5zNC5wZGYiLCJpYXQiOjE3NjY0MDQ3MTQsImV4cCI6MTc5Nzk0MDcxNH0.blaKVS1kJ-OUA5WQ4aUPCDYa_pUUAU1b5kZYFt3Pi2Q'
)
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1)
const rotation = ref(0)
const searchPage = ref(null)
const elapsedTime = ref(0) // Time in seconds
let timerInterval = null

const goToDashboard = () => {
  router.push({ name: 'student-dashboard' })
}

const handleDocumentRender = (pdfProxy) => {
  totalPages.value = pdfProxy.numPages
  console.log('PDF loaded. Total pages:', totalPages.value) // Add log to check total pages
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const zoomIn = () => {
  if (scale.value < 2) {
    scale.value += 0.1
  }
}

const zoomOut = () => {
  if (scale.value > 0.5) {
    scale.value -= 0.1
  }
}

const rotate = () => {
  rotation.value = (rotation.value + 90) % 360
}

const goToPage = () => {
  console.log(
    'goToPage triggered. searchPage value:',
    searchPage.value,
    'Type:',
    typeof searchPage.value,
  ) // Log value and type
  const pageNum = parseInt(searchPage.value, 10)
  console.log('Parsed pageNum:', pageNum) // Log parsed value

  if (isNaN(pageNum)) {
    alert('Please enter a valid number.')
    searchPage.value = '' // Clear input
    return
  }

  // Ensure totalPages is loaded before checking the range
  if (totalPages.value === 0) {
    alert('PDF metadata still loading. Please wait a moment and try again.')
    searchPage.value = '' // Clear input
    return
  }

  if (pageNum >= 1 && pageNum <= totalPages.value) {
    currentPage.value = pageNum
  } else {
    // More specific alert
    alert(
      `Invalid page number. Please enter a value between 1 and ${totalPages.value}. You entered: ${pageNum}`,
    )
  }
  searchPage.value = '' // Clear the input field
}

// Computed property to format time
const formattedTime = computed(() => {
  const totalSeconds = elapsedTime.value
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const paddedHours = String(hours).padStart(2, '0')
  const paddedMinutes = String(minutes).padStart(2, '0')
  const paddedSeconds = String(seconds).padStart(2, '0')

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`
})

onMounted(() => {
  // Start the timer when the component mounts
  timerInterval = setInterval(() => {
    elapsedTime.value++
  }, 1000)
})

onUnmounted(() => {
  // Clear the timer when the component unmounts
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  // Here you could potentially send the final elapsedTime.value to your backend
  console.log(`Time spent: ${elapsedTime.value} seconds`)
})
</script>

<template>
  <div class="container mx-auto px-4 py-8 relative">
    <Button variant="outline" size="sm" @click="goToDashboard" class="absolute top-4 left-4 z-10">
      <ArrowLeft class="h-4 w-4 mr-2" />
      Kembali
    </Button>
    <!-- Added relative positioning -->
    <!-- Timer Display -->
    <div class="absolute top-4 right-4 bg-gray-100 dark:bg-gray-800 p-2 rounded shadow z-10">
      <span class="font-mono text-sm">Masa: {{ formattedTime }}</span>
    </div>

    <Card class="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle class="text-2xl font-bold">Buku Teks Digital</CardTitle>
        <CardDescription>Sains Tahun 4 Pendidikan Khas</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col items-center">
          <!-- Controls -->
          <div class="flex items-center gap-2 mb-4 flex-wrap justify-center">
            <Button
              variant="outline"
              size="icon"
              @click="previousPage"
              :disabled="currentPage === 1"
            >
              <ChevronLeft class="h-4 w-4" />
            </Button>
            <span class="text-sm mx-2">Halaman {{ currentPage }} / {{ totalPages }}</span>
            <Button
              variant="outline"
              size="icon"
              @click="nextPage"
              :disabled="currentPage === totalPages"
            >
              <ChevronRight class="h-4 w-4" />
            </Button>
            <div class="border-l h-6 mx-2"></div>
            <!-- Page Search Input -->
            <div class="flex items-center gap-1">
              <Input
                type="number"
                v-model="searchPage"
                placeholder="Pergi ke Halaman"
                class="w-28 h-9 text-sm"
                min="1"
                :max="totalPages"
                @keyup.enter="goToPage"
              />
              <Button variant="outline" size="sm" @click="goToPage" class="h-9">Pergi</Button>
            </div>
            <div class="border-l h-6 mx-2"></div>
            <!-- Zoom and Rotate Controls -->
            <Button variant="outline" size="icon" @click="zoomIn">
              <ZoomIn class="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" @click="zoomOut">
              <ZoomOut class="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" @click="rotate">
              <RotateCw class="h-4 w-4" />
            </Button>
          </div>

          <!-- PDF Viewer -->
          <div class="w-full overflow-auto border rounded-lg">
            <div
              :style="{ transform: `scale(${scale}) rotate(${rotation}deg)` }"
              class="transition-transform duration-200 origin-center"
            >
              <VuePdfEmbed
                :source="pdfUrl"
                :page="currentPage"
                @loaded="handleDocumentRender"
                class="mx-auto"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.container {
  min-height: calc(100vh - 4rem);
}

.origin-center {
  transform-origin: center center;
}
</style>
