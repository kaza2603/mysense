<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Lock, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const formSchema = toTypedSchema(
  z
    .object({
      password: z.string().min(6, 'Kata laluan mesti sekurang-kurangnya 6 aksara'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Kata laluan tidak sepadan',
      path: ['confirmPassword'],
    }),
)

const form = useForm({
  validationSchema: formSchema,
})

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const isResetComplete = ref(false)
const isValidSession = ref(false)

onMounted(async () => {
  // Try to get token from URL query parameters first
  let token = route.query.token_hash || route.query.token
  let type = route.query.type

  // If not found in query params, try URL hash (fragment)
  if (!token) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    token = hashParams.get('token_hash') || hashParams.get('token')
    type = hashParams.get('type')
  }

  if (token && type === 'recovery') {
    const success = await auth.verifyResetToken(token)
    isValidSession.value = success

    // Clean the URL to remove sensitive tokens
    if (success) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  } else {
    // Also check for access_token and refresh_token (alternative format)
    const accessToken = route.query.access_token
    const refreshToken = route.query.refresh_token

    if (accessToken && refreshToken) {
      const success = await auth.verifyResetSession(accessToken, refreshToken)
      isValidSession.value = success
    } else {
      // Redirect to forgot password if no valid tokens
      router.push('/forgot-password')
    }
  }
})

const handleResetPassword = async () => {
  isLoading.value = true
  auth.authError = '' // Clear previous errors

  const success = await auth.resetPassword(password.value)
  if (success) {
    isResetComplete.value = true
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push('/')
    }, 3000)
  }
  isLoading.value = false
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle>Set Kata Laluan Baharu</CardTitle>
        <CardDescription v-if="!isResetComplete">
          Masukkan kata laluan baharu untuk akaun anda
        </CardDescription>
        <CardDescription v-else> Kata laluan anda telah berjaya dikemaskini </CardDescription>
      </CardHeader>

      <CardContent>
        <div v-if="!isValidSession" class="text-center">
          <Alert variant="destructive">
            <AlertDescription>
              Pautan reset kata laluan tidak sah atau telah tamat tempoh. Sila minta pautan baharu.
            </AlertDescription>
          </Alert>
        </div>

        <div v-else-if="!isResetComplete">
          <form @submit.prevent="handleResetPassword" class="space-y-4">
            <Alert v-if="auth.authError" variant="destructive" class="mb-4">
              <AlertDescription>{{ auth.authError }}</AlertDescription>
            </Alert>

            <FormField v-slot="{ componentField }" name="password">
              <FormItem>
                <FormLabel>Kata Laluan Baharu</FormLabel>
                <div class="relative">
                  <Lock class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    v-model="password"
                    v-bind="componentField"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Masukkan kata laluan baharu"
                    class="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    @click="togglePasswordVisibility"
                    class="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
                  >
                    <Eye v-if="!showPassword" />
                    <EyeOff v-else />
                  </button>
                </div>
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="confirmPassword">
              <FormItem>
                <FormLabel>Sahkan Kata Laluan</FormLabel>
                <div class="relative">
                  <Lock class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    v-model="confirmPassword"
                    v-bind="componentField"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder="Sahkan kata laluan baharu"
                    class="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    @click="toggleConfirmPasswordVisibility"
                    class="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
                  >
                    <Eye v-if="!showConfirmPassword" />
                    <EyeOff v-else />
                  </button>
                </div>
              </FormItem>
            </FormField>

            <Button type="submit" class="w-full" :disabled="isLoading">
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              Kemaskini Kata Laluan
            </Button>
          </form>
        </div>

        <div v-else class="text-center space-y-4">
          <div class="flex justify-center">
            <CheckCircle class="h-16 w-16 text-green-500" />
          </div>
          <Alert>
            <AlertDescription>
              Kata laluan anda telah berjaya dikemaskini! Anda akan dialihkan ke halaman log masuk
              dalam beberapa saat.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>

      <CardFooter v-if="!isValidSession" class="flex justify-center">
        <Button variant="outline" @click="router.push('/forgot-password')">
          Minta Pautan Baharu
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
