<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useStudentsStore } from '@/stores/students'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, UserPlus, Clock, TrendingUp, BookOpen } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()
const studentsStore = useStudentsStore()
const isLoading = ref(true)

onMounted(async () => {
  if (!auth.isParentAuthenticated) {
    router.push('/parent/login')
    return
  }

  isLoading.value = true
  // Fetch students data
  if (auth.currentUser?.email) {
    try {
      console.log('Fetching students for parent email:', auth.currentUser.email)
      await studentsStore.fetchStudentsByParent(auth.currentUser.email)
      console.log('Fetched students:', studentsStore.students)

      // Fetch any missing school or class data
      await fetchMissingData()
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      isLoading.value = false
    }
  } else {
    console.warn('Current user email not available on mount.')
    isLoading.value = false
  }
})

// Get students from the store
const myChildren = computed(() => studentsStore.students || [])

// Fetch additional data if needed
const fetchMissingData = async () => {
  if (!myChildren.value || myChildren.value.length === 0) return

  console.log('Checking for missing school/class data')

  for (const child of myChildren.value) {
    // Fetch school data if we have ID but no name
    if (child.schoolId && !child.school) {
      console.log(`Fetching school data for child: ${child.name} (ID: ${child.schoolId})`)
      try {
        const school = await studentsStore.fetchSchoolById(child.schoolId)
        if (school) {
          console.log(`Found school: ${school.name}`)
          child.school = school.name
        }
      } catch (error) {
        console.error(`Error fetching school for ${child.name}:`, error)
      }
    }

    // Fetch class data if we have ID but no name
    if (child.schoolId && child.classId && !child.class) {
      console.log(`Fetching class data for child: ${child.name} (ID: ${child.classId})`)
      try {
        const classData = await studentsStore.fetchClassById(child.schoolId, child.classId)
        if (classData) {
          console.log(`Found class: ${classData.name}`)
          child.class = classData.class_name || classData.name
        }
      } catch (error) {
        console.error(`Error fetching class for ${child.name}:`, error)
      }
    }
  }
}

// Navigate to student registration page
const navigateToRegisterStudent = () => {
  router.push('/parent/register-student')
}

// Navigate to student details page
const navigateToMyChildren = (studentId = null) => {
  if (studentId) {
    router.push(`/parent/my-children/${studentId}`)
  } else {
    router.push('/parent/my-children')
  }
}

// Watch for changes in myChildren and fetch missing data accordingly
watch(myChildren, fetchMissingData, { immediate: true })
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold">Dashboard Ibu Bapa</h1>
      <Button @click="navigateToRegisterStudent" class="flex items-center gap-2">
        <UserPlus class="h-4 w-4" />
        Daftar Pelajar Baharu
      </Button>
    </div>

    <!-- Welcome Card -->
    <Card class="mb-8">
      <CardHeader>
        <CardTitle>Selamat Datang, {{ auth.currentUser?.name || 'Ibu Bapa' }}</CardTitle>
        <CardDescription>
          Panel ibu bapa membolehkan anda memantau prestasi anak-anak anda dalam pembelajaran.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p class="mb-4">
          Dari sini, anda boleh mendaftar pelajar baharu, memantau prestasi mereka, dan mengakses
          maklumat pembelajaran terkini.
        </p>
        <div class="flex items-center gap-4">
          <Button variant="outline" @click="navigateToMyChildren" class="flex items-center gap-2">
            <GraduationCap class="h-4 w-4" />
            Lihat Prestasi Anak-Anak
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Students Summary -->
    <h2 class="text-xl font-semibold mb-4">Ringkasan Pelajar</h2>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center items-center p-8">
      <div
        class="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"
      ></div>
    </div>

    <!-- Error state -->
    <Card v-else-if="studentsStore.error" class="mb-8">
      <CardContent class="p-6 text-center">
        <p class="text-red-600 mb-4">{{ studentsStore.error }}</p>
        <Button @click="studentsStore.fetchStudentsByParent(auth.currentUser?.email)">
          Cuba Lagi
        </Button>
      </CardContent>
    </Card>

    <!-- Empty state -->
    <Card v-else-if="myChildren.length === 0" class="mb-8">
      <CardContent class="p-8 text-center">
        <UserPlus class="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium mb-2">Tiada Pelajar Berdaftar</h3>
        <p class="text-gray-500 mb-6 max-w-md mx-auto">
          Anda belum mendaftarkan sebarang pelajar. Daftar pelajar baharu untuk mula pantau prestasi
          pembelajaran mereka.
        </p>
        <Button @click="navigateToRegisterStudent">Daftar Pelajar Sekarang</Button>
      </CardContent>
    </Card>

    <!-- Students Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <Card v-for="child in myChildren" :key="child.id" class="hover:shadow-md transition-shadow">
        <CardContent class="p-6">
          <div class="flex items-start gap-4">
            <div class="p-3 bg-blue-100 rounded-full">
              <GraduationCap class="h-6 w-6 text-blue-700" />
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-lg">{{ child.name }}</h3>

              <!-- School information with tags for missing data -->
              <div class="flex items-center gap-2 mb-2">
                <p class="text-gray-500 text-sm">
                  Sekolah: {{ child.school || 'Tidak Ditetapkan' }}
                </p>
                <span
                  v-if="!child.school"
                  class="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded"
                >
                  Perlu Dikemaskini
                </span>
              </div>

              <!-- Class information with tags for missing data -->
              <div class="flex items-center gap-2 mb-4">
                <p class="text-gray-500 text-sm">Kelas: {{ child.class || 'Tidak Ditetapkan' }}</p>
              </div>

              <Button
                @click="navigateToMyChildren(child.id)"
                variant="outline"
                class="w-full flex items-center justify-center gap-2"
              >
                <TrendingUp class="h-4 w-4" />
                Lihat Prestasi
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Stats -->
    <h2 class="text-xl font-semibold mb-4">Statistik Ringkas</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardContent class="p-6 flex items-center gap-4">
          <div class="p-3 bg-yellow-100 rounded-full">
            <GraduationCap class="h-6 w-6 text-yellow-700" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Jumlah Pelajar</p>
            <p class="text-2xl font-bold">{{ myChildren.length }}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6 flex items-center gap-4">
          <div class="p-3 bg-green-100 rounded-full">
            <BookOpen class="h-6 w-6 text-green-700" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Jumlah Sekolah</p>
            <p class="text-2xl font-bold">
              {{ new Set(myChildren.map((c) => c.school)).size }}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
