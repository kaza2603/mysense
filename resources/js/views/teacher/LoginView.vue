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
import { toast } from 'vue-sonner'
import { IstimewaKuLogo } from '@/components/logo'

const email = ref('')
const password = ref('')
const router = useRouter()
const auth = useAuthStore()
const isLoading = ref(false)

const handleLogin = async () => {
  if (!email.value || !password.value) {
    toast.error('Ralat', { description: 'Sila masukkan emel dan kata laluan.' })
    return
  }

  isLoading.value = true
  try {
    // Call loginTeacher with separate email and password arguments
    const loginSuccessful = await auth.loginTeacher(email.value, password.value) // Changed this line

    // Check the return value from loginTeacher to confirm success
    if (loginSuccessful) {
      toast.success('Berjaya', { description: 'Log masuk berjaya!' })
      router.push('/guru/dashboard') // Redirect to teacher dashboard
    } else {
      // If loginTeacher returns false, use the error message from the store
      toast.error('Ralat Log Masuk', { description: auth.authError || 'Log masuk gagal.' })
    }
  } catch (error) {
    // This catch block might not be strictly necessary if loginTeacher handles errors internally
    // but it's good practice to keep it for unexpected issues.
    console.error('Login failed unexpectedly:', error)
    // Use the error message from the store if available, otherwise use a generic message
    const errorMessage = auth.authError || error.message || 'Log masuk gagal. Sila cuba lagi.'
    toast.error('Ralat Log Masuk', { description: errorMessage })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100 px-4">
    <Card class="w-full max-w-sm">
      <CardHeader class="space-y-1 text-center">
        <IstimewaKuLogo class="h-10 w-full justify-center mb-4" />
        <CardTitle class="text-2xl">Log Masuk Guru</CardTitle>
        <CardDescription
          >Masukkan emel dan kata laluan anda untuk akses portal guru.</CardDescription
        >
      </CardHeader>
      <CardContent class="grid gap-4">
        <form @submit.prevent="handleLogin">
          <div class="grid gap-2">
            <Label for="email">Emel</Label>
            <Input id="email" v-model="email" type="email" placeholder="guru@contoh.com" required />
          </div>
          <div class="grid gap-2 mt-4">
            <Label for="password">Kata Laluan</Label>
            <Input id="password" v-model="password" type="password" required />
          </div>
          <Button :disabled="isLoading" class="w-full mt-6" type="submit">
            <span v-if="isLoading">Sila tunggu...</span>
            <span v-else>Log Masuk</span>
          </Button>
        </form>
      </CardContent>
      <CardFooter class="flex flex-col items-center text-sm">
        <router-link to="/forgot-password" class="text-yellow-600 hover:underline">
          Lupa Kata Laluan?
        </router-link>
        <router-link to="/" class="underline mt-2">Kembali ke Laman Utama</router-link>
      </CardFooter>
    </Card>
  </div>
</template>
