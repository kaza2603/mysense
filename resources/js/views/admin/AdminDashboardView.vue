<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useStudentsStore } from '@/stores/students'
import { useParentsStore } from '@/stores/parents'
import { useTeachersStore } from '@/stores/teachers'
import { useSchoolsStore } from '@/stores/schools'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  Activity,
  Clock,
  BarChart3,
  PieChart,
  Plus,
  RefreshCw,
} from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()
const studentsStore = useStudentsStore()
const parentsStore = useParentsStore()
const teachersStore = useTeachersStore()
const schoolsStore = useSchoolsStore()

const isLoading = ref(true)
const refreshKey = ref(0)

const loadDashboardData = async () => {
  isLoading.value = true
  try {
    await Promise.all([
      studentsStore.fetchStudents(),
      parentsStore.fetchParents(),
      teachersStore.fetchTeachers(),
      schoolsStore.fetchSchools(),
    ])
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (!auth.isAuthenticated) {
    router.push('/admin-login')
    return
  }
  await loadDashboardData()
})

const refreshDashboard = async () => {
  refreshKey.value++
  await loadDashboardData()
}

// Computed statistics with enhanced metrics
const stats = computed(() => {
  const students = studentsStore.students || []
  const parents = parentsStore.parents || []
  const teachers = teachersStore.teachers || []
  const schools = schoolsStore.schools || []

  // School distribution for students
  const studentsBySchool = students.reduce((acc, student) => {
    const school = student.school || 'Tidak Dinyatakan'
    acc[school] = (acc[school] || 0) + 1
    return acc
  }, {})

  // Teacher-student ratio
  const teacherStudentRatio =
    teachers.length > 0 ? Math.round(students.length / teachers.length) : 0

  // Parents with children count
  const parentsWithChildren = parents.filter((parent) => {
    const parentEmail = parent.email || parent.parent_email
    return (
      parentEmail &&
      students.some(
        (student) => student.parentEmail === parentEmail || student.parent_email === parentEmail,
      )
    )
  }).length

  return {
    totalStudents: students.length,
    totalParents: parents.length,
    totalTeachers: teachers.length,
    totalSchools: schools.length,
    parentsWithChildren,
    studentsBySchool,
    teacherStudentRatio,
  }
})

// Quick actions for admin
const quickActions = [
  {
    title: 'Tambah Pelajar',
    description: 'Daftar pelajar baru',
    icon: GraduationCap,
    route: '/admin/students',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    title: 'Tambah Guru',
    description: 'Daftar guru baru',
    icon: School,
    route: '/admin/teachers',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    title: 'Lihat Sekolah',
    description: 'Urus sekolah dan kelas',
    icon: BookOpen,
    route: '/admin/schools',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
]
</script>

<template>
  <div class="bg-gray-50/50">
    <!-- Header Section -->
    <div class="border-b border-gray-200">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-gray-900">Dashboard Admin</h1>
            <p class="mt-1 text-sm text-gray-600">Pantau keseluruhan sistem pembelajaran</p>
          </div>
          <div class="flex items-center gap-3">
            <Button variant="outline" size="sm" @click="refreshDashboard" :disabled="isLoading">
              <RefreshCw :class="{ 'animate-spin': isLoading }" class="mr-2 h-4 w-4" />
              Muat Semula
            </Button>
            <Badge variant="secondary" class="text-xs">
              <Clock class="mr-1 h-3 w-3" />
              Dikemas kini: {{ new Date().toLocaleTimeString('ms-MY') }}
            </Badge>
          </div>
        </div>
      </div>
    </div>

    <div class="px-6 py-6 space-y-6">
      <!-- Main Statistics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Students Card -->
        <Card class="relative overflow-hidden">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-sm font-medium text-gray-600">Jumlah Pelajar</CardTitle>
              <div class="p-2 bg-blue-100 rounded-lg">
                <GraduationCap class="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="text-3xl font-bold text-gray-900">
                {{ isLoading ? '--' : stats.totalStudents }}
              </div>
              <div class="text-sm text-gray-600">Pelajar berdaftar</div>
            </div>
          </CardContent>
        </Card>

        <!-- Parents Card -->
        <Card class="relative overflow-hidden">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-sm font-medium text-gray-600">Jumlah Ibu Bapa</CardTitle>
              <div class="p-2 bg-green-100 rounded-lg">
                <Users class="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="text-3xl font-bold text-gray-900">
                {{ isLoading ? '--' : stats.totalParents }}
              </div>
              <div class="text-sm text-gray-600">
                {{ stats.parentsWithChildren }} dengan anak aktif
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Teachers Card -->
        <Card class="relative overflow-hidden">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-sm font-medium text-gray-600">Jumlah Guru</CardTitle>
              <div class="p-2 bg-purple-100 rounded-lg">
                <School class="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="text-3xl font-bold text-gray-900">
                {{ isLoading ? '--' : stats.totalTeachers }}
              </div>
              <div class="text-sm text-gray-600">
                Nisbah 1:{{ stats.teacherStudentRatio }} (guru:pelajar)
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- System Status Card -->
        <Card class="relative overflow-hidden">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-sm font-medium text-gray-600">Jumlah Sekolah</CardTitle>
              <div class="p-2 bg-orange-100 rounded-lg">
                <BookOpen class="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="text-3xl font-bold text-gray-900">
                {{ isLoading ? '--' : stats.totalSchools }}
              </div>
              <div class="text-sm text-gray-600">Sekolah berdaftar</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Secondary Statistics -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- School Distribution -->
        <Card class="lg:col-span-2">
          <CardHeader>
            <CardTitle class="flex items-center">
              <PieChart class="mr-2 h-5 w-5" />
              Taburan Pelajar Mengikut Sekolah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <template v-if="!isLoading">
                <div
                  v-for="(count, school) in stats.studentsBySchool"
                  :key="school"
                  class="space-y-2"
                >
                  <div class="flex items-center justify-between text-sm">
                    <span class="font-medium text-gray-700">{{ school }}</span>
                    <span class="text-gray-500">{{ count }} pelajar</span>
                  </div>
                  <Progress :value="(count / stats.totalStudents) * 100" class="h-2" />
                </div>
              </template>
              <div v-else class="space-y-3">
                <div v-for="i in 3" :key="i" class="animate-pulse">
                  <div class="h-4 bg-gray-200 rounded mb-2"></div>
                  <div class="h-2 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- System Overview -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center">
              <BarChart3 class="mr-2 h-5 w-5" />
              Ringkasan Sistem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="flex items-center justify-between py-2">
                <span class="text-sm text-gray-600">Sekolah Berdaftar</span>
                <Badge variant="secondary">{{ isLoading ? '--' : stats.totalSchools }}</Badge>
              </div>
              <Separator />
              <div class="flex items-center justify-between py-2">
                <span class="text-sm text-gray-600">Nisbah Guru:Pelajar</span>
                <Badge variant="outline">1:{{ stats.teacherStudentRatio }}</Badge>
              </div>
              <Separator />
              <div class="flex items-center justify-between py-2">
                <span class="text-sm text-gray-600">Ibu Bapa Aktif</span>
                <Badge variant="secondary"
                  >{{
                    Math.round((stats.parentsWithChildren / stats.totalParents) * 100) || 0
                  }}%</Badge
                >
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Quick Actions -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center">
              <Plus class="mr-2 h-5 w-5" />
              Tindakan Pantas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 gap-3">
              <template v-for="action in quickActions" :key="action.title">
                <Button
                  variant="outline"
                  class="h-16 flex items-center justify-start space-x-3 p-4"
                  @click="router.push(action.route)"
                >
                  <component :is="action.icon" class="h-5 w-5" />
                  <div class="text-left">
                    <div class="font-medium text-sm">{{ action.title }}</div>
                    <div class="text-xs text-gray-500">{{ action.description }}</div>
                  </div>
                </Button>
              </template>
            </div>
          </CardContent>
        </Card>

        <!-- Recent Users Summary -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center">
              <Users class="mr-2 h-5 w-5" />
              Ringkasan Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="text-center p-4 bg-gray-50 rounded-lg">
                <div class="text-2xl font-bold text-gray-900">
                  {{ stats.totalStudents + stats.totalParents + stats.totalTeachers }}
                </div>
                <div class="text-sm text-gray-600">Jumlah Pengguna</div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="text-center">
                  <div class="text-lg font-semibold text-blue-600">{{ stats.totalStudents }}</div>
                  <div class="text-xs text-gray-500">Pelajar</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-semibold text-green-600">{{ stats.totalParents }}</div>
                  <div class="text-xs text-gray-500">Ibu Bapa</div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="text-center">
                  <div class="text-lg font-semibold text-purple-600">{{ stats.totalTeachers }}</div>
                  <div class="text-xs text-gray-500">Guru</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-semibold text-orange-600">{{ stats.totalSchools }}</div>
                  <div class="text-xs text-gray-500">Sekolah</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
