<script setup>
import { ref, onMounted } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Timeline from '@/components/ui/timeline/Timeline.vue'
import Image from '@/components/ui/image/Image.vue'
import Footer from '@/components/Footer.vue'
import {
  Lightbulb,
  Search,
  Pencil,
  Cog,
  Flag,
  Users,
  Zap,
  BarChart3,
  Heart,
  ArrowDown,
  Info,
  ChevronDown,
} from 'lucide-vue-next'

const useIntersectionObserver = (element, options = {}) => {
  const isIntersecting = ref(false)

  onMounted(() => {
    const observer = new IntersectionObserver(([entry]) => {
      isIntersecting.value = entry.isIntersecting
    }, options)

    if (element.value) {
      observer.observe(element.value)
    }
  })

  return isIntersecting
}

const journeyEvents = ref([
  {
    year: '2018',
    title: 'Akar Inspirasi',
    description:
      'Bermula dari pengalaman mengajar kanak-kanak istimewa, kami menyedari kekurangan bahan pembelajaran yang khusus dan mudah diakses untuk pendidikan khas di Malaysia. Kekurangan ini memberi cabaran kepada guru-guru dan ibu bapa dalam menyediakan pendidikan berkualiti.',
    icon: Lightbulb,
  },
  {
    year: '2019',
    title: 'Kajian dan Penyelidikan',
    description:
      'Kami menjalankan kajian menyeluruh untuk memahami keperluan sebenar pendidik, ibu bapa, dan kanak-kanak istimewa. Dapatan kajian menunjukkan keperluan mendesak untuk platform digital yang komprehensif, interaktif, dan mesra pengguna.',
    icon: Search,
  },
  {
    year: '2020',
    title: 'Pembangunan Konsep',
    description:
      'Konsep IstimewaKu mula dibentuk dengan kerjasama pakar pendidikan khas, ahli teknologi, dan ibu bapa. Matlamat utama kami adalah untuk mencipta platform yang inklusif, menarik, dan berkesan untuk semua tahap pembelajaran.',
    icon: Pencil,
  },
  {
    year: '2021',
    title: 'Pengujian Prototaip',
    description:
      'Versi awal IstimewaKu diuji di beberapa sekolah pendidikan khas. Maklum balas positif daripada guru dan pelajar memberi keyakinan kepada kami untuk meneruskan usaha ini dan meningkatkan lagi ciri-ciri platform.',
    icon: Cog,
  },
  {
    year: '2022',
    title: 'Pelancaran Rasmi',
    description:
      'IstimewaKu dilancarkan secara rasmi untuk membantu pendidik dan ibu bapa di seluruh Malaysia. Platform ini kini tersedia untuk semua dengan misi untuk memastikan tiada kanak-kanak istimewa yang ketinggalan dalam pendidikan.',
    icon: Flag,
  },
])

const coreValues = ref([
  {
    title: 'Inklusiviti',
    description:
      'Kami percaya setiap kanak-kanak berhak mendapat akses kepada pendidikan berkualiti yang sesuai dengan keperluan mereka, tanpa mengira keupayaan atau latar belakang.',
    icon: Users,
  },
  {
    title: 'Inovasi',
    description:
      'Kami sentiasa mencari cara baru dan kreatif untuk mengatasi cabaran dalam pendidikan khas, menggunakan teknologi dan kaedah pengajaran terkini.',
    icon: Zap,
  },
  {
    title: 'Impak',
    description:
      'Setiap keputusan yang kami buat adalah berpandukan kepada kesan positif yang boleh dicapai untuk komuniti pendidikan khas di Malaysia.',
    icon: BarChart3,
  },
  {
    title: 'Kerjasama',
    description:
      'Kejayaan IstimewaKu bergantung kepada kerjasama erat antara pendidik, ibu bapa, pakar, dan komuniti untuk membina platform yang benar-benar memenuhi keperluan semua.',
    icon: Heart,
  },
])

const timelineRef = ref(null)
const isTimelineVisible = useIntersectionObserver(timelineRef, { threshold: 0.1 })
</script>

<template>
  <main>
    <div class="hero bg-gradient-to-br from-yellow-400 to-gray-900 text-white py-12 md:py-24">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 class="text-4xl md:text-5xl font-bold mb-4">Inspirasi Di Sebalik IstimewaKu</h1>
            <p class="text-xl opacity-90 mb-6">
              Kisah, nilai, dan motivasi yang mendorong kami membina platform pendidikan khas yang
              inklusif dan bermakna untuk semua.
            </p>
            <Button variant="outline" class="text-white border-white hover:bg-white/10">
              <ArrowDown class="mr-2 h-4 w-4" />
              Ketahui Lebih Lanjut
            </Button>
          </div>
          <div class="hidden md:flex justify-center">
            <Image
              src="https://img.freepik.com/free-vector/diverse-crowd-people-different-ages-races_74855-5235.jpg"
              alt="Diverse group of people representing inclusivity"
              width="450"
              class="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="our-story py-16 bg-white">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Kisah Kami</h2>
          <p class="text-lg text-gray-700">
            IstimewaKu lahir dari keprihatinan mendalam terhadap keperluan pendidikan khas di
            Malaysia. Kami percaya setiap individu istimewa mempunyai potensi yang perlu diberi
            ruang untuk berkembang.
          </p>
        </div>

        <div
          ref="timelineRef"
          :class="[
            'transition-opacity duration-1000',
            isTimelineVisible ? 'opacity-100' : 'opacity-0',
          ]"
        >
          <Timeline :items="journeyEvents" align="alternate" class="max-w-4xl mx-auto">
            <template #content="{ item }">
              <Card class="mb-4 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div class="flex items-center">
                    <span class="text-white bg-yellow-500 p-2 rounded-full mr-2">
                      <component :is="item.icon" class="h-5 w-5" />
                    </span>
                    <div>
                      <span class="text-yellow-600 font-bold mr-2">{{ item.year }}</span>
                      <span class="text-xl font-semibold text-gray-900">{{ item.title }}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p class="text-gray-700">{{ item.description }}</p>
                </CardContent>
              </Card>
            </template>
          </Timeline>
        </div>
      </div>
    </div>

    <div class="core-values py-16 bg-yellow-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Nilai Teras Kami</h2>
          <p class="text-lg text-gray-700 max-w-3xl mx-auto">
            Nilai-nilai ini menjadi kompas yang membimbing setiap keputusan dan langkah IstimewaKu
            dalam menyediakan perkhidmatan terbaik untuk komuniti pendidikan khas.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            v-for="(value, index) in coreValues"
            :key="index"
            class="hover:shadow-lg transition-all transform hover:-translate-y-1 border-t-4 border-yellow-400"
          >
            <CardContent class="pt-6">
              <div
                class="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mb-4 mx-auto"
              >
                <component :is="value.icon" class="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle class="text-xl mb-3 text-center">
                {{ value.title }}
              </CardTitle>
              <p class="text-gray-700 text-center">{{ value.description }}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* High contrast focus styles for accessibility */
:focus {
  outline: 3px solid #f59e0b;
  outline-offset: 2px;
}

/* Reduce animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .transition-all,
  .transition-shadow,
  .transition-opacity {
    transition: none !important;
  }
}
</style>
