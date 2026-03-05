<script setup>
import { ref, onMounted, computed, watch, reactive } from 'vue'
import { useTeachersStore } from '@/stores/teachers'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  RefreshCw,
  Eye,
  Users,
  GraduationCap,
  School,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  Loader2,
  SortAsc,
  SortDesc,
  Filter,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const teachersStore = useTeachersStore()

// State management
const isLoading = ref(true)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const showViewDialog = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const deletingTeacher = ref(null)
const viewingTeacher = ref(null)

// Search and filter state
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const schoolFilter = ref('')
const sortBy = ref('name')
const sortOrder = ref('asc')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Debounce search
let searchTimeout = null

// Teacher form data
const currentTeacher = reactive({
  id: '',
  name: '',
  school: '',
  schoolId: '',
  class: '',
  classId: '',
  experience: '',
  email: '',
  phone: '',
  password: '',
  username: '',
})

// Reset form
const resetForm = () => {
  Object.assign(currentTeacher, {
    id: '',
    name: '',
    school: '',
    schoolId: '',
    class: '',
    classId: '',
    experience: '',
    email: '',
    phone: '',
    password: '',
    username: '',
  })
}

// Enhanced filtering and search
const filteredTeachers = computed(() => {
  let teachers = [...(teachersStore.teachers || [])]

  // Apply search filter
  if (debouncedSearchQuery.value.trim()) {
    const searchTerm = debouncedSearchQuery.value.toLowerCase().trim()
    teachers = teachers.filter((teacher) => {
      const nameMatch = teacher.name?.toLowerCase().includes(searchTerm)
      const emailMatch = teacher.email?.toLowerCase().includes(searchTerm)
      const phoneMatch = teacher.phone?.toLowerCase().includes(searchTerm)
      const schoolMatch = teacher.school?.toLowerCase().includes(searchTerm)
      const classMatch = teacher.class?.toLowerCase().includes(searchTerm)

      return nameMatch || emailMatch || phoneMatch || schoolMatch || classMatch
    })
  }

  // Apply school filter
  if (schoolFilter.value && schoolFilter.value !== 'all') {
    teachers = teachers.filter((teacher) => teacher.schoolId === schoolFilter.value)
  }

  // Apply sorting
  teachers.sort((a, b) => {
    let aValue, bValue

    switch (sortBy.value) {
      case 'name':
        aValue = (a.name || '').toLowerCase()
        bValue = (b.name || '').toLowerCase()
        break
      case 'email':
        aValue = (a.email || '').toLowerCase()
        bValue = (b.email || '').toLowerCase()
        break
      case 'school':
        aValue = (a.school || '').toLowerCase()
        bValue = (b.school || '').toLowerCase()
        break
      case 'experience':
        aValue = parseInt(a.experience) || 0
        bValue = parseInt(b.experience) || 0
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

  return teachers
})

// Pagination
const totalPages = computed(() =>
  Math.ceil(filteredTeachers.value.length / parseInt(itemsPerPage.value)),
)
const paginatedTeachers = computed(() => {
  const start = (currentPage.value - 1) * parseInt(itemsPerPage.value)
  const end = start + parseInt(itemsPerPage.value)
  return filteredTeachers.value.slice(start, end)
})

// Statistics
const statistics = computed(() => ({
  total: teachersStore.teachers?.length || 0,
  filtered: filteredTeachers.value.length,
  schools: new Set((teachersStore.teachers || []).map((t) => t.schoolId)).size,
}))

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
  schoolFilter.value = ''
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
    if (filteredTeachers.value.length === 0) {
      toast.info('Tiada data untuk dieksport')
      return
    }

    const data = filteredTeachers.value.map((teacher) => ({
      Nama: teacher.name || '',
      Emel: teacher.email || '',
      Telefon: teacher.phone || '',
      Sekolah: teacher.school || '',
      Kelas: teacher.class || '',
      Pengalaman: teacher.experience || '',
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
    a.download = `guru-${new Date().toISOString().split('T')[0]}.csv`
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

// Watch for search changes
watch(searchQuery, () => {
  handleSearchInput()
})

// Watch for filter changes to reset pagination
watch([schoolFilter, itemsPerPage], () => {
  currentPage.value = 1
})

// Computed property to get classes for selected school
const classesForSelectedSchool = computed(() => {
  if (!currentTeacher.schoolId) return []
  return teachersStore.classes[currentTeacher.schoolId] || []
})

// Watch for school changes to load classes
watch(
  () => currentTeacher.schoolId,
  async (newSchoolId) => {
    if (newSchoolId) {
      await teachersStore.fetchClassesBySchool(newSchoolId)

      // Reset class selection when school changes
      currentTeacher.classId = ''
      currentTeacher.class = ''
    }
  },
)

// Dialog and form management
const openAddDialog = () => {
  isEditing.value = false
  resetForm()
  showDialog.value = true
}

const openEditDialog = (teacher) => {
  isEditing.value = true
  Object.assign(currentTeacher, { ...teacher })

  // Load classes for this school if not already loaded
  if (teacher.schoolId && !teachersStore.classes[teacher.schoolId]) {
    teachersStore.fetchClassesBySchool(teacher.schoolId)
  }

  showDialog.value = true
}

const openViewDialog = (teacher) => {
  viewingTeacher.value = teacher
  showViewDialog.value = true
}

const openDeleteDialog = (teacher) => {
  deletingTeacher.value = teacher
  showDeleteDialog.value = true
}

const handleSubmit = async () => {
  isSaving.value = true

  try {
    if (isEditing.value) {
      const success = await teachersStore.updateTeacher(currentTeacher)
      if (success) {
        showDialog.value = false
        resetForm()
        toast.success('Berjaya', {
          description: 'Guru berjaya dikemaskini.',
        })
      } else {
        toast.error('Ralat', { description: teachersStore.error || 'Gagal mengemaskini guru.' })
      }
    } else {
      // Require password for new teacher
      if (!currentTeacher.password) {
        toast.error('Ralat', {
          description: 'Kata laluan diperlukan untuk pendaftaran guru baharu.',
        })
        return
      }
      // Auto-generate username from email if not provided
      if (!currentTeacher.username) {
        currentTeacher.username = currentTeacher.email.split('@')[0]
      }

      const success = await teachersStore.createTeacher(currentTeacher)
      if (success) {
        showDialog.value = false
        resetForm()
        toast.success('Berjaya', {
          description: 'Guru berjaya ditambah.',
        })
      } else {
        toast.error('Ralat', { description: teachersStore.error || 'Gagal menambah guru.' })
      }
    }
  } catch (error) {
    console.error('Error saving teacher:', error)
    toast.error('Ralat', { description: error.message || 'Operasi gagal.' })
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = async () => {
  if (!deletingTeacher.value) return

  isSaving.value = true
  try {
    const success = await teachersStore.deleteTeacher(deletingTeacher.value.id)
    if (success) {
      showDeleteDialog.value = false
      deletingTeacher.value = null
      toast.success('Berjaya', { description: 'Guru berjaya dipadam.' })
    } else {
      toast.error('Ralat', { description: teachersStore.error || 'Gagal memadam guru.' })
    }
  } catch (error) {
    console.error('Error deleting teacher:', error)
    toast.error('Ralat', { description: error.message || 'Gagal memadam guru.' })
  } finally {
    isSaving.value = false
  }
}

const handleSchoolChange = (schoolId) => {
  const selectedSchool = teachersStore.schools.find((s) => s.id === schoolId)
  if (selectedSchool) {
    currentTeacher.school = selectedSchool.name
    console.log(`Selected school: ${selectedSchool.name} (${selectedSchool.id})`)
  }
  // Load classes for the selected school
  if (schoolId) {
    teachersStore.fetchClassesBySchool(schoolId)
  }
}

const handleClassChange = (classId) => {
  const selectedClass = classesForSelectedSchool.value.find((c) => c.id === classId)
  if (selectedClass) {
    currentTeacher.class = selectedClass.name
    console.log(`Selected class: ${selectedClass.name} (${selectedClass.id})`)
  }
}

const refreshData = async () => {
  isLoading.value = true
  try {
    await Promise.all([teachersStore.fetchTeachers(), teachersStore.fetchSchools()])
    toast.success('Data telah dimuat semula')
  } catch (error) {
    console.error('Error refreshing data:', error)
    toast.error('Gagal memuat semula data')
  } finally {
    isLoading.value = false
  }
}

// Initialize data
onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([teachersStore.fetchTeachers(), teachersStore.fetchSchools()])

    if (teachersStore.error) {
      toast.error('Ralat', { description: teachersStore.error })
    }
  } catch (error) {
    console.error('Error loading data:', error)
    toast.error('Ralat', { description: error.message })
  } finally {
    isLoading.value = false
  }
})

// Computed properties
const schools = computed(() => teachersStore.schools || [])

// Computed properties for select display values
const selectedSchoolName = computed(() => {
  if (!schoolFilter.value) return 'Semua Sekolah'
  return schools.value.find((s) => s.id === schoolFilter.value)?.name || 'Semua Sekolah'
})

const selectedFormSchoolName = computed(() => {
  if (!currentTeacher.schoolId) return 'Pilih Sekolah'
  return schools.value.find((s) => s.id === currentTeacher.schoolId)?.name || 'Pilih Sekolah'
})
</script>

<template>
  <div class="bg-gray-50/50">
    <!-- Header Section -->
    <div class="border-b border-gray-200">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-gray-900">Pengurusan Guru</h1>
            <p class="mt-1 text-sm text-gray-600">Urus maklumat guru dan tugasan kelas</p>
          </div>
          <div class="flex items-center gap-3">
            <Button @click="openAddDialog" variant="default">
              <Plus class="mr-2 h-4 w-4" />
              Tambah Guru
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
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <GraduationCap class="h-8 w-8 text-blue-600" />
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Jumlah Guru</p>
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
                <Label for="search">Cari Guru</Label>
                <div class="relative">
                  <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    v-model="searchQuery"
                    placeholder="Cari nama, emel, telefon, sekolah, atau kelas..."
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
                <Select v-model="schoolFilter">
                  <SelectTrigger>
                    <SelectValue>{{ selectedSchoolName }}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Sekolah</SelectItem>
                    <SelectItem
                      v-for="(school, index) in schools"
                      :key="`filter-${index}`"
                      :value="school.id"
                    >
                      {{ school.name }}
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
                    <SelectItem value="email">Emel</SelectItem>
                    <SelectItem value="school">Sekolah</SelectItem>
                    <SelectItem value="experience">Pengalaman</SelectItem>
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
            <div v-if="debouncedSearchQuery || schoolFilter" class="flex flex-wrap gap-2">
              <Badge v-if="debouncedSearchQuery" variant="secondary" class="gap-1">
                Carian: "{{ debouncedSearchQuery }}"
                <Button variant="ghost" size="sm" class="h-auto p-0 ml-1" @click="clearSearch">
                  <X class="h-3 w-3" />
                </Button>
              </Badge>
              <Badge v-if="schoolFilter" variant="secondary" class="gap-1">
                Sekolah: {{ schools.find((s, index) => s.id === schoolFilter)?.name }}
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-auto p-0 ml-1"
                  @click="schoolFilter = ''"
                >
                  <X class="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Data Table -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            <span>Senarai Guru</span>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{{ paginatedTeachers.length }} daripada {{ statistics.filtered }} rekod</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <!-- Loading State -->
          <div v-if="isLoading" class="flex items-center justify-center py-12">
            <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
            <span class="ml-2 text-muted-foreground">Memuat data...</span>
          </div>

          <!-- Error State -->
          <Alert v-else-if="teachersStore.error" variant="destructive" class="mb-6">
            <AlertCircle class="h-4 w-4" />
            <AlertTitle>Ralat</AlertTitle>
            <AlertDescription>{{ teachersStore.error }}</AlertDescription>
          </Alert>

          <!-- Empty State -->
          <div v-else-if="filteredTeachers.length === 0" class="text-center py-12">
            <GraduationCap class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 class="text-lg font-semibold mb-2">Tiada Data Ditemui</h3>
            <p class="text-muted-foreground mb-4">
              {{
                debouncedSearchQuery
                  ? 'Tiada hasil carian yang sepadan.'
                  : 'Belum ada guru didaftarkan.'
              }}
            </p>
            <Button v-if="!debouncedSearchQuery" @click="openAddDialog">
              <Plus class="mr-2 h-4 w-4" />
              Tambah Guru Pertama
            </Button>
            <Button v-else variant="outline" @click="clearAllFilters">
              <X class="mr-2 h-4 w-4" />
              Kosongkan Carian
            </Button>
          </div>

          <!-- Data Table -->
          <div v-else class="space-y-4">
            <div class="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="cursor-pointer" @click="handleSort('name')">
                      <div class="flex items-center gap-2">
                        Nama
                        <SortAsc v-if="sortBy === 'name' && sortOrder === 'asc'" class="h-4 w-4" />
                        <SortDesc
                          v-else-if="sortBy === 'name' && sortOrder === 'desc'"
                          class="h-4 w-4"
                        />
                        <ChevronDown v-else class="h-4 w-4 opacity-50" />
                      </div>
                    </TableHead>
                    <TableHead class="cursor-pointer" @click="handleSort('school')">
                      <div class="flex items-center gap-2">
                        Sekolah
                        <SortAsc
                          v-if="sortBy === 'school' && sortOrder === 'asc'"
                          class="h-4 w-4"
                        />
                        <SortDesc
                          v-else-if="sortBy === 'school' && sortOrder === 'desc'"
                          class="h-4 w-4"
                        />
                        <ChevronDown v-else class="h-4 w-4 opacity-50" />
                      </div>
                    </TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead class="cursor-pointer" @click="handleSort('experience')">
                      <div class="flex items-center gap-2">
                        Pengalaman
                        <SortAsc
                          v-if="sortBy === 'experience' && sortOrder === 'asc'"
                          class="h-4 w-4"
                        />
                        <SortDesc
                          v-else-if="sortBy === 'experience' && sortOrder === 'desc'"
                          class="h-4 w-4"
                        />
                        <ChevronDown v-else class="h-4 w-4 opacity-50" />
                      </div>
                    </TableHead>
                    <TableHead class="cursor-pointer" @click="handleSort('email')">
                      <div class="flex items-center gap-2">
                        Emel
                        <SortAsc v-if="sortBy === 'email' && sortOrder === 'asc'" class="h-4 w-4" />
                        <SortDesc
                          v-else-if="sortBy === 'email' && sortOrder === 'desc'"
                          class="h-4 w-4"
                        />
                        <ChevronDown v-else class="h-4 w-4 opacity-50" />
                      </div>
                    </TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead class="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="teacher in paginatedTeachers"
                    :key="teacher.id"
                    class="hover:bg-muted/50"
                  >
                    <TableCell class="font-medium">
                      <div class="flex items-center gap-2">
                        <div
                          class="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center"
                        >
                          <span class="text-sm font-semibold text-primary">
                            {{ (teacher.name || '').charAt(0).toUpperCase() }}
                          </span>
                        </div>
                        {{ teacher.name || 'Tiada Nama' }}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-2 text-sm">
                        <School class="h-4 w-4 text-muted-foreground" />
                        {{ teacher.school || 'Tiada Sekolah' }}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{{ teacher.class || 'Tiada Kelas' }}</Badge>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-1">
                        <span>{{ teacher.experience || '0' }}</span>
                        <span class="text-xs text-muted-foreground">tahun</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-2 text-sm">
                        <Mail class="h-4 w-4 text-muted-foreground" />
                        {{ teacher.email || 'Tiada Emel' }}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-2 text-sm">
                        <Phone class="h-4 w-4 text-muted-foreground" />
                        {{ teacher.phone || 'Tiada Telefon' }}
                      </div>
                    </TableCell>
                    <TableCell class="text-right">
                      <div class="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" @click="openViewDialog(teacher)">
                          <Eye class="h-4 w-4" />
                          <span class="sr-only">Lihat</span>
                        </Button>
                        <Button variant="ghost" size="sm" @click="openEditDialog(teacher)">
                          <Pencil class="h-4 w-4" />
                          <span class="sr-only">Sunting</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          @click="openDeleteDialog(teacher)"
                          class="text-destructive hover:text-destructive"
                        >
                          <Trash2 class="h-4 w-4" />
                          <span class="sr-only">Padam</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Label for="itemsPerPage" class="text-sm">Rekod per halaman:</Label>
                <Select v-model="itemsPerPage">
                  <SelectTrigger class="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-sm text-muted-foreground">
                  Halaman {{ currentPage }} daripada {{ totalPages }}
                </span>
                <div class="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="currentPage === 1"
                    @click="currentPage = Math.max(1, currentPage - 1)"
                  >
                    <ChevronLeft class="h-4 w-4" />
                    <span class="sr-only">Halaman sebelumnya</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="currentPage === totalPages"
                    @click="currentPage = Math.min(totalPages, currentPage + 1)"
                  >
                    <ChevronRight class="h-4 w-4" />
                    <span class="sr-only">Halaman seterusnya</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Add/Edit Dialog -->
      <Dialog v-model:open="showDialog">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{{ isEditing ? 'Sunting Guru' : 'Tambah Guru Baharu' }}</DialogTitle>
            <DialogDescription>
              {{
                isEditing
                  ? 'Kemas kini maklumat guru sedia ada.'
                  : 'Tambah rekod guru baharu ke dalam sistem.'
              }}
            </DialogDescription>
          </DialogHeader>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div v-if="teachersStore.error && !isEditing" class="text-red-600 text-sm mb-2">
              {{ teachersStore.error }}
            </div>
            <div>
              <Label for="name">Nama</Label>
              <Input
                id="name"
                v-model="currentTeacher.name"
                placeholder="Masukkan nama penuh"
                required
              />
            </div>
            <div>
              <Label for="email">E-mel</Label>
              <Input
                id="email"
                v-model="currentTeacher.email"
                type="email"
                placeholder="contoh@email.com"
                required
              />
            </div>
            <div>
              <Label for="username">Nama Pengguna (Opsyenal)</Label>
              <Input
                id="username"
                v-model="currentTeacher.username"
                placeholder="Auto dari emel jika kosong"
              />
            </div>
            <div>
              <Label for="school">Sekolah</Label>
              <Select v-model="currentTeacher.schoolId" @update:modelValue="handleSchoolChange">
                <SelectTrigger>
                  <SelectValue>{{ selectedFormSchoolName }}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="(school, index) in schools"
                    :key="`form-${index}`"
                    :value="school.id"
                  >
                    {{ school.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label for="class">Kelas</Label>
              <Select
                v-model="currentTeacher.classId"
                :disabled="!currentTeacher.schoolId"
                @update:modelValue="handleClassChange"
              >
                <SelectTrigger>
                  <SelectValue
                    :placeholder="currentTeacher.schoolId ? 'Pilih Kelas' : 'Pilih Sekolah Dahulu'"
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
            </div>
            <div>
              <Label for="experience">Pengalaman (Tahun)</Label>
              <Input
                id="experience"
                v-model="currentTeacher.experience"
                type="number"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <Label for="phone">No. Telefon</Label>
              <Input id="phone" v-model="currentTeacher.phone" placeholder="012-345-6789" />
            </div>
            <div v-if="!isEditing">
              <Label for="password">Kata Laluan</Label>
              <Input
                id="password"
                v-model="currentTeacher.password"
                type="password"
                placeholder="Minimum 6 aksara"
                minlength="6"
                required
              />
              <p class="text-xs text-muted-foreground mt-1">
                Kata laluan akan digunakan untuk log masuk ke sistem.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" @click="showDialog = false"> Batal </Button>
              <Button type="submit" :disabled="isSaving">
                <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
                {{ isEditing ? 'Simpan Perubahan' : 'Tambah Guru' }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <!-- View Dialog -->
      <Dialog v-model:open="showViewDialog">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Maklumat Guru</DialogTitle>
            <DialogDescription> Lihat maklumat lengkap guru </DialogDescription>
          </DialogHeader>
          <div v-if="viewingTeacher" class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span class="text-lg font-semibold text-primary">
                  {{ (viewingTeacher.name || '').charAt(0).toUpperCase() }}
                </span>
              </div>
              <div>
                <h3 class="font-semibold">{{ viewingTeacher.name }}</h3>
                <p class="text-sm text-muted-foreground">ID: {{ viewingTeacher.id }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail class="h-5 w-5 text-muted-foreground" />
                <div>
                  <p class="text-sm font-medium">E-mel</p>
                  <p class="text-sm text-muted-foreground">{{ viewingTeacher.email || 'Tiada' }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone class="h-5 w-5 text-muted-foreground" />
                <div>
                  <p class="text-sm font-medium">No. Telefon</p>
                  <p class="text-sm text-muted-foreground">{{ viewingTeacher.phone || 'Tiada' }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <School class="h-5 w-5 text-muted-foreground" />
                <div>
                  <p class="text-sm font-medium">Sekolah</p>
                  <p class="text-sm text-muted-foreground">
                    {{ viewingTeacher.school || 'Tiada' }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <GraduationCap class="h-5 w-5 text-muted-foreground" />
                <div>
                  <p class="text-sm font-medium">Kelas</p>
                  <p class="text-sm text-muted-foreground">{{ viewingTeacher.class || 'Tiada' }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Users class="h-5 w-5 text-muted-foreground" />
                <div>
                  <p class="text-sm font-medium">Pengalaman</p>
                  <p class="text-sm text-muted-foreground">
                    {{ viewingTeacher.experience || '0' }} tahun
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button @click="showViewDialog = false">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Delete Confirmation Dialog -->
      <Dialog v-model:open="showDeleteDialog">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Padam Guru</DialogTitle>
            <DialogDescription>
              Adakah anda pasti ingin memadam guru ini? Tindakan ini tidak boleh dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div v-if="deletingTeacher" class="py-4">
            <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div
                class="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center"
              >
                <span class="text-sm font-semibold text-destructive">
                  {{ (deletingTeacher.name || '').charAt(0).toUpperCase() }}
                </span>
              </div>
              <div>
                <p class="font-medium">{{ deletingTeacher.name }}</p>
                <p class="text-sm text-muted-foreground">{{ deletingTeacher.email }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ deletingTeacher.school }} - {{ deletingTeacher.class }}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="showDeleteDialog = false"> Batal </Button>
            <Button variant="destructive" @click="confirmDelete" :disabled="isSaving">
              <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
              Padam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
