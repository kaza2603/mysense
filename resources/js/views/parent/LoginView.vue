<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
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
import { Lock, Mail, Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const formSchema = toTypedSchema(
  z.object({
    username: z.string().min(2).max(50),
  }),
)

const form = useForm({
  validationSchema: formSchema,
})

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  isLoading.value = true
  auth.authError = '' // Clear previous errors
  const success = await auth.loginParent(email.value, password.value)
  if (success) {
    router.push('/parent/dashboard')
  } // Error message is handled by the store and displayed via the Alert component
  isLoading.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle>Log Masuk Ibu Bapa</CardTitle>
        <CardDescription>Log masuk ke akaun IstimewaKu anda</CardDescription>
      </CardHeader>

      <CardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Use <form> instead of <Form> -->
          <Alert v-if="auth.authError" variant="destructive" class="mb-4">
            <AlertDescription>{{ auth.authError }}</AlertDescription>
          </Alert>

          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>E-mel</FormLabel>
              <div class="relative">
                <Mail class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  v-model="email"
                  v-bind="componentField"
                  type="email"
                  placeholder="Masukkan alamat e-mel"
                  class="pl-10"
                  required
                />
              </div>
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="password">
            <FormItem>
              <FormLabel>Kata Laluan</FormLabel>
              <div class="relative">
                <Lock class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  v-model="password"
                  v-bind="componentField"
                  type="password"
                  placeholder="Masukkan kata laluan"
                  class="pl-10"
                  required
                />
              </div>
            </FormItem>
          </FormField>

          <Button type="submit" class="w-full" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            Log Masuk
          </Button>
        </form>
        <!-- Close <form> -->
      </CardContent>

      <CardFooter class="flex flex-col space-y-4 text-center text-sm text-gray-600">
        <router-link to="/forgot-password" class="text-yellow-600 hover:underline">
          Lupa Kata Laluan?
        </router-link>
        <p>
          Belum mempunyai akaun?
          <router-link to="/parent/register" class="text-yellow-600 hover:underline"
            >Daftar di sini</router-link
          >
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
