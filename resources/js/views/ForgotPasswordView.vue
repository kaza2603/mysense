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
import { Mail, Loader2, ArrowLeft } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const formSchema = toTypedSchema(
  z.object({
    email: z.string().email('Format e-mel tidak sah'),
  }),
)

const form = useForm({
  validationSchema: formSchema,
})

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const isLoading = ref(false)
const isEmailSent = ref(false)

const handleForgotPassword = async () => {
  isLoading.value = true
  auth.authError = '' // Clear previous errors

  const success = await auth.forgotPassword(email.value)
  if (success) {
    isEmailSent.value = true
  }
  isLoading.value = false
}

const goBack = () => {
  router.go(-1)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle>Reset Kata Laluan</CardTitle>
        <CardDescription v-if="!isEmailSent">
          Masukkan alamat e-mel anda untuk menerima pautan reset kata laluan
        </CardDescription>
        <CardDescription v-else>
          Pautan reset kata laluan telah dihantar ke e-mel anda
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div v-if="!isEmailSent">
          <form @submit.prevent="handleForgotPassword" class="space-y-4">
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

            <Button type="submit" class="w-full" :disabled="isLoading">
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              Hantar Pautan Reset
            </Button>
          </form>
        </div>

        <div v-else class="text-center space-y-4">
          <Alert>
            <AlertDescription>
              Kami telah menghantar pautan reset kata laluan ke <strong>{{ email }}</strong
              >. Sila semak e-mel anda dan ikuti arahan untuk reset kata laluan.
            </AlertDescription>
          </Alert>

          <p class="text-sm text-gray-600">
            Tidak menerima e-mel? Semak folder spam atau cuba lagi dalam beberapa minit.
          </p>
        </div>
      </CardContent>

      <CardFooter class="flex justify-center">
        <Button variant="outline" @click="goBack" class="flex items-center">
          <ArrowLeft class="mr-2 h-4 w-4" />
          Kembali ke Log Masuk
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
