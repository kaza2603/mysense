<script setup>
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Building, Calendar, Search } from 'lucide-vue-next'
import Footer from '@/components/Footer.vue'

const teachers = ref([
  {
    id: 1,
    nama: 'Muhammad Fazri Hassan',
    sekolah: 'PPKI SK GAS SANDAKAN',
    gambar: '/images/fazri_hassan.jpg',
    pengalaman: 10,
  },
  {
    id: 2,
    nama: 'Sukerni Sopian',
    sekolah: 'PPKI SK BANDAR TAWAU ii',
    gambar: '/images/sukerni_sopian.jpg',
    pengalaman: 8,
  },
  {
    id: 3,
    nama: 'Fadhlina Abdul Rashid',
    sekolah: 'PPKI SK SUNGAI BULOH',
    gambar: '/images/fadhlina_rashid.jpg',
    pengalaman: 12,
  },
  {
    id: 4,
    nama: 'Siti Intan Farahana Mhd Fauzy',
    sekolah: 'PPKI SK BANDAR LAGUNA MERBUK',
    gambar: '/images/intan_farahana.jpg',
    pengalaman: 6,
  },
  {
    id: 5,
    nama: 'Amal Hassan',
    sekolah: 'PPKI SK HASHIM AWANG',
    gambar: '/images/amal_hassan.jpg',
    pengalaman: 7,
  },
  {
    id: 6,
    nama: 'Siti Haszierah Hassan',
    sekolah: 'PPKI SK HASHIM AWANG',
    gambar: '/images/siti_has.jpg',
    pengalaman: 9,
  },
])
</script>

<template>
  <main>
    <div class="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle id="penyumbangTitle" class="text-3xl"> Penyumbang Bahan </CardTitle>
          <CardDescription class="text-lg">
            Guru-guru yang telah menyumbang kepada platform IstimewaKu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            role="list"
            aria-labelledby="penyumbangTitle"
          >
            <Card
              v-for="teacher in teachers"
              :key="teacher.id"
              class="overflow-hidden hover:shadow-lg transition-shadow duration-300"
              role="listitem"
              aria-labelledby="teacher-name-{{ teacher.id }}"
            >
              <img
                :src="teacher.gambar"
                :alt="`Gambar ${teacher.nama}`"
                class="w-full h-auto object-fit"
              />

              <CardHeader>
                <CardTitle :id="`teacher-name-${teacher.id}`" class="text-xl">
                  {{ teacher.nama }}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div class="space-y-3">
                  <div class="flex items-center gap-2">
                    <Building class="h-4 w-4 text-gray-700" aria-hidden="true" />
                    <span class="text-gray-700">{{ teacher.sekolah }}</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <Calendar class="h-4 w-4 text-gray-700" aria-hidden="true" />
                    <span class="text-gray-700">Pengalaman: {{ teacher.pengalaman }} Tahun</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Empty state - for accessibility -->
          <Card v-if="teachers.length === 0" class="p-8 text-center bg-gray-50">
            <CardContent class="space-y-4">
              <Search class="h-12 w-12 mx-auto text-gray-400" aria-hidden="true" />
              <CardTitle class="text-xl text-gray-700"> Tiada Penyumbang Ditemui </CardTitle>
              <CardDescription class="text-gray-700">
                Tiada penyumbang bahan untuk ditampilkan pada masa ini.
              </CardDescription>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  </main>
</template>

<style scoped>
/* High contrast focus styles for accessibility */
:focus {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
}

/* Ensure adequate color contrast for text - WCAG AA compliant */
.text-gray-700 {
  color: #374151; /* This color has a contrast ratio of at least 4.5:1 against white */
}

/* Additional accessibility enhancements */
@media (prefers-reduced-motion: reduce) {
  .transition-shadow {
    transition: none !important;
  }
}
</style>
