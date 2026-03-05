<template>
  <div class="bg-gray-50/50">
    <!-- Header Section -->
    <div class="border-b border-gray-200">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-gray-900">Sekolah & Kelas</h1>
            <p class="mt-1 text-sm text-gray-600">
              Lihat maklumat sekolah dan kelas yang telah didaftarkan
            </p>
          </div>
          <div class="flex items-center gap-3">
            <Button @click="showAddClassDialog" variant="default">
              <Plus class="mr-2 h-4 w-4" />
              Tambah Kelas
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
      <!-- Search and Filter Controls -->
      <Card>
        <CardHeader>
          <CardTitle>Carian & Penapis</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <Label for="search">Cari Sekolah</Label>
              <div class="relative">
                <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  v-model="searchQuery"
                  placeholder="Cari nama sekolah, alamat, kelas, atau guru..."
                  class="pl-9"
                  @input="handleSearchInput"
                />
              </div>
            </div>
            <div class="md:w-48">
              <Label for="sortBy">Susun Mengikut</Label>
              <Select v-model="sortBy">
                <SelectTrigger>
                  <SelectValue placeholder="Pilih susun atur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nama Sekolah</SelectItem>
                  <SelectItem value="totalClasses">Jumlah Kelas</SelectItem>
                  <SelectItem value="address">Alamat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="md:w-32">
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
          </div>
        </CardContent>
      </Card>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <School class="h-8 w-8 text-blue-600" />
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Jumlah Sekolah</p>
                <p class="text-2xl font-bold">{{ totalSchools }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <GraduationCap class="h-8 w-8 text-green-600" />
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Jumlah Kelas</p>
                <p class="text-2xl font-bold">{{ totalClasses }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center">
              <Users class="h-8 w-8 text-purple-600" />
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Purata Kelas/Sekolah</p>
                <p class="text-2xl font-bold">{{ averageClassesPerSchool }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="text-center">
          <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" />
          <p class="text-muted-foreground">Memuat data...</p>
        </div>
      </div>

      <!-- Error State -->
      <Alert v-else-if="error" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>Ralat</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <!-- No Data State -->
      <Card v-else-if="filteredSchools.length === 0 && !isLoading">
        <CardContent class="text-center py-12">
          <School class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-semibold mb-2">Tiada Sekolah Dijumpai</h3>
          <p class="text-muted-foreground mb-4">
            {{
              debouncedSearchQuery
                ? 'Tiada sekolah yang sepadan dengan carian anda.'
                : 'Belum ada sekolah yang didaftarkan.'
            }}
          </p>
          <Button v-if="debouncedSearchQuery" @click="clearSearch" variant="outline">
            Kosongkan Carian
          </Button>
        </CardContent>
      </Card>

      <!-- Schools and Classes Table -->
      <div v-else class="space-y-4">
        <Card v-for="school in paginatedSchools" :key="school.id" class="overflow-hidden">
          <CardHeader
            class="cursor-pointer hover:bg-muted/50 transition-colors"
            @click="toggleSchoolExpansion(school.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                  <ChevronRight
                    :class="{ 'rotate-90': expandedSchools.has(school.id) }"
                    class="h-4 w-4 transition-transform"
                  />
                  <School class="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle class="text-lg">{{ school.name }}</CardTitle>
                  <CardDescription>{{ school.address }}</CardDescription>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-muted-foreground">
                  {{ school.classes?.length || 0 }} kelas
                </div>
                <div class="text-sm text-muted-foreground">Tel: {{ school.phone }}</div>
                <Button variant="ghost" size="sm" @click.stop="editSchool(school)" class="mt-1">
                  <Pencil class="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>

          <!-- Expanded Classes Content -->
          <Collapsible :open="expandedSchools.has(school.id)">
            <CollapsibleContent>
              <CardContent class="pt-0">
                <div v-if="!school.classes || school.classes.length === 0" class="text-center py-8">
                  <GraduationCap class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p class="text-muted-foreground mb-4">
                    Tiada kelas didaftarkan untuk sekolah ini
                  </p>
                  <Button @click="addClassToSchool(school)" variant="outline" size="sm">
                    <Plus class="h-4 w-4 mr-2" />
                    Tambah Kelas Pertama
                  </Button>
                </div>
                <div v-else class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b">
                        <th class="text-left py-2 px-4 font-medium">Nama Kelas</th>
                        <th class="text-left py-2 px-4 font-medium">Guru</th>
                        <th class="text-left py-2 px-4 font-medium">Bilangan Pelajar</th>
                        <th class="text-left py-2 px-4 font-medium">Tarikh Daftar</th>
                        <th class="text-right py-2 px-4 font-medium">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="classItem in school.classes" :key="classItem.id" class="border-b">
                        <td class="py-3 px-4">
                          <div class="flex items-center space-x-2">
                            <GraduationCap class="h-4 w-4 text-green-600" />
                            <span class="font-medium">{{ classItem.name }}</span>
                          </div>
                        </td>
                        <td class="py-3 px-4">
                          <div v-if="classItem.teacher">
                            <div class="font-medium">{{ classItem.teacher.name }}</div>
                            <div class="text-sm text-muted-foreground">
                              {{ classItem.teacher.email }}
                            </div>
                          </div>
                          <span v-else class="text-muted-foreground">Belum ditetapkan</span>
                        </td>
                        <td class="py-3 px-4">
                          <div class="flex items-center space-x-2">
                            <Users class="h-4 w-4 text-purple-600" />
                            <span>{{ classItem.studentCount || 0 }} pelajar</span>
                          </div>
                        </td>
                        <td class="py-3 px-4 text-sm text-muted-foreground">
                          {{ formatDate(classItem.created_at) }}
                        </td>
                        <td class="py-3 px-4 text-right">
                          <div class="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" @click="viewClassDetails(classItem)">
                              <Eye class="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" @click="editClass(classItem)">
                              <Pencil class="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              @click="deleteClass(classItem)"
                              class="text-red-600 hover:text-red-700"
                            >
                              <Trash2 class="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center items-center space-x-2">
          <Button variant="outline" size="sm" :disabled="currentPage === 1" @click="currentPage--">
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <span class="text-sm text-muted-foreground">
            Halaman {{ currentPage }} daripada {{ totalPages }}
          </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
      <!-- Class Details Dialog -->
      <Dialog v-model:open="showClassDialog">
        <DialogContent class="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Butiran Kelas</DialogTitle>
            <DialogDescription>
              Maklumat terperinci untuk {{ selectedClass?.name }}
            </DialogDescription>
          </DialogHeader>
          <div v-if="selectedClass" class="grid gap-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label class="text-sm font-medium">Nama Kelas</Label>
                <p class="text-sm text-muted-foreground">{{ selectedClass.name }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium">Sekolah</Label>
                <p class="text-sm text-muted-foreground">{{ selectedClass.schoolName }}</p>
              </div>
              <div>
                <Label class="text-sm font-medium">Guru</Label>
                <p class="text-sm text-muted-foreground">
                  {{ selectedClass.teacher?.name || 'Belum ditetapkan' }}
                </p>
              </div>
              <div>
                <Label class="text-sm font-medium">Bilangan Pelajar</Label>
                <p class="text-sm text-muted-foreground">
                  {{ selectedClass.studentCount || 0 }} pelajar
                </p>
              </div>
              <div>
                <Label class="text-sm font-medium">Tarikh Didaftarkan</Label>
                <p class="text-sm text-muted-foreground">
                  {{ formatDate(selectedClass.created_at) }}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="showClassDialog = false">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Edit School Dialog -->
      <Dialog v-model:open="showEditSchoolDialog">
        <DialogContent class="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Maklumat Sekolah</DialogTitle>
            <DialogDescription> Kemaskini butiran sekolah </DialogDescription>
          </DialogHeader>
          <form @submit.prevent="saveSchoolChanges" class="space-y-4">
            <div class="grid gap-4">
              <div>
                <Label for="schoolName">Nama Sekolah <span class="text-red-500">*</span></Label>
                <Input
                  id="schoolName"
                  v-model="editingSchool.name"
                  placeholder="Masukkan nama sekolah"
                  required
                />
              </div>
              <div>
                <Label for="schoolAddress">Alamat <span class="text-red-500">*</span></Label>
                <Textarea
                  id="schoolAddress"
                  v-model="editingSchool.address"
                  placeholder="Masukkan alamat sekolah"
                  rows="3"
                  required
                />
              </div>
              <div>
                <Label for="schoolPhone">Nombor Telefon</Label>
                <Input
                  id="schoolPhone"
                  v-model="editingSchool.phone"
                  placeholder="Masukkan nombor telefon"
                  type="tel"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" @click="showEditSchoolDialog = false">
                Batal
              </Button>
              <Button type="submit" :disabled="isSaving">
                <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <!-- Add/Edit Class Dialog -->
      <Dialog v-model:open="showClassFormDialog">
        <DialogContent class="max-w-md">
          <DialogHeader>
            <DialogTitle>{{ isEditingClass ? 'Edit Kelas' : 'Tambah Kelas Baharu' }}</DialogTitle>
            <DialogDescription>
              {{ isEditingClass ? 'Kemaskini maklumat kelas' : 'Cipta kelas baharu untuk sekolah' }}
            </DialogDescription>
          </DialogHeader>
          <form @submit.prevent="saveClassChanges" class="space-y-4">
            <div class="grid gap-4">
              <div>
                <Label for="className">Nama Kelas <span class="text-red-500">*</span></Label>
                <Input
                  id="className"
                  v-model="editingClass.name"
                  placeholder="Contoh: 1 Bestari, 2A, etc."
                  required
                />
              </div>
              <div>
                <Label for="classSchool">Sekolah <span class="text-red-500">*</span></Label>
                <Select v-model="editingClass.schoolId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sekolah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="school in schoolsStore.schools"
                      :key="school.id"
                      :value="school.id"
                    >
                      {{ school.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" @click="showClassFormDialog = false">
                Batal
              </Button>
              <Button type="submit" :disabled="isSaving">
                <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
                {{ isEditingClass ? 'Kemaskini' : 'Tambah' }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <!-- Delete Confirmation Dialog -->
      <Dialog v-model:open="showDeleteDialog">
        <DialogContent class="max-w-md">
          <DialogHeader>
            <DialogTitle>Padam Kelas</DialogTitle>
            <DialogDescription>
              Adakah anda pasti ingin memadam kelas "{{ deletingClass?.name }}"?
            </DialogDescription>
          </DialogHeader>
          <div class="py-4">
            <Alert variant="destructive">
              <AlertCircle class="h-4 w-4" />
              <AlertTitle>Amaran</AlertTitle>
              <AlertDescription>
                Tindakan ini tidak boleh dibatalkan. Semua data yang berkaitan dengan kelas ini akan
                turut dipadam.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="showDeleteDialog = false"> Batal </Button>
            <Button variant="destructive" @click="confirmDeleteClass" :disabled="isSaving">
              <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
              Ya, Padam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useSchoolsStore } from '@/stores/schools'
import { useTeachersStore } from '@/stores/teachers'
import { useStudentsStore } from '@/stores/students'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  School,
  GraduationCap,
  Users,
  Search,
  RefreshCw,
  Download,
  ChevronRight,
  ChevronLeft,
  Eye,
  Pencil,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

// Stores
const schoolsStore = useSchoolsStore()
const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()

// Reactive data
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const sortBy = ref('name')
const sortOrder = ref('asc')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const expandedSchools = ref(new Set())
const showClassDialog = ref(false)
const selectedClass = ref(null)
const schoolsWithClasses = reactive([])

// Debounce search
let searchTimeout = null

// Edit school dialog
const showEditSchoolDialog = ref(false)
const editingSchool = ref({
  id: '',
  name: '',
  address: '',
  phone: '',
})

// Add/Edit class dialog
const showClassFormDialog = ref(false)
const isEditingClass = ref(false)
const editingClass = ref({
  id: '',
  name: '',
  schoolId: '',
})

// Delete confirmation dialog
const showDeleteDialog = ref(false)
const deletingClass = ref(null)

// Loading states
const isSaving = ref(false)

// Loading and error states
const isLoading = computed(
  () => schoolsStore.loading || teachersStore.loading || studentsStore.loading,
)
const error = computed(() => schoolsStore.error || teachersStore.error || studentsStore.error)

// Computed properties for filtering and sorting
const filteredSchools = computed(() => {
  let schools = [...schoolsWithClasses] // Create a copy to avoid mutating original array

  // Apply search filter using debounced search query
  if (debouncedSearchQuery.value && debouncedSearchQuery.value.trim()) {
    const searchTerm = debouncedSearchQuery.value.toLowerCase().trim()
    schools = schools.filter((school) => {
      // Search in school name
      const nameMatch = school.name?.toLowerCase().includes(searchTerm)

      // Search in school address
      const addressMatch = school.address?.toLowerCase().includes(searchTerm)

      // Search in phone number
      const phoneMatch = school.phone?.toLowerCase().includes(searchTerm)

      // Search in class names
      const classMatch = school.classes?.some((classItem) =>
        classItem.name?.toLowerCase().includes(searchTerm),
      )

      // Search in teacher names
      const teacherMatch = school.classes?.some((classItem) =>
        classItem.teacher?.name?.toLowerCase().includes(searchTerm),
      )

      return nameMatch || addressMatch || phoneMatch || classMatch || teacherMatch
    })
  }

  // Apply sorting
  schools.sort((a, b) => {
    let aValue, bValue

    switch (sortBy.value) {
      case 'name':
        aValue = (a.name || '').toLowerCase()
        bValue = (b.name || '').toLowerCase()
        break
      case 'totalClasses':
        aValue = a.classes?.length || 0
        bValue = b.classes?.length || 0
        break
      case 'address':
        aValue = (a.address || '').toLowerCase()
        bValue = (b.address || '').toLowerCase()
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

  return schools
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredSchools.value.length / itemsPerPage.value))
const paginatedSchools = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredSchools.value.slice(start, end)
})

// Statistics
const totalSchools = computed(() => schoolsWithClasses.length)
const totalClasses = computed(() =>
  schoolsWithClasses.reduce((total, school) => total + (school.classes?.length || 0), 0),
)
const averageClassesPerSchool = computed(() =>
  totalSchools.value > 0 ? Math.round((totalClasses.value / totalSchools.value) * 10) / 10 : 0,
)

// Methods
const toggleSchoolExpansion = (schoolId) => {
  if (expandedSchools.value.has(schoolId)) {
    expandedSchools.value.delete(schoolId)
  } else {
    expandedSchools.value.add(schoolId)
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
}

const handleSearchInput = () => {
  // Reset pagination when searching
  currentPage.value = 1

  // Clear existing timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  // Set new timeout for debounced search
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = searchQuery.value
  }, 300) // 300ms delay
}

const refreshData = async () => {
  await loadData()
  toast.success('Data telah dimuat semula')
}

const exportData = () => {
  try {
    if (schoolsWithClasses.length === 0) {
      toast.info('Tiada data untuk dieksport')
      return
    }

    const data = schoolsWithClasses.map((school) => ({
      'Nama Sekolah': school.name || '',
      Alamat: school.address || '',
      Telefon: school.phone || '',
      'Jumlah Kelas': school.classes?.length || 0,
      Kelas: school.classes?.map((c) => c.name).join(', ') || 'Tiada',
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
    a.download = `sekolah-kelas-${new Date().toISOString().split('T')[0]}.csv`
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

const viewClassDetails = (classItem) => {
  selectedClass.value = classItem
  showClassDialog.value = true
}

const editClass = (classItem) => {
  isEditingClass.value = true
  editingClass.value = {
    id: classItem.id,
    name: classItem.name,
    schoolId: classItem.schoolId || getSchoolIdForClass(classItem),
  }
  showClassFormDialog.value = true
}

// School management methods
const editSchool = (school) => {
  editingSchool.value = {
    id: school.id,
    name: school.name,
    address: school.address,
    phone: school.phone,
  }
  showEditSchoolDialog.value = true
}

const saveSchoolChanges = async () => {
  isSaving.value = true
  try {
    const success = await schoolsStore.updateSchool(editingSchool.value.id, {
      name: editingSchool.value.name,
      address: editingSchool.value.address,
      phone: editingSchool.value.phone,
    })

    if (success) {
      toast.success('Maklumat sekolah berjaya dikemaskini')
      showEditSchoolDialog.value = false
      await loadData()
    } else {
      toast.error('Gagal mengemaskini maklumat sekolah')
    }
  } catch (error) {
    console.error('Error updating school:', error)
    toast.error('Ralat semasa mengemaskini sekolah')
  } finally {
    isSaving.value = false
  }
}

// Class management methods
const showAddClassDialog = () => {
  isEditingClass.value = false
  editingClass.value = {
    id: '',
    name: '',
    schoolId: '',
  }
  showClassFormDialog.value = true
}

const addClassToSchool = (school) => {
  isEditingClass.value = false
  editingClass.value = {
    id: '',
    name: '',
    schoolId: school.id,
  }
  showClassFormDialog.value = true
}

const saveClassChanges = async () => {
  isSaving.value = true
  try {
    let success = false

    if (isEditingClass.value) {
      // Update existing class
      success = await updateClass(editingClass.value)
    } else {
      // Create new class
      success = await createClass(editingClass.value)
    }

    if (success) {
      toast.success(isEditingClass.value ? 'Kelas berjaya dikemaskini' : 'Kelas berjaya ditambah')
      showClassFormDialog.value = false
      await loadData()
    }
  } catch (error) {
    console.error('Error saving class:', error)
    toast.error('Ralat semasa menyimpan kelas')
  } finally {
    isSaving.value = false
  }
}

const createClass = async (classData) => {
  try {
    // Create class using the appropriate API
    const response = await api.post('/classes', {
      class_name: classData.name,
      school_id: classData.schoolId,
    })

    return true
  } catch (error) {
    console.error('Error creating class:', error)
    toast.error(error.response?.data?.error || 'Gagal menambah kelas')
    return false
  }
}

const updateClass = async (classData) => {
  try {
    // Update class information
    const response = await api.put(`/classes/${classData.id}`, {
      class_name: classData.name,
      school_id: classData.schoolId,
    })

    return true
  } catch (error) {
    console.error('Error updating class:', error)
    toast.error(error.response?.data?.error || 'Gagal mengemaskini kelas')
    return false
  }
}

const deleteClass = (classItem) => {
  deletingClass.value = classItem
  showDeleteDialog.value = true
}

const confirmDeleteClass = async () => {
  isSaving.value = true
  try {
    const response = await api.delete(`/classes/${deletingClass.value.id}`)

    if (response.status === 200) {
      toast.success('Kelas berjaya dipadam')
      showDeleteDialog.value = false
      await loadData()
    }
  } catch (error) {
    console.error('Error deleting class:', error)
    toast.error(error.response?.data?.error || 'Gagal memadam kelas')
  } finally {
    isSaving.value = false
  }
}

// Helper methods
const getSchoolIdForClass = (classItem) => {
  // Find school ID from the schools data
  const school = schoolsWithClasses.find((s) => s.classes?.some((c) => c.id === classItem.id))
  return school?.id || ''
}

const formatDate = (dateString) => {
  if (!dateString) return 'Tidak diketahui'
  return new Date(dateString).toLocaleDateString('ms-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const loadData = async () => {
  try {
    // Clear existing data
    schoolsWithClasses.length = 0

    // Fetch schools
    await schoolsStore.fetchSchools()

    // Fetch teachers and students to get additional information
    await teachersStore.fetchTeachers()
    await studentsStore.fetchStudents()

    // Fetch all classes directly from API
    const classesResponse = await api.get('/classes')
    const allClasses = classesResponse.data || []

    // Combine data
    const schools = schoolsStore.schools
    const teachers = teachersStore.teachers
    const students = studentsStore.students

    // Group data by school
    const schoolsData = schools.map((school) => {
      // Find all classes for this school
      const schoolClasses = allClasses
        .filter((classItem) => classItem.school_id === school.id)
        .map((classItem) => {
          // Find teacher assigned to this class
          const assignedTeacher = teachers.find((t) => t.classId === classItem.class_id)

          // Count students in this class
          const studentCount = students.filter((s) => s.classId === classItem.class_id).length

          // Get earliest student creation date for approximation
          const classStudents = students.filter((s) => s.classId === classItem.class_id)
          const earliestStudentDate =
            classStudents.length > 0
              ? classStudents.reduce(
                  (earliest, student) =>
                    !earliest || (student.created_at && student.created_at < earliest)
                      ? student.created_at
                      : earliest,
                  null,
                )
              : null

          return {
            id: classItem.class_id,
            name: classItem.class_name,
            schoolName: school.name,
            schoolId: classItem.school_id,
            teacher: assignedTeacher
              ? {
                  name: assignedTeacher.name,
                  email: assignedTeacher.email,
                }
              : null,
            studentCount: studentCount,
            created_at: classItem.created_at || earliestStudentDate,
          }
        })

      return {
        ...school,
        classes: schoolClasses,
      }
    })

    // Populate the reactive array
    schoolsWithClasses.push(...schoolsData)
  } catch (error) {
    console.error('Error loading data:', error)
    toast.error('Gagal memuat data')
  }
}

// Watch for search query changes to reset pagination
watch(debouncedSearchQuery, () => {
  currentPage.value = 1
})

// Initialize debounced search on mount
watch(
  searchQuery,
  () => {
    handleSearchInput()
  },
  { immediate: true },
)

// Load data on mount
onMounted(() => {
  loadData()
})
</script>
