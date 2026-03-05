<script setup>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useParentsStore } from '@/stores/parents'
import { useStudentsStore } from '@/stores/students'
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
import { Textarea } from '@/components/ui/textarea'
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
  UserPlus,
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
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const parentsStore = useParentsStore()
const studentsStore = useStudentsStore()

// State management
const isLoading = ref(true)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const showViewDialog = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const deletingParent = ref(null)
const viewingParent = ref(null)

// Search and filter state
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const sortBy = ref('name')
const sortOrder = ref('asc')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Debounce search
let searchTimeout = null

// Parent form data
const currentParent = reactive({
  id: null,
  name: '',
  email: '',
  phone: '',
  address: '',
  password: '',
})

// Reset form
const resetForm = () => {
  Object.assign(currentParent, {
    id: null,
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  })
}

// Enhanced filtering and search
const filteredParents = computed(() => {
  let parents = [...parentsStore.parents]

  // Apply search filter
  if (debouncedSearchQuery.value.trim()) {
    const searchTerm = debouncedSearchQuery.value.toLowerCase().trim()
    parents = parents.filter((parent) => {
      const nameMatch = parent.parent_name?.toLowerCase().includes(searchTerm)
      const emailMatch = parent.parent_email?.toLowerCase().includes(searchTerm)
      const phoneMatch = parent.parent_phone?.toLowerCase().includes(searchTerm)
      const addressMatch = parent.parent_address?.toLowerCase().includes(searchTerm)

      return nameMatch || emailMatch || phoneMatch || addressMatch
    })
  }

  // Apply sorting
  parents.sort((a, b) => {
    let aValue, bValue

    switch (sortBy.value) {
      case 'name':
        aValue = (a.parent_name || '').toLowerCase()
        bValue = (b.parent_name || '').toLowerCase()
        break
      case 'email':
        aValue = (a.parent_email || '').toLowerCase()
        bValue = (b.parent_email || '').toLowerCase()
        break
      case 'phone':
        aValue = (a.parent_phone || '').toLowerCase()
        bValue = (b.parent_phone || '').toLowerCase()
        break
      default:
        aValue = (a.parent_name || '').toLowerCase()
        bValue = (b.parent_name || '').toLowerCase()
    }

    if (sortOrder.value === 'desc') {
      return aValue < bValue ? 1 : -1
    }
    return aValue > bValue ? 1 : -1
  })

  return parents
})

// Pagination
const totalPages = computed(() =>
  Math.ceil(filteredParents.value.length / parseInt(itemsPerPage.value)),
)
const paginatedParents = computed(() => {
  const start = (currentPage.value - 1) * parseInt(itemsPerPage.value)
  const end = start + parseInt(itemsPerPage.value)
  return filteredParents.value.slice(start, end)
})

// Statistics
const statistics = computed(() => ({
  total: parentsStore.parents.length,
  filtered: filteredParents.value.length,
  withChildren: parentsStore.parents.filter((p) => getChildrenCount(p.parent_email) > 0).length,
}))

// Get children count for a parent
const getChildrenCount = (parentEmail) => {
  if (!studentsStore.students) return 0
  return studentsStore.students.filter(
    (student) => student.parent_email === parentEmail || student.parentEmail === parentEmail,
  ).length
}

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
    if (filteredParents.value.length === 0) {
      toast.info('Tiada data untuk dieksport')
      return
    }

    const data = filteredParents.value.map((parent) => ({
      Nama: parent.parent_name || '',
      Emel: parent.parent_email || '',
      Telefon: parent.parent_phone || '',
      Alamat: parent.parent_address || '',
      'Bilangan Anak': getChildrenCount(parent.parent_email),
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
    a.download = `ibu-bapa-${new Date().toISOString().split('T')[0]}.csv`
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
watch([itemsPerPage], () => {
  currentPage.value = 1
})

// Dialog and form management
const openAddDialog = () => {
  isEditing.value = false
  resetForm()
  showDialog.value = true
}

const openEditDialog = (parent) => {
  isEditing.value = true
  Object.assign(currentParent, {
    id: parent.user_id,
    name: parent.parent_name,
    email: parent.parent_email,
    phone: parent.parent_phone,
    address: parent.parent_address,
    password: '',
  })
  showDialog.value = true
}

const openViewDialog = (parent) => {
  viewingParent.value = parent
  showViewDialog.value = true
}

const openDeleteDialog = (parent) => {
  deletingParent.value = parent
  showDeleteDialog.value = true
}

const handleSubmit = async () => {
  isSaving.value = true
  let success = false

  try {
    if (isEditing.value) {
      success = await parentsStore.updateParent(currentParent)
    } else {
      success = await parentsStore.createParent(currentParent)
    }

    if (success) {
      showDialog.value = false
      resetForm()
      toast.success('Berjaya', {
        description: `Ibu bapa berjaya ${isEditing.value ? 'dikemaskini' : 'ditambah'}.`,
      })
    } else {
      toast.error('Ralat', { description: parentsStore.error || 'Gagal menyimpan ibu bapa.' })
    }
  } catch (error) {
    console.error('Error saving parent:', error)
    toast.error('Ralat', { description: error.message || 'Operasi gagal.' })
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = async () => {
  if (!deletingParent.value) return

  isSaving.value = true
  try {
    const success = await parentsStore.deleteParent(deletingParent.value.user_id)
    if (success) {
      showDeleteDialog.value = false
      deletingParent.value = null
      toast.success('Berjaya', { description: 'Ibu bapa berjaya dipadam.' })
    } else {
      toast.error('Ralat', { description: parentsStore.error || 'Gagal memadam ibu bapa.' })
    }
  } catch (error) {
    console.error('Error deleting parent:', error)
    toast.error('Ralat', { description: error.message || 'Gagal memadam ibu bapa.' })
  } finally {
    isSaving.value = false
  }
}

const refreshData = async () => {
  isLoading.value = true
  try {
    await Promise.all([parentsStore.fetchParents(), studentsStore.fetchStudents()])
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
    await Promise.all([parentsStore.fetchParents(), studentsStore.fetchStudents()])
    if (parentsStore.error) {
      toast.error('Ralat', { description: parentsStore.error })
    }
  } catch (error) {
    console.error('Error loading data:', error)
    toast.error('Ralat', { description: error.message })
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
            <h1 class="text-3xl font-bold tracking-tight text-gray-900">Pengurusan Ibu Bapa</h1>
            <p class="mt-1 text-sm text-gray-600">Urus maklumat ibu bapa dan pantau pendaftaran</p>
          </div>
          <div class="flex items-center gap-3">
            <Button @click="openAddDialog" variant="default">
              <Plus class="mr-2 h-4 w-4" />
              Tambah Ibu Bapa
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
              <Users class="h-8 w-8 text-blue-600" />
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Jumlah Ibu Bapa</p>
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
              <UserPlus class="h-8 w-8 text-purple-600" />
              <div class="ml-4">
                <p class="text-sm font-medium text-muted-foreground">Dengan Anak</p>
                <p class="text-2xl font-bold">{{ statistics.withChildren }}</p>
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
                <Label for="search">Cari Ibu Bapa</Label>
                <div class="relative">
                  <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    v-model="searchQuery"
                    placeholder="Cari nama, emel, telefon, atau alamat..."
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
              <div class="md:w-32">
                <Label for="sortBy">Susun</Label>
                <Select v-model="sortBy">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nama</SelectItem>
                    <SelectItem value="email">Emel</SelectItem>
                    <SelectItem value="phone">Telefon</SelectItem>
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
              v-if="debouncedSearchQuery || (statusFilter && statusFilter !== 'all')"
              class="flex flex-wrap gap-2"
            >
              <Badge v-if="debouncedSearchQuery" variant="secondary" class="gap-1">
                Carian: "{{ debouncedSearchQuery }}"
                <Button variant="ghost" size="sm" class="h-auto p-0 ml-1" @click="clearSearch">
                  <X class="h-3 w-3" />
                </Button>
              </Badge>
              <Badge
                v-if="statusFilter && statusFilter !== 'all'"
                variant="secondary"
                class="gap-1"
              >
                Status: {{ statusFilter === 'active' ? 'Aktif' : 'Tidak Aktif' }}
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-auto p-0 ml-1"
                  @click="statusFilter = 'all'"
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
            <span>Senarai Ibu Bapa</span>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{{ paginatedParents.length }} daripada {{ statistics.filtered }} rekod</span>
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
          <Alert v-else-if="parentsStore.error" variant="destructive" class="mb-6">
            <AlertCircle class="h-4 w-4" />
            <AlertTitle>Ralat</AlertTitle>
            <AlertDescription>{{ parentsStore.error }}</AlertDescription>
          </Alert>

          <!-- Empty State -->
          <div v-else-if="filteredParents.length === 0" class="text-center py-12">
            <Users class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 class="text-lg font-semibold mb-2">Tiada Data Ditemui</h3>
            <p class="text-muted-foreground mb-4">
              {{
                debouncedSearchQuery
                  ? 'Tiada hasil carian yang sepadan.'
                  : 'Belum ada ibu bapa didaftarkan.'
              }}
            </p>
            <Button v-if="!debouncedSearchQuery" @click="openAddDialog">
              <Plus class="mr-2 h-4 w-4" />
              Tambah Ibu Bapa Pertama
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
                    <TableHead class="cursor-pointer" @click="handleSort('phone')">
                      <div class="flex items-center gap-2">
                        Telefon
                        <SortAsc v-if="sortBy === 'phone' && sortOrder === 'asc'" class="h-4 w-4" />
                        <SortDesc
                          v-else-if="sortBy === 'phone' && sortOrder === 'desc'"
                          class="h-4 w-4"
                        />
                        <ChevronDown v-else class="h-4 w-4 opacity-50" />
                      </div>
                    </TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead class="text-center">Bilangan Anak</TableHead>
                    <TableHead class="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="parent in paginatedParents"
                    :key="parent.user_id"
                    class="hover:bg-muted/50"
                  >
                    <TableCell class="font-medium">
                      <div class="flex items-center gap-2">
                        <div
                          class="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center"
                        >
                          <span class="text-sm font-semibold text-primary">
                            {{ (parent.parent_name || '').charAt(0).toUpperCase() }}
                          </span>
                        </div>
                        {{ parent.parent_name || 'Tiada Nama' }}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-2 text-sm">
                        <Mail class="h-4 w-4 text-muted-foreground" />
                        {{ parent.parent_email || 'Tiada Emel' }}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-2 text-sm">
                        <Phone class="h-4 w-4 text-muted-foreground" />
                        {{ parent.parent_phone || 'Tiada Telefon' }}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-2 text-sm max-w-48 truncate">
                        <MapPin class="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span class="truncate" :title="parent.parent_address">
                          {{ parent.parent_address || 'Tiada Alamat' }}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell class="text-center">
                      <Badge variant="secondary">
                        {{ getChildrenCount(parent.parent_email) }}
                      </Badge>
                    </TableCell>
                    <TableCell class="text-right">
                      <div class="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" @click="openViewDialog(parent)">
                          <Eye class="h-4 w-4" />
                          <span class="sr-only">Lihat</span>
                        </Button>
                        <Button variant="ghost" size="sm" @click="openEditDialog(parent)">
                          <Pencil class="h-4 w-4" />
                          <span class="sr-only">Sunting</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          @click="openDeleteDialog(parent)"
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
            <DialogTitle>{{
              isEditing ? 'Sunting Ibu Bapa' : 'Tambah Ibu Bapa Baharu'
            }}</DialogTitle>
            <DialogDescription>
              {{
                isEditing
                  ? 'Kemas kini maklumat ibu bapa sedia ada.'
                  : 'Tambah rekod ibu bapa baharu ke dalam sistem.'
              }}
            </DialogDescription>
          </DialogHeader>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <Label for="name">Nama</Label>
              <Input
                id="name"
                v-model="currentParent.name"
                placeholder="Masukkan nama penuh"
                required
              />
            </div>
            <div>
              <Label for="email">E-mel</Label>
              <Input
                id="email"
                v-model="currentParent.email"
                type="email"
                placeholder="contoh@email.com"
                required
              />
            </div>
            <div>
              <Label for="phone">No. Telefon</Label>
              <Input id="phone" v-model="currentParent.phone" placeholder="012-345-6789" required />
            </div>
            <div>
              <Label for="address">Alamat</Label>
              <Textarea
                id="address"
                v-model="currentParent.address"
                placeholder="Alamat lengkap"
                rows="3"
                required
              />
            </div>
            <div v-if="!isEditing">
              <Label for="password">Kata Laluan</Label>
              <Input
                id="password"
                v-model="currentParent.password"
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
                {{ isEditing ? 'Simpan Perubahan' : 'Tambah Ibu Bapa' }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <!-- View Dialog -->
      <Dialog v-model:open="showViewDialog">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Maklumat Ibu Bapa</DialogTitle>
            <DialogDescription> Lihat maklumat lengkap ibu bapa </DialogDescription>
          </DialogHeader>
          <div v-if="viewingParent" class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span class="text-lg font-semibold text-primary">
                  {{ (viewingParent.parent_name || '').charAt(0).toUpperCase() }}
                </span>
              </div>
              <div>
                <h3 class="font-semibold">{{ viewingParent.parent_name }}</h3>
                <p class="text-sm text-muted-foreground">ID: {{ viewingParent.user_id }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail class="h-5 w-5 text-muted-foreground" />
                <div>
                  <p class="text-sm font-medium">E-mel</p>
                  <p class="text-sm text-muted-foreground">
                    {{ viewingParent.parent_email || 'Tiada' }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone class="h-5 w-5 text-muted-foreground" />
                <div>
                  <p class="text-sm font-medium">No. Telefon</p>
                  <p class="text-sm text-muted-foreground">
                    {{ viewingParent.parent_phone || 'Tiada' }}
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin class="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p class="text-sm font-medium">Alamat</p>
                  <p class="text-sm text-muted-foreground">
                    {{ viewingParent.parent_address || 'Tiada' }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Users class="h-5 w-5 text-muted-foreground" />
                <div>
                  <p class="text-sm font-medium">Bilangan Anak</p>
                  <p class="text-sm text-muted-foreground">
                    {{ getChildrenCount(viewingParent.parent_email) }} orang anak
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
            <DialogTitle>Padam Ibu Bapa</DialogTitle>
            <DialogDescription>
              Adakah anda pasti ingin memadam ibu bapa ini? Tindakan ini tidak boleh dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div v-if="deletingParent" class="py-4">
            <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div
                class="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center"
              >
                <span class="text-sm font-semibold text-destructive">
                  {{ (deletingParent.parent_name || '').charAt(0).toUpperCase() }}
                </span>
              </div>
              <div>
                <p class="font-medium">{{ deletingParent.parent_name }}</p>
                <p class="text-sm text-muted-foreground">{{ deletingParent.parent_email }}</p>
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
