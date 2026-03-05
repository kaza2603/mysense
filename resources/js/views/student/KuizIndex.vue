<script setup>
import { ref } from 'vue'
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
  Brain,
  Eye,
  Ear,
  Smile,
  User,
  Home,
  Music,
  Bird,
  Flower,
  Leaf,
  Sun,
  Droplets,
  Book,
  Award,
  CheckCircle,
  Clock,
  BookOpen,
} from 'lucide-vue-next'
import StudentLayout from '@/components/StudentLayout.vue'

const router = useRouter()

// Function to go back to student dashboard
const goToStudentDashboard = () => {
  router.push('/student/dashboard')
}

// Function to go to kuiz interaktif
const goToKuizInteraktif = () => {
  router.push('/student/kuiz-interaktif')
}

const units = ref([
  // ...existing code...
  {
    id: 1,
    title: 'Unit 1: Benda Hidup dan Bukan Hidup',
    description: 'Kenali perbezaan antara benda hidup dan bukan hidup melalui aktiviti interaktif.',
    quizzes: [
      {
        id: 1,
        name: 'Kenali Saya',
        route: '/kuiz/kenali-saya',
        description: 'Kenali ciri-ciri benda hidup.',
        icon: User,
        color: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        id: 2,
        name: 'Benda di Persekitaran',
        route: '/kuiz/benda-hidup',
        description: 'Kenali benda hidup di persekitaran anda.',
        icon: Home,
        color: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      {
        id: 3,
        name: 'Yang Mana Satu?',
        route: '/kuiz/yang-mana-satu',
        description: 'Kategori benda hidup dan bukan hidup.',
        icon: Brain,
        color: 'bg-purple-100',
        iconColor: 'text-purple-600',
      },
      {
        id: 4,
        name: 'Mari Mengelas',
        route: '/kuiz/mari-mengelas',
        description: 'Kelaskan benda hidup dan bukan hidup.',
        icon: Brain,
        color: 'bg-amber-100',
        iconColor: 'text-amber-600',
      },
    ],
  },
  {
    id: 2,
    title: 'Unit 2: Manusia',
    description: 'Kenali organ deria manusia dan fungsi yang berkaitan dengannya.',
    quizzes: [
      {
        id: 5,
        name: 'Kenali Organ Deria Manusia',
        route: '/kuiz/deria-organ',
        description: 'Kenali fungsi setiap organ deria manusia.',
        icon: Eye,
        color: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
      },
      {
        id: 6,
        name: 'Label Organ Deria Manusia',
        route: '/kuiz/deria-organ-label',
        description: 'Label organ deria manusia dengan betul.',
        icon: Ear,
        color: 'bg-orange-100',
        iconColor: 'text-orange-600',
      },
    ],
  },
  {
    id: 3,
    title: 'Unit 3: Haiwan',
    description: 'Mempelajari ciri-ciri haiwan dan habitatnya.',
    quizzes: [
      {
        id: 7,
        name: 'Merdunya Suaraku',
        route: '/kuiz/merdunya-suaraku',
        description: 'Kenali bunyi-bunyi haiwan.',
        icon: Bird,
        color: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      {
        id: 8,
        name: 'Pergerakanku',
        route: '/kuiz/pergerakanku',
        description: 'Padankan haiwan dengan cara pergerakannya.',
        icon: Bird,
        color: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
      },
    ],
  },
  {
    id: 4,
    title: 'Unit 4: Tumbuhan',
    description: 'Mengenali bahagian tumbuhan dan fungsinya.',
    quizzes: [
      {
        id: 9,
        name: 'Pokok Apakah Saya?',
        route: '/kuiz/pokok-apakah-saya',
        description: 'Kenali jenis-jenis pokok.',
        icon: Leaf,
        color: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      {
        id: 10,
        name: 'Bahagian Tubuhku',
        route: '/kuiz/bahagian-tubuhku',
        description: 'Kenali bahagian-bahagian tumbuhan.',
        icon: Leaf,
        color: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
    ],
  },
  {
    id: 5,
    title: 'Unit 5: Cahaya',
    description: 'Mempelajari tentang sifat cahaya dan aplikasinya.',
    quizzes: [
      {
        id: 11,
        name: 'Cahaya, Oh Cahaya!',
        route: '/kuiz/cahaya-oh-cahaya',
        description: 'Kenali sumber-sumber cahaya.',
        icon: Sun,
        color: 'bg-amber-100',
        iconColor: 'text-amber-600',
      },
      {
        id: 12,
        name: 'Kepentingan Cahaya',
        route: '/kuiz/kepentingan-cahaya',
        description: 'Kenali aktiviti yang memerlukan cahaya.',
        icon: Sun,
        color: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
      },
    ],
  },
  {
    id: 6,
    title: 'Unit 6: Air',
    description: 'Mempelajari tentang kitaran air dan kepentingannya.',
    quizzes: [
      {
        id: 13,
        name: 'Sumber Air Kita',
        route: '/kuiz/sumber-air-kita',
        description: 'Kenali sumber-sumber air dalam kehidupan.',
        icon: Droplets,
        color: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        id: 14,
        name: 'Kitaran Air',
        route: '/kuiz/kitaran-air',
        description: 'Fahami proses kitaran air.',
        icon: Droplets,
        color: 'bg-blue-200',
        iconColor: 'text-blue-600',
      },
      {
        id: 15,
        name: 'Kepentingan Air',
        route: '/kuiz/kepentingan-air',
        description: 'Kenali kepentingan air dalam kehidupan.',
        icon: Droplets,
        color: 'bg-teal-100',
        iconColor: 'text-teal-600',
      },
    ],
  },
])
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
              @click="goToKuizInteraktif"
            >
              <Book class="mr-2 h-4 w-4" />
              Kuiz Mengikut Unit
            </Button>
          </div>
        </div>

        <div
          class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100"
        >
          <h1
            class="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Kuiz Mengikut Topik
          </h1>
          <p class="mt-2 text-gray-600">
            Pilih aktiviti kuiz untuk belajar sambil bermain dan tingkatkan pemahaman anda.
          </p>

          <!-- Quick Info Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
          </div>
        </div>
      </div>

      <!-- Enhanced Unit Section -->
      <div class="mb-12" v-for="unit in units" :key="unit.id">
        <div class="mb-6">
          <div class="flex items-center mb-3">
            <div class="bg-indigo-100 rounded-full p-2 mr-3">
              <Book class="h-5 w-5 text-indigo-600" />
            </div>
            <h2 class="text-2xl font-bold text-indigo-800">{{ unit.title }}</h2>
          </div>
          <p class="text-gray-600 ml-11">{{ unit.description }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            v-for="quiz in unit.quizzes"
            :key="quiz.id"
            class="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transform hover:-translate-y-1"
            @click="router.push(quiz.route)"
          >
            <CardHeader :class="[quiz.color, 'rounded-t-lg border-b-0']">
              <div class="flex items-center gap-3">
                <div class="p-3 rounded-xl bg-white/90 backdrop-blur shadow-sm">
                  <component :is="quiz.icon" :class="[quiz.iconColor, 'w-6 h-6']" />
                </div>
                <div>
                  <CardTitle class="text-gray-800">{{ quiz.name }}</CardTitle>
                  <div class="flex items-center mt-1">
                    <Clock class="h-3 w-3 text-gray-500 mr-1" />
                    <span class="text-xs text-gray-500">5-10 minit</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent class="pt-4 pb-2">
              <CardDescription class="text-gray-700 mb-3">{{ quiz.description }}</CardDescription>
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center text-green-600">
                  <CheckCircle class="h-4 w-4 mr-1" />
                  <span>Interaktif</span>
                </div>
                <div class="flex items-center text-blue-600">
                  <Award class="h-4 w-4 mr-1" />
                  <span>Menyeronokkan</span>
                </div>
              </div>
            </CardContent>
            <CardFooter class="pt-2">
              <Button
                class="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-md"
              >
                <Brain class="mr-2 h-4 w-4" />
                Mula Aktiviti
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div class="mt-8 text-center text-gray-500 text-sm">
        <p>Istimewa.Ku © 2025 - Aplikasi Pembelajaran Interaktif</p>
      </div>
    </div>
  </StudentLayout>
</template>

<style scoped>
/* Additional styling */
.container {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
