<script setup>
import { ref, onMounted, provide } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Home, Grid, Type, TextCursorInput, Settings } from 'lucide-vue-next'

const router = useRouter()
const showTooltips = ref(false)
const showAccessibilityMenu = ref(false)
const dyslexiaMode = ref(false)
const fontSize = ref('text-base')
const highContrast = ref(false)

// Provide accessibility settings to child components
provide('accessibilitySettings', {
  dyslexiaMode,
  fontSize,
  highContrast,
})

// Function to go back
const goBack = () => {
  router.back()
}

// Function to return to the quiz index
const goToIndex = () => {
  router.push('/kuiz')
}

// Function to return to the student dashboard
const goToDashboard = () => {
  router.push('/student/dashboard')
}

// Toggle dyslexia mode
const toggleDyslexiaMode = () => {
  dyslexiaMode.value = !dyslexiaMode.value
}

// Toggle high contrast
const toggleHighContrast = () => {
  highContrast.value = !highContrast.value
}

// Increase font size
const increaseFontSize = () => {
  const sizes = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl']
  const currentIndex = sizes.indexOf(fontSize.value)
  if (currentIndex < sizes.length - 1) {
    fontSize.value = sizes[currentIndex + 1]
  }
}

// Decrease font size
const decreaseFontSize = () => {
  const sizes = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl']
  const currentIndex = sizes.indexOf(fontSize.value)
  if (currentIndex > 0) {
    fontSize.value = sizes[currentIndex - 1]
  }
}

// Toggle accessibility menu
const toggleAccessibilityMenu = () => {
  showAccessibilityMenu.value = !showAccessibilityMenu.value
}

// Set up tooltips
onMounted(() => {
  setTimeout(() => {
    showTooltips.value = true
  }, 1000)

  setTimeout(() => {
    showTooltips.value = false
  }, 5000)
})
</script>

<template>
  <div
    class="bg-gradient-to-br from-indigo-200 via-purple-100 to-teal-100 w-full fixed inset-0 overflow-auto"
    :class="[fontSize, { 'dyslexia-friendly': dyslexiaMode }, { 'high-contrast': highContrast }]"
  >
    <!-- Navigation buttons -->
    <header
      class="fixed top-0 left-0 right-0 bg-white/20 backdrop-blur-md shadow-sm px-4 py-2 z-50"
      role="banner"
      aria-label="Navigasi kuiz"
    >
      <div class="container mx-auto flex justify-between items-center">
        <nav class="flex gap-2" role="navigation" aria-label="Navigasi utama">
          <Button
            variant="secondary"
            size="sm"
            @click="goBack"
            class="h-10 w-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm hover:bg-white shadow-md relative"
            title="Kembali"
            aria-label="Kembali ke halaman sebelumnya"
          >
            <ChevronLeft class="w-5 h-5" aria-hidden="true" />
            <div
              v-if="showTooltips"
              class="absolute top-full mt-2 bg-white px-3 py-1 rounded-md shadow-md text-xs whitespace-nowrap"
              role="tooltip"
            >
              Kembali
            </div>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            @click="goToIndex"
            class="h-10 w-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm hover:bg-white shadow-md relative"
            title="Index Kuiz"
            aria-label="Pergi ke index kuiz"
          >
            <Grid class="w-5 h-5" aria-hidden="true" />
            <div
              v-if="showTooltips"
              class="absolute top-full mt-2 bg-white px-3 py-1 rounded-md shadow-md text-xs whitespace-nowrap"
              role="tooltip"
            >
              Index Kuiz
            </div>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            @click="goToDashboard"
            class="h-10 w-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm hover:bg-white shadow-md relative"
            title="Dashboard"
            aria-label="Pergi ke dashboard pelajar"
          >
            <Home class="w-5 h-5" aria-hidden="true" />
            <div
              v-if="showTooltips"
              class="absolute top-full mt-2 bg-white px-3 py-1 rounded-md shadow-md text-xs whitespace-nowrap"
              role="tooltip"
            >
              Dashboard
            </div>
          </Button>
        </nav>

        <div class="flex gap-2" role="toolbar" aria-label="Tetapan aksesibiliti">
          <!-- Accessibility Menu Toggle -->
          <Button
            variant="secondary"
            size="sm"
            @click="toggleAccessibilityMenu"
            class="h-10 w-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm hover:bg-white shadow-md relative"
            :class="{ 'bg-indigo-100': showAccessibilityMenu }"
            title="Tetapan Aksesibiliti"
            aria-label="Tetapan Aksesibiliti"
            :aria-expanded="showAccessibilityMenu"
            aria-haspopup="true"
          >
            <Settings class="w-5 h-5" aria-hidden="true" />
            <div
              v-if="showTooltips"
              class="absolute top-full mt-2 bg-white px-3 py-1 rounded-md shadow-md text-xs whitespace-nowrap"
              role="tooltip"
            >
              Tetapan Aksesibiliti
            </div>
          </Button>
        </div>
      </div>
    </header>

    <!-- Accessibility Menu (Fixed position) -->
    <div
      v-if="showAccessibilityMenu"
      class="fixed right-4 top-16 z-50 bg-white/90 backdrop-blur-md p-4 rounded-lg shadow-lg"
      style="width: 280px"
      role="dialog"
      aria-labelledby="accessibility-menu-title"
      aria-modal="false"
    >
      <div class="flex justify-between items-center mb-3">
        <h3 id="accessibility-menu-title" class="font-semibold" role="heading" aria-level="2">
          Tetapan Aksesibiliti
        </h3>
        <Button
          variant="ghost"
          size="sm"
          @click="toggleAccessibilityMenu"
          class="h-8 w-8 rounded-full"
          aria-label="Tutup menu aksesibiliti"
        >
          &times;
        </Button>
      </div>

      <div class="space-y-4" role="group" aria-labelledby="accessibility-menu-title">
        <!-- Font Size Controls -->
        <fieldset class="flex flex-col gap-2">
          <legend class="text-sm font-medium">Saiz Teks</legend>
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              @click="decreaseFontSize"
              class="flex-1"
              aria-label="Kurangkan saiz teks"
            >
              <TextCursorInput class="w-4 h-4 mr-1" aria-hidden="true" /> A-
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="increaseFontSize"
              class="flex-1"
              aria-label="Tambah saiz teks"
            >
              <Type class="w-4 h-4 mr-1" aria-hidden="true" /> A+
            </Button>
          </div>
        </fieldset>

        <!-- Dyslexia Mode Toggle -->
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium">Mod Disleksia</label>
          <Button
            variant="outline"
            size="sm"
            @click="toggleDyslexiaMode"
            :class="{ 'bg-green-100 border-green-300': dyslexiaMode }"
            aria-label="Togol mod disleksia"
          >
            {{ dyslexiaMode ? 'Aktif' : 'Tidak Aktif' }}
          </Button>
        </div>

        <!-- High Contrast Toggle -->
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium">Kontras Tinggi</label>
          <Button
            variant="outline"
            size="sm"
            @click="toggleHighContrast"
            :class="{ 'bg-green-100 border-green-300': highContrast }"
            aria-label="Togol mod kontras tinggi"
          >
            {{ highContrast ? 'Aktif' : 'Tidak Aktif' }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Main content with padding for the header -->
    <main class="min-h-screen w-full pt-16 pb-8 px-4" role="main">
      <div class="container mx-auto max-w-7xl">
        <RouterView />
      </div>
    </main>

    <!-- Footer -->
    <footer
      class="bg-white/20 backdrop-blur-md py-3 px-4 text-center text-gray-600 text-sm"
      role="contentinfo"
    >
      <div class="container mx-auto">
        <p>Istimewa.Ku © 2025 - Kuiz Interaktif</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Set the gradient background to take up the full screen */
.bg-gradient-to-br {
  background-attachment: fixed;
  background-size: cover;
}

/* Add a soft animation for the tooltips */
div[v-if='showTooltips'] {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dyslexia-friendly font setting */
.dyslexia-friendly {
  font-family: 'Comic Sans MS', 'Comic Sans', cursive;
  letter-spacing: 0.05em;
  word-spacing: 0.1em;
  line-height: 1.5;
}

/* High contrast mode */
.high-contrast {
  filter: contrast(1.4);
}

.high-contrast button,
.high-contrast a {
  border: 2px solid currentColor;
}

/* Accessibility menu animation */
div[v-if='showAccessibilityMenu'] {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
