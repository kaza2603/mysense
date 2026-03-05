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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog' // Import Dialog components
import { Lock, Mail, User, Phone, MapPin } from 'lucide-vue-next'
import { Loader2 } from 'lucide-vue-next' // Import loader icon
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
const isLoading = ref(false) // Add loading state

const formData = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  confirmPassword: '',
})

const handleRegister = async () => {
  if (formData.value.password !== formData.value.confirmPassword) {
    auth.authError = 'Kata laluan tidak sepadan'
    return
  }

  isLoading.value = true
  auth.authError = '' // Clear previous errors

  const success = await auth.registerParent(formData.value)

  isLoading.value = false

  if (success) {
    // Optionally show a success message before redirecting
    alert('Pendaftaran berjaya! Sila log masuk.') // Simple alert, replace with better UI if needed
    router.push('/parent/login')
  } // Error message is handled by the store and displayed via the Alert component
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle>Daftar Akaun Ibu Bapa</CardTitle>
        <CardDescription>Cipta akaun baharu untuk mengakses IstimewaKu</CardDescription>
      </CardHeader>

      <CardContent>
        <!-- Use a plain div instead of form for layout, trigger registration from dialog -->
        <div class="space-y-4">
          <Alert v-if="auth.authError" variant="destructive" class="mb-4">
            <AlertDescription>{{ auth.authError }}</AlertDescription>
          </Alert>

          <FormField v-slot="{ componentField }" name="name">
            <FormItem>
              <FormLabel>Nama Penuh</FormLabel>
              <div class="relative">
                <User class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  v-bind="componentField"
                  v-model="formData.name"
                  type="text"
                  placeholder="Masukkan nama penuh"
                  class="pl-10"
                  required
                />
              </div>
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>E-mel</FormLabel>
              <div class="relative">
                <Mail class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  v-bind="componentField"
                  v-model="formData.email"
                  type="email"
                  placeholder="Masukkan alamat e-mel"
                  class="pl-10"
                  required
                />
              </div>
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="phone">
            <FormItem>
              <FormLabel>No. Telefon</FormLabel>
              <div class="relative">
                <Phone class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  v-bind="componentField"
                  v-model="formData.phone"
                  type="tel"
                  placeholder="Masukkan nombor telefon"
                  class="pl-10"
                  required
                />
              </div>
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="address">
            <FormItem>
              <FormLabel>Alamat</FormLabel>
              <div class="relative">
                <MapPin class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  v-bind="componentField"
                  v-model="formData.address"
                  type="text"
                  placeholder="Masukkan alamat"
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
                  v-bind="componentField"
                  v-model="formData.password"
                  type="password"
                  placeholder="Cipta kata laluan"
                  class="pl-10"
                  required
                />
              </div>
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="confirmPassword">
            <FormItem>
              <FormLabel>Sahkan Kata Laluan</FormLabel>
              <div class="relative">
                <Lock class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Input
                  v-bind="componentField"
                  v-model="formData.confirmPassword"
                  type="password"
                  placeholder="Masukkan semula kata laluan"
                  class="pl-10"
                  required
                />
              </div>
            </FormItem>
          </FormField>

          <!-- Dialog for Terms and Conditions -->
          <Dialog>
            <DialogTrigger as-child>
              <!-- This button now triggers the dialog -->
              <Button type="button" class="w-full" :disabled="isLoading">
                <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                Daftar
              </Button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Terma dan Syarat Pendaftaran & Notis Privasi</DialogTitle>
                <DialogDescription>
                  Sila baca dan setuju dengan terma berikut sebelum meneruskan pendaftaran.
                </DialogDescription>
              </DialogHeader>
              <div class="py-4 space-y-2 text-sm text-gray-700">
                <p>
                  Dengan menekan butang 'Sahkan Pendaftaran', anda mengesahkan bahawa anda telah
                  membaca, memahami, dan bersetuju untuk terikat dengan Terma dan Syarat
                  Perkhidmatan kami serta Notis Privasi selaras dengan Akta Perlindungan Data
                  Peribadi 2010 (PDPA) Malaysia.
                </p>
                <p>
                  <strong>Penggunaan Data:</strong> Data peribadi yang anda berikan (seperti nama,
                  e-mel, nombor telefon, alamat, dan maklumat berkaitan anak/pelajar) akan digunakan
                  secara eksklusif untuk tujuan pengurusan akaun anda, penyediaan perkhidmatan dalam
                  aplikasi IstimewaKu, komunikasi berkaitan aplikasi, dan penambahbaikan
                  perkhidmatan kami.
                </p>
                <p>
                  <strong>Perkongsian Data:</strong> Kami tidak akan berkongsi, menjual, menyewa,
                  atau mendedahkan data peribadi anda kepada pihak ketiga di luar aplikasi
                  IstimewaKu tanpa kebenaran jelas anda, kecuali jika dikehendaki oleh
                  undang-undang.
                </p>
                <p>
                  <strong>Keselamatan Data:</strong> Kami mengambil langkah-langkah yang munasabah
                  untuk melindungi data peribadi anda daripada akses, penggunaan, atau pendedahan
                  yang tidak dibenarkan.
                </p>
                <p>
                  <strong>Hak Anda:</strong> Anda mempunyai hak untuk mengakses, mengemas kini, atau
                  meminta pemadaman data peribadi anda mengikut peruntukan PDPA. Sila hubungi kami
                  jika anda ingin melaksanakan hak-hak ini.
                </p>
                <!-- You can add more detailed terms here or link to a full policy page -->
              </div>
              <DialogFooter>
                <DialogClose as-child>
                  <Button type="button" variant="secondary"> Batal </Button>
                </DialogClose>
                <!-- This button confirms and triggers the actual registration -->
                <Button type="button" @click="handleRegister" :disabled="isLoading">
                  <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                  Sahkan Pendaftaran
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>

      <CardFooter class="flex flex-col space-y-4 text-center text-sm text-gray-600">
        <p>
          Sudah mempunyai akaun?
          <router-link to="/parent/login" class="text-yellow-600 hover:underline"
            >Log masuk di sini</router-link
          >
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
