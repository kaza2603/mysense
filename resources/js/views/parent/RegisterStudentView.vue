<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useStudentsStore } from '@/stores/students'
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
import { Loader2, User, Mail, School, BookOpen } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
// Import VeeValidate components
import { Form as VeeForm, Field, ErrorMessage } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const router = useRouter()
const auth = useAuthStore()
const studentsStore = useStudentsStore()
const isLoading = ref(false)

// Student form data
const studentData = ref({
  name: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  schoolId: '',
  classId: '',
  parentEmail: auth.currentUser?.email || '',
})

// Computed property to get classes for selected school
const classesForSelectedSchool = computed(() => {
  if (!studentData.value.schoolId) return []
  return studentsStore.classes[studentData.value.schoolId] || []
})

// Watch for school changes to load classes
watch(
  () => studentData.value.schoolId,
  async (newSchoolId) => {
    if (newSchoolId) {
      await studentsStore.fetchClassesBySchool(newSchoolId)

      // Reset class selection when school changes
      studentData.value.classId = ''
    }
  },
)

// Handler for school dropdown change
const handleSchoolChange = () => {
  const selectedSchool = studentsStore.schools.find((s) => s.id === studentData.value.schoolId)
  if (selectedSchool) {
    console.log(`Selected school: ${selectedSchool.name} (${selectedSchool.id})`)
  }
}

// Handler for class dropdown change
const handleClassChange = () => {
  const selectedClass = classesForSelectedSchool.value.find(
    (c) => c.id === studentData.value.classId,
  )
  if (selectedClass) {
    console.log(`Selected class: ${selectedClass.name} (${selectedClass.id})`)
  }
}

// Validate and register student
const handleRegister = async () => {
  // Basic validation
  if (studentData.value.password !== studentData.value.confirmPassword) {
    auth.authError = 'Kata laluan tidak sepadan'
    return
  }

  if (!studentData.value.schoolId) {
    auth.authError = 'Sila pilih sekolah'
    return
  }

  if (!studentData.value.classId) {
    auth.authError = 'Sila pilih kelas'
    return
  }

  isLoading.value = true
  auth.authError = ''

  try {
    console.log('Registering student with data:', {
      ...studentData.value,
      password: '[REDACTED]',
      confirmPassword: '[REDACTED]',
    })

    // Register the student using the auth store method
    const success = await auth.registerStudentBackend(studentData.value)

    if (success) {
      toast.success('Berjaya', { description: 'Pelajar berjaya didaftarkan.' })
      router.push('/parent/dashboard')
    } else {
      toast.error('Ralat', { description: auth.authError || 'Pendaftaran pelajar gagal.' })
    }
  } catch (error) {
    console.error('Error registering student:', error)
    toast.error('Ralat', { description: error.message || 'Pendaftaran pelajar gagal.' })
  } finally {
    isLoading.value = false
  }
}

// Load schools on component mount
onMounted(async () => {
  try {
    // Set parent email from current user if available
    if (auth.currentUser?.email) {
      studentData.value.parentEmail = auth.currentUser.email
    }

    // Load schools for dropdown
    await studentsStore.fetchSchools()
  } catch (error) {
    console.error('Error loading schools:', error)
    toast.error('Ralat', { description: 'Gagal memuatkan senarai sekolah.' })
  }
})
</script>

<template>
  <div class="py-6">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-2xl font-bold mb-6">Daftar Pelajar Baharu</h2>

      <Card>
        <CardContent class="pt-6">
          <form @submit.prevent="handleRegister" class="space-y-4">
            <Alert v-if="auth.authError" variant="destructive" class="mb-4">
              <AlertDescription>{{ auth.authError }}</AlertDescription>
            </Alert>

            <!-- Student Name -->
            <FormField name="name">
              <FormItem>
                <FormLabel>Nama Pelajar</FormLabel>
                <div class="relative">
                  <User class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    v-model="studentData.name"
                    type="text"
                    placeholder="Masukkan nama pelajar"
                    class="pl-10"
                    required
                  />
                </div>
              </FormItem>
            </FormField>

            <!-- Student Username -->
            <FormField name="username">
              <FormItem>
                <FormLabel>Nama Pengguna</FormLabel>
                <div class="relative">
                  <User class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    v-model="studentData.username"
                    type="text"
                    placeholder="Masukkan nama pengguna"
                    class="pl-10"
                    required
                  />
                </div>
              </FormItem>
            </FormField>

            <!-- Student Email -->
            <FormField name="email">
              <FormItem>
                <FormLabel>E-mel Pelajar</FormLabel>
                <div class="relative">
                  <Mail class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    v-model="studentData.email"
                    type="email"
                    placeholder="Masukkan alamat e-mel pelajar"
                    class="pl-10"
                    required
                  />
                </div>
              </FormItem>
            </FormField>
            <!-- School Selection -->
            <FormField name="school">
              <FormItem>
                <FormLabel>Sekolah</FormLabel>
                <div class="relative">
                  <School class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <select
                    v-model="studentData.schoolId"
                    required
                    class="w-full pl-10 rounded-md border border-input p-2"
                    @change="handleSchoolChange"
                  >
                    <option value="" disabled>Pilih Sekolah</option>
                    <option
                      v-for="school in studentsStore.schools"
                      :key="school.id"
                      :value="school.id"
                    >
                      {{ school.name }}
                    </option>
                  </select>
                </div>
                <div v-if="studentData.schoolId" class="mt-1 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="text-gray-500">ID Sekolah: {{ studentData.schoolId }}</span>
                  </div>
                </div>
              </FormItem>
            </FormField>

            <!-- Class Selection -->
            <FormField name="class">
              <FormItem>
                <FormLabel>Kelas</FormLabel>
                <div class="relative">
                  <BookOpen class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <select
                    v-model="studentData.classId"
                    required
                    class="w-full pl-10 rounded-md border border-input p-2"
                    :disabled="!studentData.schoolId"
                    @change="handleClassChange"
                  >
                    <option value="" disabled>
                      {{ studentData.schoolId ? 'Pilih Kelas' : 'Pilih Sekolah Dahulu' }}
                    </option>
                    <option
                      v-for="classItem in classesForSelectedSchool"
                      :key="classItem.id"
                      :value="classItem.id"
                    >
                      {{ classItem.name }}
                    </option>
                  </select>
                </div>
                <div v-if="studentData.classId" class="mt-1 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="text-gray-500">ID Kelas: {{ studentData.classId }}</span>
                  </div>
                </div>
                <div
                  v-if="studentData.schoolId && classesForSelectedSchool.length === 0"
                  class="mt-1 text-sm text-amber-600"
                >
                  Tiada kelas untuk sekolah ini. Sila pilih sekolah lain atau tambah kelas baharu.
                </div>
              </FormItem>
            </FormField>

            <!-- Parent Email (auto-filled) -->
            <FormField name="parentEmail">
              <FormItem>
                <FormLabel>E-mel Ibu Bapa</FormLabel>
                <div class="relative">
                  <Mail class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    v-model="studentData.parentEmail"
                    type="email"
                    placeholder="Masukkan alamat e-mel ibu bapa"
                    class="pl-10"
                    required
                    readonly
                  />
                </div>
              </FormItem>
            </FormField>

            <!-- Password -->
            <FormField name="password">
              <FormItem>
                <FormLabel>Kata Laluan</FormLabel>
                <div class="relative">
                  <Input
                    v-model="studentData.password"
                    type="password"
                    placeholder="Cipta kata laluan"
                    required
                  />
                </div>
              </FormItem>
            </FormField>

            <!-- Confirm Password -->
            <FormField name="confirmPassword">
              <FormItem>
                <FormLabel>Sahkan Kata Laluan</FormLabel>
                <div class="relative">
                  <Input
                    v-model="studentData.confirmPassword"
                    type="password"
                    placeholder="Masukkan semula kata laluan"
                    required
                  />
                </div>
              </FormItem>
            </FormField>
            <!-- Submit Button -->
            <Button type="submit" class="w-full" :disabled="isLoading">
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              Daftar Pelajar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
