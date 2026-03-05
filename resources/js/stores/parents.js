import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'

export const useParentsStore = defineStore('parents', () => {
  const parents = ref([])
  const loading = ref(false)
  const error = ref('')

  const mapParentToFrontend = (dbParent) => ({
    id: dbParent.user_id,
    name: dbParent.parent_name,
    email: dbParent.parent_email,
    phone: dbParent.parent_phone,
    address: dbParent.parent_address,
  })

  const fetchParents = async () => {
    loading.value = true
    error.value = ''
    try {
      const response = await api.get('/parents')
      if (response.data && response.data.parents) {
        // Store the data as-is from the backend to match component expectations
        parents.value = response.data.parents
      } else {
        parents.value = []
        error.value = 'Gagal memuatkan data ibu bapa.'
      }
    } catch (err) {
      error.value = err.message || 'Gagal memuatkan data ibu bapa.'
      parents.value = []
    } finally {
      loading.value = false
    }
  }

  const createParent = async (parent) => {
    loading.value = true
    error.value = ''
    try {
      // Map frontend fields to backend expected fields
      const payload = {
        parent_name: parent.name,
        parent_email: parent.email,
        parent_phone: parent.phone,
        parent_address: parent.address,
        parent_password: parent.password,
      }

      const response = await api.post('/parents/register', payload)

      if (response.data && response.data.parent) {
        parents.value.push(response.data.parent)
        return true
      }

      error.value = response.data?.message || 'Gagal menambah ibu bapa.'
      return false
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Gagal menambah ibu bapa.'
      return false
    } finally {
      loading.value = false
    }
  }

  const updateParent = async (parent) => {
    loading.value = true
    error.value = ''
    try {
      // Map frontend fields to backend expected fields
      const payload = {
        parent_name: parent.name,
        parent_email: parent.email,
        parent_phone: parent.phone,
        parent_address: parent.address,
      }

      const response = await api.put(`/parents/${parent.id}`, payload)

      if (response.data && response.data.parent) {
        const idx = parents.value.findIndex((p) => p.user_id === parent.id)
        if (idx !== -1) {
          parents.value[idx] = response.data.parent
        }
        return true
      }

      error.value = response.data?.message || 'Gagal mengemaskini ibu bapa.'
      return false
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Gagal mengemaskini ibu bapa.'
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteParent = async (parentId) => {
    loading.value = true
    error.value = ''
    try {
      const response = await api.delete(`/parents/${parentId}`)

      if (response.data && response.data.success) {
        parents.value = parents.value.filter((p) => p.user_id !== parentId)
        return true
      }

      error.value = response.data?.message || 'Gagal memadam ibu bapa.'
      return false
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Gagal memadam ibu bapa.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    parents,
    loading,
    error,
    fetchParents,
    createParent,
    updateParent,
    deleteParent,
  }
})
