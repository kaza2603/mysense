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
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Lock, User, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  isLoading.value = true
  try {
    const success = await auth.login(email.value, password.value)
    if (success) {
      router.push('/admin/dashboard')
    }
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle>Admin Login</CardTitle>
        <CardDescription>Log masuk ke panel pentadbir IstimewaKu</CardDescription>
      </CardHeader>

      <CardContent>
        <Form @submit="handleLogin" class="space-y-4">
          <Alert v-if="auth.authError" variant="destructive" class="mb-4">
            <AlertDescription>{{ auth.authError }}</AlertDescription>
          </Alert>

          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>E-mel</FormLabel>
              <div class="relative">
                <User class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
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
        </Form>
      </CardContent>

      <CardFooter class="text-center text-sm text-gray-600">
        Untuk kegunaan pentadbir sahaja
      </CardFooter>
    </Card>
  </div>
</template>
