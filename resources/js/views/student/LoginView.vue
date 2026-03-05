<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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
import { AlertCircle, Loader2 } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IstimewaKuLogo } from '@/components/logo'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Sila masukkan emel dan kata laluan anda.'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    // Use backend API for student login
    const success = await auth.loginStudent(email.value, password.value)

    if (success) {
      router.push('/student/dashboard')
    } else {
      error.value = auth.authError || 'Log masuk gagal. Sila cuba lagi.'
    }
  } catch (err) {
    error.value = err.message || 'Emel atau kata laluan tidak sah'
  } finally {
    isLoading.value = false
  }
}

const navigateToHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1">
        <div class="flex justify-center mb-4">
          <IstimewaKuLogo class="h-16 w-16" />
        </div>
        <CardTitle class="text-2xl font-bold text-center">Log Masuk Pelajar</CardTitle>
        <CardDescription class="text-center">
          Masukkan butiran log masuk anda untuk akses platform pembelajaran
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <Alert v-if="error" variant="destructive">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <div class="space-y-2">
            <Label for="email">E-mel</Label>
            <Input
              id="email"
              v-model="email"
              placeholder="Masukkan emel pelajar anda"
              type="email"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="password">Kata Laluan</Label>
            <Input
              id="password"
              v-model="password"
              placeholder="Masukkan kata laluan anda"
              type="password"
              required
            />
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                class="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-900"> Ingat Saya </label>
            </div>
            <div class="text-sm">
              <router-link
                to="/forgot-password"
                class="font-medium text-yellow-600 hover:text-yellow-500"
              >
                Lupa Kata Laluan?
              </router-link>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div class="w-full space-y-2">
          <Button
            class="w-full bg-yellow-500 hover:bg-yellow-600"
            :disabled="isLoading"
            @click="handleLogin"
          >
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            Log Masuk
          </Button>
          <Button variant="outline" class="w-full" @click="navigateToHome">
            Kembali ke Laman Utama
          </Button>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
