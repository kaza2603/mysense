<script setup>
import { ref, onMounted, computed, watch, reactive } from 'vue'
import { useStudentsStore } from '@/stores/students'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Users,
  GraduationCap,
  School,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  Loader2,
  SortAsc,
  SortDesc,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const studentsStore = useStudentsStore()
const auth = useAuthStore()

// State management
const isLoading = ref(true)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const showViewDialog = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const deletingStudent = ref(null)
const viewingStudent = ref(null)

// Search and filter state
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const selectedSchoolFilter = ref('all')
const selectedClassFilter = ref('all')
const statusFilter = ref('')
const sortBy = ref('name')
const sortOrder = ref('asc')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Debounce search
let searchTimeout = null

// Student form data
const currentStudent = reactive({
  id: null,
  name: '',
  school: '',
  schoolId: '',
  class: '',
  classId: '',
  parentEmail: '',
  username: '',
  email: '',
  password: '',
})

// Reset form
const resetForm = () => {
  Object.assign(currentStudent, {
    id: null,
    name: '',
    school: '',
    schoolId: '',
    class: '',
    classId: '',
    parentEmail: '',
    username: '',
    email: '',
    password: '',
  })
}

// Computed property to get classes for selected school
const classesForSelectedSchool = computed(() => {
  if (!currentStudent.schoolId) {
    console.log('No school selected')
    return []
  }

  const classes = studentsStore.classes[currentStudent.schoolId] || []
  console.log(`Classes for school ${currentStudent.schoolId}:`, classes)
  return classes
})

// Advanced filtering and search
const filteredStudents = computed(() => {
  let students = [...studentsStore.students]

  // Apply search filter
  if (debouncedSearchQuery.value.trim()) {
    const searchTerm = debouncedSearchQuery.value.toLowerCase().trim()
    students = students.filter((student) => {
      const nameMatch = student.name?.toLowerCase().includes(searchTerm)
      const usernameMatch = student.username?.toLowerCase().includes(searchTerm)
      const emailMatch = student.email?.toLowerCase().includes(searchTerm)
      const schoolMatch = student.school?.toLowerCase().includes(searchTerm)
      const classMatch = student.class?.toLowerCase().includes(searchTerm)
      const parentEmailMatch = student.parentEmail?.toLowerCase().includes(searchTerm)

      return (
        nameMatch || usernameMatch || emailMatch || schoolMatch || classMatch || parentEmailMatch
      )
    })
  }

  // Apply school filter
  if (selectedSchoolFilter.value && selectedSchoolFilter.value !== 'all') {
    students = students.filter((student) => student.schoolId === selectedSchoolFilter.value)
  }

  // Apply class filter
  if (selectedClassFilter.value && selectedClassFilter.value !== 'all') {
    students = students.filter((student) => student.classId === selectedClassFilter.value)
  }

  // Apply status filter (could be extended based on data structure)
  if (statusFilter.value) {
    // Example: filter by active/inactive status if available
    students = students.filter((student) => {
      // This can be customized based on actual status field
      return true
    })
  }

  // Apply sorting
  students.sort((a, b) => {
    let aValue, bValue

    switch (sortBy.value) {
      case 'name':
        aValue = (a.name || '').toLowerCase()
        bValue = (b.name || '').toLowerCase()
        break
      case 'username':
        aValue = (a.username || '').toLowerCase()
        bValue = (b.username || '').toLowerCase()
        break
      case 'school':
        aValue = (a.school || '').toLowerCase()
        bValue = (b.school || '').toLowerCase()
        break
      case 'class':
        aValue = (a.class || '').toLowerCase()
        bValue = (b.class || '').toLowerCase()
        break
      default:
        aValue = (a.name || '').toLowerCase()
        bValue = (b.name || '').toLowerCase()
    }

    if (sortOrder.value === 'desc') {
      return aValue < bValue ? 1 : -1
    }
    return aValue > bValue ? 1 : -1
  })

  return students
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredStudents.value.length / itemsPerPage.value))
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredStudents.value.slice(start, end)
})

// Statistics
const statistics = computed(() => ({
  total: studentsStore.students.length,
  filtered: filteredStudents.value.length,
  schools: new Set(studentsStore.students.map((s) => s.schoolId)).size,
  classes: new Set(studentsStore.students.map((s) => s.classId)).size,
}))

// Available classes for filtering
const availableClasses = computed(() => {
  const classMap = new Map()

  studentsStore.students.forEach((student) => {
    if (student.classId && student.class) {
      // Use Map to ensure uniqueness by classId
      classMap.set(student.classId, {
        id: student.classId,
        name: student.class,
      })
    }
  })

  // Convert Map values to array and sort by name
  return Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name))
})

// Search functionality
const handleSearchInput = () => {
  currentPage.value = 1

  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = searchQuery.value
  }, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
}

const clearAllFilters = () => {
  clearSearch()
  selectedSchoolFilter.value = 'all'
  selectedClassFilter.value = 'all'
  statusFilter.value = ''
  currentPage.value = 1
}

// Sorting functionality
const handleSort = (column) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
}

// Export functionality
const exportData = () => {
  try {
    if (filteredStudents.value.length === 0) {
      toast.info('Tiada data untuk dieksport')
      return
    }

    const data = filteredStudents.value.map((student) => ({
      Nama: student.name || '',
      'Nama Pengguna': student.username || '',
      Emel: student.email || '',
      Sekolah: student.school || '',
      Kelas: student.class || '',
      'Emel Ibu Bapa': student.parentEmail || '',
    }))

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pelajar-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success('Data telah dieksport')
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Gagal mengeksport data')
  }
}

// Watch for school changes to load classes
watch(
  () => currentStudent.schoolId,
  async (newSchoolId) => {
    if (newSchoolId) {
      await studentsStore.fetchClassesBySchool(newSchoolId)
      currentStudent.classId = ''
      currentStudent.class = ''
    }
  },
)

// Watch for search changes
watch(searchQuery, () => {
  handleSearchInput()
})

// Watch for filter changes to reset pagination
watch([selectedSchoolFilter, selectedClassFilter, statusFilter], () => {
  currentPage.value = 1
})

// Watch for filter changes to reset pagination
watch([selectedSchoolFilter, selectedClassFilter, statusFilter], () => {
  currentPage.value = 1
})

// Dialog and form management
const openAddDialog = () => {
  isEditing.value = false
  resetForm()
  showDialog.value = true
}

const openEditDialog = (student) => {
  isEditing.value = true
  Object.assign(currentStudent, { ...student, password: '' })

  if (student.schoolId && !studentsStore.classes[student.schoolId]) {
    studentsStore.fetchClassesBySchool(student.schoolId)
  }

  showDialog.value = true
}

const openViewDialog = (student) => {
  viewingStudent.value = student
  showViewDialog.value = true
}

const openDeleteDialog = (student) => {
  deletingStudent.value = student
  showDeleteDialog.value = true
}

const handleSubmit = async () => {
  isSaving.value = true
  let success = false

  try {
    if (isEditing.value) {
      success = await studentsStore.updateStudent(currentStudent)
    } else {
      success = await auth.registerStudentBackend(currentStudent)
      if (success) {
        await studentsStore.fetchStudents()
      }
    }

    if (success) {
      showDialog.value = false
      resetForm()
      toast.success('Berjaya', {
        description: `Pelajar berjaya ${isEditing.value ? 'dikemaskini' : 'ditambah'}.`,
      })
    } else {
      toast.error('Ralat', {
        description: auth.authError || studentsStore.error || 'Gagal menyimpan pelajar.',
      })
    }
  } catch (error) {
    console.error('Error saving student:', error)
    toast.error('Ralat', { description: error.message || 'Operasi gagal.' })
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = async () => {
  if (!deletingStudent.value) return

  isSaving.value = true
  try {
    const success = await studentsStore.deleteStudent(deletingStudent.value.id)
    if (success) {
      showDeleteDialog.value = false
      deletingStudent.value = null
      toast.success('Berjaya', { description: 'Pelajar berjaya dipadam.' })
    } else {
      toast.error('Ralat', { description: studentsStore.error || 'Gagal memadam pelajar.' })
    }
  } catch (error) {
    console.error('Error deleting student:', error)
    toast.error('Ralat', { description: error.message || 'Gagal memadam pelajar.' })
  } finally {
    isSaving.value = false
  }
}

const refreshData = async () => {
  isLoading.value = true
  try {
    await Promise.all([studentsStore.fetchStudents(), studentsStore.fetchSchools()])
    toast.success('Data telah dimuat semula')
  } catch (error) {
    console.error('Error refreshing data:', error)
    toast.error('Gagal memuat semula data')
  } finally {
    isLoading.value = false
  }
}

// Handlers for form dropdowns
const handleSchoolChange = async () => {
  console.log('School changed to:', currentStudent.schoolId)
  const selectedSchool = studentsStore.schools.find((s) => s.id === currentStudent.schoolId)
  if (selectedSchool) {
    currentStudent.school = selectedSchool.name
    console.log('Selected school name:', selectedSchool.name)
  }

  // Reset class selection
  currentStudent.classId = ''
  currentStudent.class = ''

  // Fetch classes for the selected school
  if (currentStudent.schoolId) {
    console.log('Fetching classes for school:', currentStudent.schoolId)
    await studentsStore.fetchClassesBySchool(currentStudent.schoolId)
    console.log('Classes after fetch:', studentsStore.classes[currentStudent.schoolId])
  }
}

const handleClassChange = () => {
  console.log('Class changed to:', currentStudent.classId)
  const selectedClass = classesForSelectedSchool.value.find((c) => c.id === currentStudent.classId)
  if (selectedClass) {
    currentStudent.class = selectedClass.name
    console.log('Selected class name:', selectedClass.name)
  }
}

// Initialize data
onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([studentsStore.fetchStudents(), studentsStore.fetchSchools()])
    console.log('Loaded students:', studentsStore.students)
    console.log('Loaded schools:', studentsStore.schools)
    console.log('Schools array length:', studentsStore.schools.length)
    console.log('First school:', studentsStore.schools[0])
  } catch (error) {
    console.error('Error loading data:', error)
    toast.error('Ralat', { description: studentsStore.error || error.message })
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="bg-gray-50/50">
    <!-- Header Section -->
    <div class="border-b border-gray-200">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-gray-900">Pengurusan Pelajar</h1>
            <p class="mt-1 text-sm text-gray-600">Urus maklumat pelajar dan pantau pendaftaran</p>
          </div>
          <div class="flex items-center gap-3">
            <Button @click="openAddDialog" variant="default">
              <Plus class="mr-2 h-4 w-4" />
              Tambah Pelajar
            </Button>
            <Button @click="exportData" variant="outline" :disabled="isLoading">
              <Download class="mr-2 h-4 w-4" />
              Eksport Data
            </Button>
            <Button @click="refreshData" variant="outline" size="sm" :disabled="isLoading">
              <RefreshCw :class="{ 'animate-spin': isLoading }" class="mr-2 h-4 w-4" />
              Muat Semula
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div class="px-6 py-6 space-y-6">
      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <Users class="h-8 w-8 text-blue-600" />
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Jumlah Pelajar</p>
                <p class="text-2xl font-bold">{{ statistics.total }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <Search class="h-8 w-8 text-green-600" />
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Hasil Carian</p>
                <p class="text-2xl font-bold">{{ statistics.filtered }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <School class="h-8 w-8 text-purple-600" />
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Sekolah Aktif</p>
                <p class="text-2xl font-bold">{{ statistics.schools }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <GraduationCap class="h-8 w-8 text-orange-600" />
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Kelas Aktif</p>
                <p class="text-2xl font-bold">{{ statistics.classes }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Search and Filter Controls -->
      <Card>
        <CardHeader>
          <CardTitle>Carian & Penapis</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- Search Bar -->
            <div class="flex flex-col md:flex-row gap-4">
              <div class="flex-1">
                <Label for="search">Cari Pelajar</Label>
                <div class="relative">
                  <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    v-model="searchQuery"
                    placeholder="Cari nama, username, emel, sekolah, atau kelas..."
                    class="pl-9 pr-9"
                  />
                  <Button
                    v-if="searchQuery"
                    variant="ghost"
                    size="sm"
                    class="absolute right-1 top-1 h-7 w-7 p-0"
                    @click="clearSearch"
                  >
                    <X class="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <!-- Filters -->
            <div class="flex flex-col md:flex-row gap-4">
              <div class="md:w-48">
                <Label for="schoolFilter">Sekolah</Label>
                <Select v-model="selectedSchoolFilter">
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Sekolah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Sekolah</SelectItem>
                    <SelectItem
                      v-for="school in studentsStore.schools"
                      :key="school.id"
                      :value="school.id"
                    >
                      {{ school.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="md:w-48">
                <Label for="classFilter">Kelas</Label>
                <Select v-model="selectedClassFilter">
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    <SelectItem
                      v-for="classItem in availableClasses"
                      :key="classItem.id"
                      :value="classItem.id"
                    >
                      {{ classItem.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="md:w-32">
                <Label for="sortBy">Susun</Label>
                <Select v-model="sortBy">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nama</SelectItem>
                    <SelectItem value="username">Username</SelectItem>
                    <SelectItem value="school">Sekolah</SelectItem>
                    <SelectItem value="class">Kelas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="md:w-24">
                <Label for="sortOrder">Urutan</Label>
                <Select v-model="sortOrder">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">A-Z</SelectItem>
                    <SelectItem value="desc">Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="flex items-end">
                <Button variant="outline" @click="clearAllFilters">
                  <X class="mr-2 h-4 w-4" />
                  Kosongkan
                </Button>
              </div>
            </div>

            <!-- Active Filters Display -->
            <div
              v-if="
                debouncedSearchQuery ||
                (selectedSchoolFilter && selectedSchoolFilter !== 'all') ||
                (selectedClassFilter && selectedClassFilter !== 'all')
              "
              class="flex flex-wrap gap-2"
            >
              <Badge v-if="debouncedSearchQuery" variant="secondary" class="gap-1">
                Carian: "{{ debouncedSearchQuery }}"
                <Button variant="ghost" size="sm" class="h-auto p-0 ml-1" @click="clearSearch">
                  <X class="h-3 w-3" />
                </Button>
              </Badge>
              <Badge
                v-if="selectedSchoolFilter && selectedSchoolFilter !== 'all'"
                variant="secondary"
                class="gap-1"
              >
                Sekolah:
                {{ studentsStore.schools.find((s) => s.id === selectedSchoolFilter)?.name }}
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-auto p-0 ml-1"
                  @click="selectedSchoolFilter = 'all'"
                >
                  <X class="h-3 w-3" />
                </Button>
              </Badge>
              <Badge
                v-if="selectedClassFilter && selectedClassFilter !== 'all'"
                variant="secondary"
                class="gap-1"
              >
                Kelas: {{ availableClasses.find((c) => c.id === selectedClassFilter)?.name }}
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-auto p-0 ml-1"
                  @click="selectedClassFilter = 'all'"
                >
                  <X class="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Add/Edit Student Dialog -->
      <Dialog v-model:open="showDialog">
        <DialogContent class="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{{ isEditing ? 'Sunting Pelajar' : 'Tambah Pelajar Baharu' }}</DialogTitle>
            <DialogDescription>
              {{
                isEditing
                  ? 'Kemas kini maklumat pelajar sedia ada.'
                  : 'Tambah rekod pelajar baharu ke dalam sistem.'
              }}
            </DialogDescription>
          </DialogHeader>
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label for="name">Nama Penuh <span class="text-red-500">*</span></Label>
                <Input
                  id="name"
                  v-model="currentStudent.name"
                  placeholder="Masukkan nama penuh pelajar"
                  required
                />
              </div>
              <div>
                <Label for="username">Nama Pengguna <span class="text-red-500">*</span></Label>
                <Input
                  id="username"
                  v-model="currentStudent.username"
                  placeholder="Masukkan nama pengguna"
                  required
                />
              </div>
            </div>

            <div>
              <Label for="email">Alamat Emel <span class="text-red-500">*</span></Label>
              <Input
                id="email"
                v-model="currentStudent.email"
                type="email"
                placeholder="contoh@emel.com"
                required
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label for="school">Sekolah <span class="text-red-500">*</span></Label>
                <Select
                  v-model="currentStudent.schoolId"
                  required
                  @update:modelValue="handleSchoolChange"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sekolah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="school in studentsStore.schools"
                      :key="school.id"
                      :value="school.id"
                    >
                      {{ school.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p class="text-xs text-muted-foreground mt-1">
                  {{ studentsStore.schools.length }} sekolah tersedia
                </p>
              </div>

              <div>
                <Label for="class">Kelas <span class="text-red-500">*</span></Label>
                <Select
                  v-model="currentStudent.classId"
                  required
                  :disabled="!currentStudent.schoolId"
                  @update:modelValue="handleClassChange"
                >
                  <SelectTrigger>
                    <SelectValue
                      :placeholder="
                        currentStudent.schoolId ? 'Pilih kelas' : 'Pilih sekolah dahulu'
                      "
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="classItem in classesForSelectedSchool"
                      :key="classItem.id"
                      :value="classItem.id"
                    >
                      {{ classItem.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p class="text-xs text-muted-foreground mt-1">
                  {{
                    currentStudent.schoolId
                      ? `${classesForSelectedSchool.length} kelas tersedia`
                      : 'Pilih sekolah untuk melihat kelas'
                  }}
                </p>
              </div>
            </div>

            <div>
              <Label for="parentEmail">Emel Ibu Bapa</Label>
              <Input
                id="parentEmail"
                v-model="currentStudent.parentEmail"
                type="email"
                placeholder="emel_ibubapa@contoh.com"
              />
            </div>

            <div>
              <Label for="password">
                Kata Laluan
                <span v-if="!isEditing" class="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                v-model="currentStudent.password"
                type="password"
                :placeholder="
                  isEditing ? 'Biarkan kosong jika tidak mahu tukar' : 'Masukkan kata laluan'
                "
                :required="!isEditing"
              />
              <p v-if="!isEditing" class="text-xs text-muted-foreground mt-1">
                Kata laluan diperlukan untuk pelajar baharu.
              </p>
              <p v-if="isEditing" class="text-xs text-amber-600 mt-1">
                Kosongkan jika tidak mahu menukar kata laluan sedia ada.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                @click="showDialog = false"
                :disabled="isSaving"
              >
                Batal
              </Button>
              <Button type="submit" :disabled="isSaving">
                <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
                {{ isEditing ? 'Simpan Perubahan' : 'Tambah Pelajar' }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <!-- View Student Dialog -->
      <Dialog v-model:open="showViewDialog">
        <DialogContent class="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Butiran Pelajar</DialogTitle>
            <DialogDescription>
              Maklumat terperinci untuk {{ viewingStudent?.name }}
            </DialogDescription>
          </DialogHeader>
          <div v-if="viewingStudent" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label class="text-sm font-medium">Nama Penuh</Label>
                <p class="text-sm text-muted-foreground">{{ viewingStudent.name }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium">Nama Pengguna</Label>
                <p class="text-sm text-muted-foreground">{{ viewingStudent.username }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium">Alamat Emel</Label>
                <p class="text-sm text-muted-foreground">{{ viewingStudent.email }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium">Emel Ibu Bapa</Label>
                <p class="text-sm text-muted-foreground">
                  {{ viewingStudent.parentEmail || 'Tidak ditetapkan' }}
                </p>
              </div>
              <div>
                <Label class="text-sm font-medium">Sekolah</Label>
                <p class="text-sm text-muted-foreground">{{ viewingStudent.school }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium">Kelas</Label>
                <p class="text-sm text-muted-foreground">{{ viewingStudent.class }}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="showViewDialog = false">Tutup</Button>
            <Button
              @click="
                () => {
                  showViewDialog = false
                  openEditDialog(viewingStudent)
                }
              "
            >
              <Pencil class="mr-2 h-4 w-4" />
              Edit Pelajar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Delete Confirmation Dialog -->
      <Dialog v-model:open="showDeleteDialog">
        <DialogContent class="max-w-md">
          <DialogHeader>
            <DialogTitle>Padam Pelajar</DialogTitle>
            <DialogDescription>
              Adakah anda pasti ingin memadam pelajar "{{ deletingStudent?.name }}"?
            </DialogDescription>
          </DialogHeader>
          <div class="py-4">
            <Alert variant="destructive">
              <AlertCircle class="h-4 w-4" />
              <AlertTitle>Amaran</AlertTitle>
              <AlertDescription>
                Tindakan ini tidak boleh dibatalkan. Semua data yang berkaitan dengan pelajar ini
                akan turut dipadam.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="showDeleteDialog = false" :disabled="isSaving">
              Batal
            </Button>
            <Button variant="destructive" @click="confirmDelete" :disabled="isSaving">
              <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
              Ya, Padam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="text-center">
          <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" />
          <p class="text-muted-foreground">Memuat data pelajar...</p>
        </div>
      </div>

      <!-- Error State -->
      <Alert v-else-if="studentsStore.error" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Ralat</AlertTitle>
        <AlertDescription>{{ studentsStore.error }}</AlertDescription>
      </Alert>

      <!-- No Data State -->
      <Card v-else-if="filteredStudents.length === 0 && !isLoading">
        <CardContent class="text-center py-12">
          <Users class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-semibold mb-2">Tiada Pelajar Dijumpai</h3>
          <p class="text-muted-foreground mb-4">
            {{
              debouncedSearchQuery ||
              (selectedSchoolFilter && selectedSchoolFilter !== 'all') ||
              (selectedClassFilter && selectedClassFilter !== 'all')
                ? 'Tiada pelajar yang sepadan dengan carian anda.'
                : 'Belum ada pelajar yang didaftarkan.'
            }}
          </p>
          <Button
            v-if="
              debouncedSearchQuery ||
              (selectedSchoolFilter && selectedSchoolFilter !== 'all') ||
              (selectedClassFilter && selectedClassFilter !== 'all')
            "
            @click="clearAllFilters"
            variant="outline"
          >
            Kosongkan Carian
          </Button>
          <Button v-else @click="openAddDialog">
            <Plus class="mr-2 h-4 w-4" />
            Tambah Pelajar Pertama
          </Button>
        </CardContent>
      </Card>

      <!-- Students Table -->
      <Card v-else>
        <CardHeader>
          <CardTitle>Senarai Pelajar</CardTitle>
          <CardDescription>
            Menunjukkan {{ paginatedStudents.length }} daripada
            {{ filteredStudents.length }} pelajar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="cursor-pointer" @click="handleSort('name')">
                    <div class="flex items-center">
                      Nama
                      <SortAsc
                        v-if="sortBy === 'name' && sortOrder === 'asc'"
                        class="ml-2 h-4 w-4"
                      />
                      <SortDesc
                        v-else-if="sortBy === 'name' && sortOrder === 'desc'"
                        class="ml-2 h-4 w-4"
                      />
                      <ChevronDown v-else class="ml-2 h-4 w-4 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead class="cursor-pointer" @click="handleSort('username')">
                    <div class="flex items-center">
                      Username
                      <SortAsc
                        v-if="sortBy === 'username' && sortOrder === 'asc'"
                        class="ml-2 h-4 w-4"
                      />
                      <SortDesc
                        v-else-if="sortBy === 'username' && sortOrder === 'desc'"
                        class="ml-2 h-4 w-4"
                      />
                      <ChevronDown v-else class="ml-2 h-4 w-4 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead>Emel</TableHead>
                  <TableHead class="cursor-pointer" @click="handleSort('school')">
                    <div class="flex items-center">
                      Sekolah
                      <SortAsc
                        v-if="sortBy === 'school' && sortOrder === 'asc'"
                        class="ml-2 h-4 w-4"
                      />
                      <SortDesc
                        v-else-if="sortBy === 'school' && sortOrder === 'desc'"
                        class="ml-2 h-4 w-4"
                      />
                      <ChevronDown v-else class="ml-2 h-4 w-4 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead class="cursor-pointer" @click="handleSort('class')">
                    <div class="flex items-center">
                      Kelas
                      <SortAsc
                        v-if="sortBy === 'class' && sortOrder === 'asc'"
                        class="ml-2 h-4 w-4"
                      />
                      <SortDesc
                        v-else-if="sortBy === 'class' && sortOrder === 'desc'"
                        class="ml-2 h-4 w-4"
                      />
                      <ChevronDown v-else class="ml-2 h-4 w-4 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead>Emel Ibu Bapa</TableHead>
                  <TableHead class="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="paginatedStudents.length === 0">
                  <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
                    Tiada data pelajar
                  </TableCell>
                </TableRow>
                <TableRow
                  v-for="student in paginatedStudents"
                  :key="student.id"
                  class="hover:bg-muted/50"
                >
                  <TableCell class="font-medium">{{ student.name }}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{{ student.username }}</Badge>
                  </TableCell>
                  <TableCell class="text-sm">{{ student.email }}</TableCell>
                  <TableCell>
                    <div class="flex items-center">
                      <School class="h-4 w-4 mr-2 text-blue-600" />
                      {{ student.school }}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center">
                      <GraduationCap class="h-4 w-4 mr-2 text-green-600" />
                      {{ student.class }}
                    </div>
                  </TableCell>
                  <TableCell class="text-sm">{{ student.parentEmail || '-' }}</TableCell>
                  <TableCell class="text-right">
                    <div class="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" @click="openViewDialog(student)">
                        <Eye class="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" @click="openEditDialog(student)">
                        <Pencil class="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        @click="openDeleteDialog(student)"
                        class="text-red-600 hover:text-red-700"
                      >
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex justify-between items-center mt-4">
            <div class="text-sm text-muted-foreground">
              Menunjukkan {{ (currentPage - 1) * itemsPerPage + 1 }} hingga
              {{ Math.min(currentPage * itemsPerPage, filteredStudents.length) }}
              daripada {{ filteredStudents.length }} hasil
            </div>
            <div class="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                <ChevronLeft class="h-4 w-4" />
                Sebelum
              </Button>
              <span class="text-sm"> Halaman {{ currentPage }} daripada {{ totalPages }} </span>
              <Button
                variant="outline"
                size="sm"
                :disabled="currentPage === totalPages"
                @click="currentPage++"
              >
                Seterusnya
                <ChevronRight class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
