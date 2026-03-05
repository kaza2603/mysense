<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { ArrowRight, Check, Zap, Book, Briefcase, Quote } from 'lucide-vue-next'

const router = useRouter()

const features = ref([
  {
    title: 'Quiz Interaktif',
    description:
      'Uji pengetahuan dan tahap pemahaman anda menerusi siri soalan interaktif yang mencabar dan menarik.',
    icon: Zap,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Buku Digital',
    description:
      'Nikmati kemudahan membaca di mana sahaja dan pada bila-bila masa dengan buku digital',
    icon: Book,
    color: 'bg-pink-100 text-pink-600',
  },
  {
    title: 'Bahan Guru',
    description: 'Temui koleksi sumber pengajaran komprehensif yang direka khas dari pendidik',
    icon: Briefcase,
    color: 'bg-green-100 text-green-600',
  },
])

const tabs = ref([
  {
    title: 'Tentang IstimewaKu',
    value: '0',
    content:
      'IstimewaKu adalah platform pembelajaran interaktif untuk Pendidikan Khas yang bertujuan untuk membantu individu istimewa dengan menyediakan maklumat dan bahan-bahan pembelajaran yang sesuai. Kami percaya bahawa setiap individu adalah istimewa dan mempunyai potensi untuk berkembang dengan sokongan yang sesuai. Platform kami direka untuk menyokong perjalanan pendidikan melalui modul bersepadu yang bekerjasama untuk memberikan pengalaman pembelajaran yang lengkap dan disesuaikan.',
  },
  {
    title: 'Matlamat Kami',
    value: '1',
    content:
      'Matlamat utama kami adalah untuk menyediakan akses kepada bahan-bahan pendidikan dan maklumat yang diperlukan oleh individu istimewa dan keluarga mereka, memastikan pengalaman pembelajaran yang inklusif dan berkesan.',
  },
  {
    title: 'Perkhidmatan',
    value: '2',
    content:
      'Platform ini menyediakan pelbagai perkhidmatan termasuk buku teks digital, kuiz interaktif, bahan pembelajaran, kata-kata motivasi, dan maklumat mengenai pusat sokongan untuk individu istimewa.',
  },
])

const responsiveOptions = ref([
  {
    breakpoint: '1024px',
    numVisible: 3,
    numScroll: 1,
  },
  {
    breakpoint: '768px',
    numVisible: 2,
    numScroll: 1,
  },
  {
    breakpoint: '560px',
    numVisible: 1,
    numScroll: 1,
  },
])

const navigateToLogin = () => {
  router.push('/student-login')
}

const navigateToMotivasi = () => {
  router.push('/motivasi')
}
</script>

<template>
  <main>
    <!-- Hero Section -->
    <div class="bg-white py-4 sm:py-12 md:py-24">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 class="text-5xl sm:text-6xl lg:text-7xl xl:text-9xl font-bold text-black mb-4">
              Istimewa Untuk <span class="text-yellow-400">Istimewa</span>Ku
            </h1>
            <p class="text-lg mb-6">| PROGRAM PENDIDIKAN KHAS INTEGRASI</p>
            <div class="flex flex-wrap gap-2">
              <Button variant="outline" @click="navigateToMotivasi"> Ketahui Lebih Lanjut </Button>
              <Button class="bg-yellow-500 hover:bg-yellow-600" @click="navigateToLogin">
                Mulakan Sekarang
                <ArrowRight class="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          <div class="flex justify-center">
            <img
              src="https://img.freepik.com/free-vector/family-concept-illustration_114360-2047.jpg"
              alt="IstimewaKu"
              class="w-full max-w-[400px]"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="py-20 bg-yellow-400">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-5xl font-bold text-center mb-8">Perkhidmatan Kami</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            v-for="(feature, index) in features"
            :key="index"
            class="h-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:-translate-y-1"
          >
            <CardHeader>
              <div class="flex justify-center p-4">
                <span :class="[feature.color, 'p-3 rounded-full']">
                  <component :is="feature.icon" class="h-6 w-6" />
                </span>
              </div>
              <CardTitle class="text-xl font-semibold text-center">
                {{ feature.title }}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-center">{{ feature.description }}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Maklumat Section -->
    <div class="bg-gray-50 py-12">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-8">Maklumat IstimewaKu</h2>
        <div class="max-w-9xl mx-auto">
          <Accordion type="single" collapsible>
            <AccordionItem v-for="tab in tabs" :key="tab.title" :value="tab.value">
              <AccordionTrigger>{{ tab.title }}</AccordionTrigger>
              <AccordionContent>
                <p class="m-0">{{ tab.content }}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <div class="py-16 bg-gradient-to-r from-yellow-700 to-yellow-500 text-white">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 class="text-3xl md:text-4xl font-bold mb-6">Sertai Komuniti IstimewaKu Hari Ini</h2>
            <p class="text-lg mb-6 opacity-90">
              Dapatkan akses ke bahan-bahan pembelajaran, maklumat dan sokongan untuk individu
              istimewa. Bersama-sama kita boleh membangunkan potensi istimewa setiap individu.
            </p>

            <div class="space-y-4 mb-8">
              <div class="flex items-start">
                <span class="p-2 bg-yellow-400 rounded-full mr-3 mt-1">
                  <Check class="h-4 w-4 text-yellow-900" />
                </span>
                <p>
                  Sumber pembelajaran yang dihasilkan oleh guru-guru berpengalaman dalam pendidikan
                  khas
                </p>
              </div>

              <div class="flex items-start">
                <span class="p-2 bg-yellow-400 rounded-full mr-3 mt-1">
                  <Check class="h-4 w-4 text-yellow-900" />
                </span>
                <p>Sokongan komuniti untuk ibu bapa dan penjaga individu istimewa</p>
              </div>

              <div class="flex items-start">
                <span class="p-2 bg-yellow-400 rounded-full mr-3 mt-1">
                  <Check class="h-4 w-4 text-yellow-900" />
                </span>
                <p>
                  Kemas kini berkala dengan kaedah pembelajaran terkini dan aktiviti yang sesuai
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white/10 backdrop-blur-sm rounded-lg p-8 shadow-lg">
            <div class="grid grid-cols-2 gap-6">
              <!-- Success Stats -->
              <div class="text-center">
                <div class="text-4xl md:text-5xl font-bold text-yellow-300 mb-2">5+</div>
                <p class="text-sm md:text-base text-white opacity-90">Sekolah Terlibat</p>
              </div>

              <div class="text-center">
                <div class="text-4xl md:text-5xl font-bold text-yellow-300 mb-2">12+</div>
                <p class="text-sm md:text-base text-white opacity-90">Bahan Pembelajaran</p>
              </div>

              <div class="text-center">
                <div class="text-4xl md:text-5xl font-bold text-yellow-300 mb-2">50+</div>
                <p class="text-sm md:text-base text-white opacity-90">Pelajar Mendapat Manfaat</p>
              </div>

              <div class="text-center">
                <div class="text-4xl md:text-5xl font-bold text-yellow-300 mb-2">95%</div>
                <p class="text-sm md:text-base text-white opacity-90">Kadar Kepuasan Pengguna</p>
              </div>
            </div>

            <!-- Testimonial -->
            <div class="mt-8 bg-white/20 p-4 rounded-lg relative">
              <Quote
                class="absolute -top-3 -left-3 h-6 w-6 text-yellow-300 bg-yellow-700 p-1 rounded-full"
              />
              <p class="italic mb-4">
                "Platform IstimewaKu telah membantu anak saya yang istimewa untuk belajar dengan
                cara yang menyeronokkan dan berkesan. Saya sangat menghargai usaha para guru yang
                menyediakan bahan pembelajaran berkualiti."
              </p>
              <div class="flex items-center">
                <div
                  class="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center mr-3"
                >
                  <span class="font-bold text-yellow-800">RH</span>
                </div>
                <div>
                  <p class="font-semibold">Raiha Hassan</p>
                  <p class="text-sm opacity-90">Ibu kepada Anak Istimewa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
