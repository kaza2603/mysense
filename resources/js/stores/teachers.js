import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'

export const useTeachersStore = defineStore('teachers', () => {
  const teachers = ref([])
  const loading = ref(false)
  const error = ref('')
  const schools = ref([])
  const classes = ref({}) // Map of school_id to array of classes
  const mapTeacherToFrontend = (dbTeacher) => ({
    id: dbTeacher.teacher_id,
    name: dbTeacher.teacher_name,
    email: dbTeacher.teacher_email,
    username: dbTeacher.teacher_username,
    school: dbTeacher.school_name || (dbTeacher.schools && dbTeacher.schools.name) || '',
    schoolId: dbTeacher.school_id,
    classId: dbTeacher.class_id,
    class: dbTeacher.class_name || (dbTeacher.classes && dbTeacher.classes.class_name) || '',
    experience: dbTeacher.teacher_experience,
    phone: dbTeacher.teacher_phone,
  })
  const fetchTeachers = async () => {
    loading.value = true
    error.value = ''
    try {
      console.log('Fetching teachers...')
      const response = await api.get('/teachers')

      if (response.data && Array.isArray(response.data.teachers)) {
        console.log(`Successfully fetched ${response.data.teachers.length} teachers`)

        // Log the teacher data received from backend
        console.log('Teacher data from backend:', response.data.teachers)

        teachers.value = response.data.teachers.map((teacher) => {
          const mappedTeacher = mapTeacherToFrontend(teacher)

          // Log each mapped teacher to verify school and class data
          console.log(`Mapped teacher: ${teacher.teacher_name}`, {
            original: {
              school_name: teacher.school_name,
              class_name: teacher.class_name,
              schools: teacher.schools,
              classes: teacher.classes,
            },
            mapped: {
              school: mappedTeacher.school,
              class: mappedTeacher.class,
            },
          })

          return mappedTeacher
        })
      } else {
        console.warn('Invalid response format from /teachers endpoint:', response.data)
        teachers.value = []
        error.value = 'Gagal memuatkan data guru.'
      }
    } catch (err) {
      console.error('Error fetching teachers:', err)
      error.value = err.response?.data?.message || err.message || 'Gagal memuatkan data guru.'
      teachers.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchSchools = async () => {
    loading.value = true
    error.value = ''
    try {
      const response = await api.get('/schools')

      if (response.data && Array.isArray(response.data)) {
        schools.value = response.data.map((s) => ({
          id: s.school_id,
          name: s.name,
          address: s.address,
          phone: s.phone,
        }))
      } else {
        schools.value = []
        error.value = 'Gagal memuatkan data sekolah.'
      }
    } catch (err) {
      error.value = err.message || 'Gagal memuatkan data sekolah.'
      schools.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchClassesBySchool = async (schoolId) => {
    if (!schoolId) return

    loading.value = true
    error.value = ''
    try {
      const response = await api.get(`/classes/school/${schoolId}`)
      if (response.data && Array.isArray(response.data)) {
        classes.value[schoolId] = response.data.map((c) => ({
          id: c.class_id,
          name: c.class_name,
        }))
      } else {
        classes.value[schoolId] = []
        error.value = 'Gagal memuatkan data kelas.'
      }
    } catch (err) {
      error.value = err.message || 'Gagal memuatkan data kelas.'
      classes.value[schoolId] = []
    } finally {
      loading.value = false
    }
  }
  const fetchClassById = async (classId) => {
    if (!classId) {
      console.warn('fetchClassById called without classId')
      return null
    }

    loading.value = true
    error.value = ''
    try {
      console.log(`Fetching class with ID: ${classId}`)
      const response = await api.get(`/classes/${classId}`)

      console.log('Class fetch response:', response.data)

      if (response.data) {
        const classData = {
          id: response.data.class_id,
          name: response.data.class_name,
          school_id: response.data.school_id,
        }
        console.log('Mapped class data:', classData)
        return classData
      } else {
        error.value = 'Gagal memuatkan data kelas.'
        return null
      }
    } catch (err) {
      console.error('Error fetching class by ID:', err)
      error.value = err.response?.data?.error || err.message || 'Gagal memuatkan data kelas.'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateTeacher = async (teacher) => {
    loading.value = true
    error.value = ''
    try {
      // Ensure school and class names are set
      if (teacher.schoolId && !teacher.school) {
        const school = schools.value.find((s) => s.id === teacher.schoolId)
        if (school) {
          teacher.school = school.name
          console.log(`Set school name: ${teacher.school} from ID: ${teacher.schoolId}`)
        }
      }

      if (teacher.classId && !teacher.class) {
        const classData = classes.value[teacher.schoolId]?.find((c) => c.id === teacher.classId)
        if (classData) {
          teacher.class = classData.name
          console.log(`Set class name: ${teacher.class} from ID: ${teacher.classId}`)
        }
      }

      const payload = {
        teacher_name: teacher.name,
        school_id: teacher.schoolId,
        school_name: teacher.school,
        class_id: teacher.classId,
        class_name: teacher.class,
        teacher_experience: teacher.experience || '',
        teacher_phone: teacher.phone || '',
      }

      const response = await api.put(`/teachers/${teacher.id}`, payload)
      if (response.data && response.data.teacher) {
        const idx = teachers.value.findIndex((t) => t.id === teacher.id)
        if (idx !== -1) teachers.value[idx] = mapTeacherToFrontend(response.data.teacher)
        return true
      }
      error.value = response.data?.message || 'Gagal mengemaskini guru.'
      return false
    } catch (err) {
      error.value = err.message || 'Gagal mengemaskini guru.'
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteTeacher = async (teacherId) => {
    loading.value = true
    error.value = ''
    try {
      const response = await api.delete(`/teachers/${teacherId}`)
      if (response.data && response.data.success) {
        teachers.value = teachers.value.filter((t) => t.id !== teacherId)
        return true
      }
      error.value = response.data?.message || 'Gagal memadam guru.'
      return false
    } catch (err) {
      error.value = err.message || 'Gagal memadam guru.'
      return false
    } finally {
      loading.value = false
    }
  }
  const createTeacher = async (teacher) => {
    loading.value = true
    error.value = ''
    // Validate required fields before sending
    if (
      !teacher.email ||
      !teacher.name ||
      !teacher.schoolId ||
      !teacher.classId ||
      !teacher.password
    ) {
      error.value = 'Sila isi semua maklumat wajib (nama, emel, sekolah, kelas, kata laluan).'
      loading.value = false
      return false
    }
    try {
      // Ensure school and class names are set
      if (teacher.schoolId && !teacher.school) {
        const school = schools.value.find((s) => s.id === teacher.schoolId)
        if (school) {
          teacher.school = school.name
          console.log(`Set school name: ${teacher.school} from ID: ${teacher.schoolId}`)
        }
      }

      if (teacher.classId && !teacher.class) {
        const classData = classes.value[teacher.schoolId]?.find((c) => c.id === teacher.classId)
        if (classData) {
          teacher.class = classData.name
          console.log(`Set class name: ${teacher.class} from ID: ${teacher.classId}`)
        }
      }

      // Map frontend fields to backend expected fields
      const payload = {
        teacher_email: teacher.email,
        teacher_username: teacher.username || teacher.email.split('@')[0],
        teacher_password: teacher.password, // Must be provided in dialog
        teacher_name: teacher.name,
        school_id: teacher.schoolId,
        school_name: teacher.school,
        class_id: teacher.classId,
        class_name: teacher.class,
        teacher_experience: teacher.experience || '',
        teacher_phone: teacher.phone || '',
      }
      const response = await api.post('/teachers/register', payload)
      if (response.data && response.data.teacher) {
        teachers.value.push(mapTeacherToFrontend(response.data.teacher))
        return true
      }
      error.value = response.data?.message || 'Gagal menambah guru.'
      return false
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Gagal menambah guru.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    teachers,
    schools,
    classes,
    loading,
    error,
    fetchTeachers,
    fetchSchools,
    fetchClassesBySchool,
    fetchClassById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
  }
})
