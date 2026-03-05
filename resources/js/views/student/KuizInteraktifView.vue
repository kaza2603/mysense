<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Book, Award, CheckCircle, Clock, BookOpen } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import StudentLayout from '@/components/StudentLayout.vue'

const router = useRouter()
const auth = useAuthStore()
const selectedUnit = ref(null)
const showUnitDialog = ref(false)

// Quiz unit data
const quizUnits = ref([
  {
    id: 1,
    title: 'Benda Hidup dan Benda Bukan Hidup',
    description: 'Mempelajari ciri-ciri benda hidup dan benda bukan hidup',
    progress: 75,
    available: true,
    icon: Book,
    color: 'bg-blue-100 text-blue-600',
    topics: ['Kenali Saya', 'Benda di Persekitaran', 'Yang Mana Satu?', 'Mari Mengelas'],
  },
  {
    id: 2,
    title: 'Manusia',
    description: 'Mengenali bahagian tubuh manusia dan fungsinya',
    progress: 0,
    available: true,
    icon: Book,
    color: 'bg-purple-100 text-purple-600',
    topics: ['Kenali Organ Deria Manusia', 'Label Organ Deria Manusia'],
  },
  {
    id: 3,
    title: 'Haiwan',
    description: 'Mempelajari ciri-ciri haiwan dan habitatnya',
    progress: 40,
    available: true,
    icon: Book,
    color: 'bg-green-100 text-green-600',
    topics: ['Merduhnya Suaraku', 'Pergerakanku'],
  },
  {
    id: 4,
    title: 'Tumbuhan',
    description: 'Mengenali bahagian tumbuhan dan fungsinya',
    progress: 0,
    available: true,
    icon: Book,
    color: 'bg-yellow-100 text-yellow-600',
    topics: ['Pokok Apakah Saya?', 'Bahagian Tubuhku'],
  },
  {
    id: 5,
    title: 'Cahaya',
    description: 'Mempelajari tentang sifat cahaya dan aplikasinya',
    progress: 0,
    available: true,
    icon: Book,
    color: 'bg-orange-100 text-orange-600',
    topics: ['Cahaya, Oh Cahaya!', 'Kepentingan Cahaya'],
  },
  {
    id: 6,
    title: 'Air',
    description: 'Mengenali sifat air dan kepentingannya',
    progress: 0,
    available: true,
    icon: Book,
    color: 'bg-blue-100 text-blue-600',
    topics: ['Sumber Air Kita'],
  },
  {
    id: 7,
    title: 'Bentuk Muka Bumi',
    description: 'Mempelajari tentang jenis-jenis bentuk muka bumi',
    progress: 0,
    available: true,
    icon: Book,
    color: 'bg-indigo-100 text-indigo-600',
    topics: [],
  },
  {
    id: 8,
    title: 'Bencana Alam',
    description: 'Mengenali jenis-jenis bencana alam dan kesannya',
    progress: 0,
    available: true,
    icon: Book,
    color: 'bg-red-100 text-red-600',
    topics: [],
  },
  {
    id: 9,
    title: 'Kitar Semula',
    description: 'Mempelajari tentang proses kitar semula dan kepentingannya',
    progress: 0,
    available: true,
    icon: Book,
    color: 'bg-green-100 text-green-600',
    topics: [],
  },
  {
    id: 10,
    title: 'Kenali Malaysia',
    description: 'Mempelajari tentang negara Malaysia',
    progress: 0,
    available: true,
    icon: Book,
    color: 'bg-blue-100 text-blue-600',
    topics: [],
  },
  {
    id: 11,
    title: 'Masyarakat Di Malaysia',
    description: 'Mengenali kepelbagaian masyarakat di Malaysia',
    progress: 0,
    available: true,
    icon: Book,
    color: 'bg-purple-100 text-purple-600',
    topics: [],
  },
  {
    id: 12,
    title: 'Kemahiran Sosial Di Tempat Awam',
    description: 'Mempelajari kemahiran sosial di tempat awam',
    progress: 0,
    available: true,
    icon: Book,
    color: 'bg-teal-100 text-teal-600',
    topics: [],
  },
])

// Function to show unit details and topics
const showUnitDetails = (unit) => {
  selectedUnit.value = unit
  showUnitDialog.value = true
} // Function to navigate to a specific unit quiz
const startUnitQuiz = (unitId, topicIndex = null) => {
  console.log(`Starting Unit ${unitId} quiz, Topic Index: ${topicIndex}`)

  // Find the current unit to determine progress
  const currentUnit = quizUnits.value.find((unit) => unit.id === unitId)

  // If continuing learning (progress > 0), try to resume from where left off
  if (currentUnit && currentUnit.progress > 0 && topicIndex === null) {
    // Calculate which topic to resume based on progress
    const totalTopics = currentUnit.topics.length
    const completedTopics = Math.floor((currentUnit.progress / 100) * totalTopics)
    topicIndex = Math.min(completedTopics, totalTopics - 1)
  }

  // Handle specific unit and topic combinations
  if (unitId === 1 && (topicIndex === 0 || topicIndex === null)) {
    // Kenali Saya - first topic of Unit 1
    router.push('/kuiz/kenali-saya')
    return
  } else if (unitId === 1 && topicIndex === 1) {
    // Benda di Persekitaran - second topic of Unit 1
    router.push('/kuiz/benda-hidup')
    return
  } else if (unitId === 1 && topicIndex === 2) {
    // Yang Mana Satu? - third topic of Unit 1
    router.push('/kuiz/yang-mana-satu')
    return
  } else if (unitId === 1 && topicIndex === 3) {
    // Mari Mengelas - fourth topic of Unit 1
    router.push('/kuiz/mari-mengelas')
    return
  } else if (unitId === 2 && (topicIndex === 0 || topicIndex === null)) {
    // Kenali Organ Deria Manusia - first topic of Unit 2
    router.push('/kuiz/deria-organ')
    return
  } else if (unitId === 2 && topicIndex === 1) {
    // Label Organ Deria Manusia - second topic of Unit 2
    router.push('/kuiz/deria-organ-label')
    return
  } else if (unitId === 3 && (topicIndex === 0 || topicIndex === null)) {
    // Merdunya Suaraku - first topic of Unit 3
    router.push('/kuiz/merdunya-suaraku')
    return
  } else if (unitId === 3 && topicIndex === 1) {
    // Pergerakanku - second topic of Unit 3
    router.push('/kuiz/pergerakanku')
    return
  } else if (unitId === 4 && (topicIndex === 0 || topicIndex === null)) {
    // Pokok Apakah Saya? - first topic of Unit 4
    router.push('/kuiz/pokok-apakah-saya')
    return
  } else if (unitId === 4 && topicIndex === 1) {
    // Bahagian Tubuhku - second topic of Unit 4
    router.push('/kuiz/bahagian-tubuhku')
    return
  } else if (unitId === 5 && (topicIndex === 0 || topicIndex === null)) {
    // Cahaya, Oh Cahaya! - first topic of Unit 5
    router.push('/kuiz/cahaya-oh-cahaya')
    return
  } else if (unitId === 5 && topicIndex === 1) {
    // Kepentingan Cahaya - second topic of Unit 5
    router.push('/kuiz/kepentingan-cahaya')
    return
  } else if (unitId === 6 && (topicIndex === 0 || topicIndex === null)) {
    // Sumber Air Kita - first topic of Unit 6
    router.push('/kuiz/sumber-air-kita')
    return
  }

  // For other quizzes, show an alert that they are not implemented yet
  alert(
    `Unit ${unitId} - ${currentUnit ? currentUnit.topics[topicIndex || 0] : 'Kuiz'} belum tersedia. Sila cuba lagi nanti.`,
  )
}

// Check if student is authenticated
const isStudentAuthenticated = computed(() => auth.isStudentAuthenticated)

// Student info for the header
const student = computed(() => {
  if (auth.currentStudent) {
    return {
      name: auth.currentStudent.name || auth.currentStudent.student_name || '-',
      class: auth.currentStudent.class || '3 Cemerlang',
      school: auth.currentStudent.school || auth.currentStudent.school_name || '-',
    }
  }
  return {
    name: 'Nama Pelajar',
    class: 'Kelas',
    school: 'Sekolah',
  }
})
</script>

<template>
  <StudentLayout>
    <div class="container px-4 py-8 mx-auto">
      <!-- Page Header with Navigation Buttons -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" @click="router.push('/student/dashboard')">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="mr-1"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Kembali
          </Button>

          <!-- Quiz Navigation Options -->
          <div class="flex gap-2">
            <Button
              variant="outline"
              class="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              @click="router.push('/student/kuiz-index')"
            >
              <BookOpen class="mr-2 h-4 w-4" />
              Lihat Mengikut Topik
            </Button>
          </div>
        </div>

        <div
          class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100"
        >
          <h1
            class="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Kuiz Interaktif
          </h1>
          <p class="mt-2 text-gray-600">
            Pilih unit untuk menjawab kuiz interaktif dan tingkatkan kemahiran anda.
          </p>

          <!-- Quick Info Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div class="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
              <div class="flex items-center">
                <div class="bg-blue-100 rounded-full p-2 mr-3">
                  <Book class="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p class="font-medium text-gray-800">Pembelajaran Berunit</p>
                  <p class="text-sm text-gray-600">Kuiz tersusun mengikut unit pembelajaran</p>
                </div>
              </div>
            </div>
            <div class="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
              <div class="flex items-center">
                <div class="bg-purple-100 rounded-full p-2 mr-3">
                  <BookOpen class="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p class="font-medium text-gray-800">Pembelajaran Bertopik</p>
                  <p class="text-sm text-gray-600">Kuiz dikategorikan mengikut topik khusus</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Unit Grid -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-800">Unit Pembelajaran</h2>
          <span class="text-sm text-gray-500">{{ quizUnits.length }} unit tersedia</span>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="unit in quizUnits"
          :key="unit.id"
          :class="[
            'transition-all duration-300 hover:shadow-xl border-0 bg-white/70 backdrop-blur-sm transform hover:-translate-y-1',
            unit.available ? 'cursor-pointer hover:bg-white/90' : 'opacity-75',
          ]"
          @click="unit.available && showUnitDetails(unit)"
        >
          <CardHeader class="border-b border-gray-100">
            <div class="flex items-center justify-between">
              <div :class="['p-3 rounded-xl shadow-sm', unit.color]">
                <component :is="unit.icon" class="w-6 h-6" />
              </div>
              <span
                class="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-100"
                >Unit {{ unit.id }}</span
              >
            </div>
            <CardTitle class="mt-4 text-gray-800">{{ unit.title }}</CardTitle>
            <CardDescription class="text-gray-600">{{ unit.description }}</CardDescription>
          </CardHeader>
          <CardContent class="py-4">
            <div
              class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100"
            >
              <div class="flex items-center text-sm">
                <BookOpen class="h-4 w-4 text-blue-600 mr-2" />
                <span class="text-blue-700 font-medium"
                  >{{ unit.topics.length }} topik pembelajaran</span
                >
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              class="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-md"
              :disabled="!unit.available"
              @click.stop="showUnitDetails(unit)"
            >
              <Award class="mr-2 h-4 w-4" />
              Mula Belajar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </StudentLayout>

  <!-- Enhanced Unit Topics Dialog -->
  <Dialog v-model:open="showUnitDialog">
    <DialogContent class="sm:max-w-2xl bg-white/95 backdrop-blur-md border-0 shadow-2xl">
      <DialogHeader class="border-b border-gray-100 pb-4">
        <DialogTitle v-if="selectedUnit" class="text-2xl flex items-center gap-3">
          <div :class="['p-3 rounded-xl shadow-sm', selectedUnit.color]">
            <component :is="selectedUnit.icon" class="w-6 h-6" />
          </div>
          <div>
            <div
              class="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Unit {{ selectedUnit?.id }}: {{ selectedUnit?.title }}
            </div>
            <div class="text-sm font-normal text-gray-600 mt-1">
              {{ selectedUnit?.topics.length }} topik pembelajaran tersedia
            </div>
          </div>
        </DialogTitle>
        <DialogDescription v-if="selectedUnit" class="text-gray-600 mt-2">
          {{ selectedUnit.description }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="selectedUnit" class="mt-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-800 flex items-center">
          <BookOpen class="mr-2 h-5 w-5 text-blue-500" />
          Topik-topik Pembelajaran:
        </h3>

        <div class="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
          <div
            v-for="(topic, index) in selectedUnit.topics"
            :key="index"
            class="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md cursor-pointer transition-all duration-200"
            @click="startUnitQuiz(selectedUnit.id, index)"
          >
            <div
              class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
            >
              <span class="text-white text-sm font-bold">{{ index + 1 }}</span>
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                {{ topic }}
              </h4>
              <p class="text-sm text-gray-500">Aktiviti pembelajaran interaktif</p>
            </div>
            <div class="text-gray-400 group-hover:text-blue-500 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </div>
          </div>

          <div v-if="selectedUnit.topics.length === 0" class="text-center py-8">
            <div
              class="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4"
            >
              <BookOpen class="h-8 w-8 text-gray-400" />
            </div>
            <p class="text-gray-500">Topik akan ditambah tidak lama lagi</p>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            class="bg-white hover:bg-gray-50"
            @click="showUnitDialog = false"
          >
            Tutup
          </Button>
          <Button
            v-if="selectedUnit.topics.length > 0"
            class="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            @click="startUnitQuiz(selectedUnit.id)"
          >
            <Award class="mr-2 h-4 w-4" />
            Mula Sekarang
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Custom styles for this component */
.unit-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .unit-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
