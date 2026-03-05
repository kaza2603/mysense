import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'

export const useSchoolsStore = defineStore('schools', () => {
  const schools = ref([])
  const loading = ref(false)
  const error = ref('')
  const successMessage = ref('')

  const fetchSchools = async () => {
    loading.value = true
    error.value = ''
    try {
      console.log('Fetching schools...')
      const response = await api.get('/schools')

      if (response.data && Array.isArray(response.data)) {
        schools.value = response.data.map((s) => ({
          id: s.school_id,
          name: s.name,
          address: s.address,
          phone: s.phone,
        }))
        console.log(`Fetched ${schools.value.length} schools successfully`)
      } else {
        console.warn('Invalid response format from /schools endpoint:', response.data)
        schools.value = []
        error.value = 'Gagal memuatkan data sekolah.'
      }
    } catch (err) {
      console.error('Error fetching schools:', err)
      error.value = err.message || 'Gagal memuatkan data sekolah.'
      schools.value = []
    } finally {
      loading.value = false
    }
  }

  const getSchoolById = async (schoolId) => {
    loading.value = true
    error.value = ''
    try {
      console.log('Fetching school details for ID:', schoolId)
      const response = await api.get(`/schools/${schoolId}`)

      if (response.data) {
        const schoolData = {
          id: response.data.school_id,
          name: response.data.name,
          address: response.data.address,
          phone: response.data.phone,
          classes: response.data.classes || [],
        }
        console.log('Fetched school details successfully:', schoolData)
        return schoolData
      } else {
        console.warn('Invalid response format from /schools/:id endpoint:', response.data)
        error.value = 'Gagal memuatkan data sekolah.'
        return null
      }
    } catch (err) {
      console.error('Error fetching school details:', err)
      error.value = err.message || 'Gagal memuatkan data sekolah.'
      return null
    } finally {
      loading.value = false
    }
  }

  const registerSchool = async (schoolData) => {
    loading.value = true
    error.value = ''
    successMessage.value = ''

    try {
      const filteredClasses = schoolData.classes.filter((c) => c.trim())
      if (!filteredClasses.length) {
        error.value = 'Sila tambah sekurang-kurangnya satu kelas.'
        loading.value = false
        return false
      }

      console.log('Sending school registration request:', {
        name: schoolData.name,
        address: schoolData.address,
        phone: schoolData.phone,
        classes: filteredClasses,
      })

      const response = await api.post('/schools/register', {
        name: schoolData.name,
        address: schoolData.address,
        phone: schoolData.phone,
        classes: filteredClasses,
      })

      console.log('School registration response:', response.data)

      if (response.data && (response.data.success || response.data.school)) {
        successMessage.value = 'Sekolah berjaya didaftarkan!'
        await fetchSchools() // Refresh the schools list
        return true
      } else {
        const errorMsg =
          response.data?.error || response.data?.message || 'Gagal mendaftar sekolah.'
        console.error('School registration failed:', errorMsg)
        error.value = errorMsg
        return false
      }
    } catch (err) {
      console.error('School registration error:', err)
      // Try to extract the most detailed error message possible
      const errorResponse = err.response?.data
      const errorMsg =
        errorResponse?.error || errorResponse?.message || err.message || 'Gagal mendaftar sekolah.'

      error.value = errorMsg
      return false
    } finally {
      loading.value = false
    }
  }
  const updateSchool = async (schoolId, schoolData) => {
    loading.value = true
    error.value = ''
    successMessage.value = ''
    try {
      console.log('Updating school:', schoolId, schoolData)
      const response = await api.put(`/schools/${schoolId}`, schoolData)

      if (response.data && (response.data.success || response.data.school)) {
        successMessage.value = 'Sekolah berjaya dikemaskini!'
        await fetchSchools() // Refresh the schools list
        return true
      } else {
        const errorMsg =
          response.data?.error || response.data?.message || 'Gagal mengemaskini sekolah.'
        console.error('School update failed:', errorMsg)
        error.value = errorMsg
        return false
      }
    } catch (err) {
      console.error('School update error:', err)
      const errorResponse = err.response?.data
      const errorMsg =
        errorResponse?.error ||
        errorResponse?.message ||
        err.message ||
        'Gagal mengemaskini sekolah.'
      error.value = errorMsg
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    schools,
    loading,
    error,
    successMessage,
    fetchSchools,
    getSchoolById,
    registerSchool,
    updateSchool,
  }
})
