<template>
  <Card class="max-w-3xl mx-auto">
    <CardHeader>
      <CardTitle class="text-2xl font-bold">Pendaftaran Sekolah</CardTitle>
      <CardDescription>Daftar sekolah baharu ke dalam sistem</CardDescription>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="registerSchool" class="space-y-4">
        <div v-if="schoolsStore.error" class="mb-4">
          <Alert variant="destructive">
            <AlertDescription>{{ schoolsStore.error }}</AlertDescription>
          </Alert>
        </div>

        <div v-if="schoolsStore.successMessage" class="mb-4">
          <Alert variant="success" class="bg-green-50 border-green-500 text-green-700">
            <AlertDescription>{{ schoolsStore.successMessage }}</AlertDescription>
          </Alert>
        </div>

        <div>
          <Label for="schoolName">Nama Sekolah</Label>
          <Input id="schoolName" v-model="schoolName" required />
        </div>

        <div>
          <Label for="address">Alamat</Label>
          <Input id="address" v-model="address" required />
        </div>

        <div>
          <Label for="phone">No. Telefon</Label>
          <Input id="phone" v-model="phone" required />
        </div>

        <div>
          <Label>Kelas</Label>
          <div class="space-y-2">
            <div v-for="(classItem, idx) in classes" :key="idx" class="flex items-center space-x-2">
              <Input v-model="classes[idx]" placeholder="Nama Kelas" required class="flex-1" />
              <Button
                v-if="classes.length > 1"
                type="button"
                variant="destructive"
                size="icon"
                @click="removeClass(idx)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button type="button" variant="outline" class="mt-2" @click="addClass">
            <Plus class="h-4 w-4 mr-2" />
            Tambah Kelas
          </Button>
        </div>

        <Button type="submit" class="w-full" :disabled="isSubmitting">
          {{ isSubmitting ? 'Mendaftar...' : 'Daftar Sekolah' }}
        </Button>
      </form>
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSchoolsStore } from '@/stores/schools'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@/components/ui/alert'

const schoolName = ref('')
const address = ref('')
const phone = ref('')
const classes = ref([''])
const isSubmitting = ref(false)

const schoolsStore = useSchoolsStore()

onMounted(() => {
  schoolsStore.error = ''
  schoolsStore.successMessage = ''
})

const addClass = () => {
  classes.value.push('')
}

const removeClass = (idx) => {
  if (classes.value.length > 1) classes.value.splice(idx, 1)
}

const registerSchool = async () => {
  schoolsStore.error = ''
  schoolsStore.successMessage = ''
  isSubmitting.value = true

  try {
    if (!schoolName.value) {
      schoolsStore.error = 'Sila masukkan nama sekolah.'
      return
    }
    if (!address.value) {
      schoolsStore.error = 'Sila masukkan alamat sekolah.'
      return
    }
    if (!phone.value) {
      schoolsStore.error = 'Sila masukkan nombor telefon sekolah.'
      return
    }

    const validClasses = classes.value.filter((c) => c.trim())
    if (!validClasses.length) {
      schoolsStore.error = 'Sila tambah sekurang-kurangnya satu kelas.'
      return
    }

    console.log('Submitting school registration:', {
      name: schoolName.value,
      address: address.value,
      phone: phone.value,
      classes: validClasses,
    })

    const success = await schoolsStore.registerSchool({
      name: schoolName.value,
      address: address.value,
      phone: phone.value,
      classes: validClasses,
    })

    if (success) {
      schoolName.value = ''
      address.value = ''
      phone.value = ''
      classes.value = ['']
    }
  } catch (error) {
    console.error('Error registering school:', error)
    schoolsStore.error = error.message || 'Ralat tidak dijangka berlaku. Sila cuba lagi.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.school-registration {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
}
.school-registration label {
  display: block;
  margin-bottom: 0.5rem;
}
.school-registration input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.success {
  color: green;
  margin-top: 1rem;
}
.error {
  color: red;
  margin-top: 1rem;
}
</style>
