<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateToAdminLogin = () => {
  router.push('/login-admin')
}

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="text-white py-8 bg-slate-950">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- About Section -->
        <div>
          <h3 class="text-xl font-semibold mb-4">Tentang IstimewaKu</h3>
          <p class="text-gray-300">
            Platform pembelajaran interaktif untuk Pendidikan Khas yang bertujuan untuk membantu
            individu istimewa dengan menyediakan maklumat dan bahan-bahan pembelajaran yang sesuai.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-xl font-semibold mb-4">Pautan Pantas</h3>
          <ul class="space-y-2">
            <li>
              <router-link to="/" class="text-gray-300 hover:text-yellow-400"
                >Laman Utama</router-link
              >
            </li>
            <li>
              <router-link to="/motivasi" class="text-gray-300 hover:text-yellow-400"
                >Motivasi</router-link
              >
            </li>
            <li>
              <router-link to="/penyumbang-bahan" class="text-gray-300 hover:text-yellow-400"
                >Penyumbang Bahan</router-link
              >
            </li>
            <li>
              <router-link to="/student-login" class="text-gray-300 hover:text-yellow-400"
                >Log Masuk Pelajar</router-link
              >
            </li>
            <li>
              <router-link to="/guru/login" class="text-gray-300 hover:text-yellow-400"
                >Log Masuk Guru</router-link
              >
            </li>
          </ul>
        </div>

        <!-- Contact Section -->
        <div>
          <h3 class="text-xl font-semibold mb-4">Hubungi Kami</h3>
          <address class="not-italic text-gray-300">
            <p>PROGRAM PENDIDIKAN KHAS INTEGRASI</p>
            <p>SK HASHIM AWANG</p>
            <p>13200 KEPALA BATAS</p>
            <p>PULAU PINANG</p>
          </address>
        </div>
      </div>

      <hr class="my-6 border-gray-700" />

      <div class="flex flex-col md:flex-row justify-between items-center">
        <p class="text-gray-400">© {{ currentYear }} IstimewaKu. Hak Cipta Terpelihara.</p>
        <div class="mt-4 md:mt-0">
          <button @click="navigateToAdminLogin" class="text-gray-400 hover:text-yellow-400 text-sm">
            Admin Login
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>
