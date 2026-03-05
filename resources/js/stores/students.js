import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'
import { useAuthStore } from './auth'

export const useStudentsStore = defineStore('students', () => {
  const students = ref([])
  const loading = ref(false)
  const error = ref('')
  const schools = ref([])
  const classes = ref({}) // Map of school_id to array of classes
  const authStore = useAuthStore()

  // Helper function to get authorization headers (similar to videos store)
  const getAuthHeader = () => {
    let token
    let userRole

    if (authStore.isTeacherAuthenticated && authStore.currentTeacher) {
      // Check for token in different possible fields for teachers
      token =
        authStore.currentTeacher.token ||
        authStore.currentTeacher.access_token ||
        authStore.currentTeacher.accessToken
      userRole = 'teacher'

      console.log('Teacher authentication data:', {
        isAuth: authStore.isTeacherAuthenticated,
        teacher: {
          id: authStore.currentTeacher.teacher_id,
          email: authStore.currentTeacher.teacher_email,
          hasToken: !!token,
        },
      })

      // If we still don't have a token, try to find it in nested objects
      if (!token && typeof authStore.currentTeacher === 'object') {
        Object.keys(authStore.currentTeacher).forEach((key) => {
          const value = authStore.currentTeacher[key]
          if (
            !token &&
            typeof value === 'string' &&
            (key.includes('token') ||
              key.includes('Token') ||
              (value.length > 20 && value.includes('.')))
          ) {
            console.log(`Found potential token in field: ${key}`)
            token = value
          }
        })
      }
    } else {
      console.error('No authenticated teacher found')
      return { headers: {} }
    }

    if (!token) {
      console.error('No token found for teacher. This will likely cause authentication errors.')
      return { headers: {} }
    }

    console.log('Setting headers for teacher with token')
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        role: userRole,
      },
    }
  }

  // Map backend student data directly (no legacy/compatibility logic needed)
  const mapStudentToFrontend = (dbStudent) => ({
    id: dbStudent.id,
    username: dbStudent.username,
    name: dbStudent.name,
    school: dbStudent.school,
    schoolId: dbStudent.schoolId,
    class: dbStudent.class,
    classId: dbStudent.classId,
    parentEmail: dbStudent.parentEmail,
    email: dbStudent.email,
  })

  // Fetch students and map directly
  const fetchStudents = async () => {
    loading.value = true
    error.value = ''
    try {
      console.log('Fetching students...')
      const response = await api.get('/students')
      if (response.data && response.data.students) {
        console.log(`Successfully fetched ${response.data.students.length} students`)

        // Map students first
        students.value = response.data.students.map(mapStudentToFrontend)
      } else {
        console.warn('Invalid response from students endpoint:', response.data)
        students.value = []
        error.value = 'Gagal memuatkan data pelajar.'
      }
    } catch (err) {
      console.error('Error fetching students:', err)
      error.value = err.response?.data?.message || err.message || 'Gagal memuatkan data pelajar.'
      students.value = []
    } finally {
      loading.value = false
    }
  }

  // Fetch students by parent (same direct mapping)
  const fetchStudentsByParent = async (parentEmail) => {
    loading.value = true
    error.value = ''
    students.value = []
    try {
      console.log(`Fetching students for parent: ${parentEmail}`)
      const response = await api.get(`/students/parent/${parentEmail}`)

      if (response.data && response.data.students) {
        console.log('Student data received:', response.data.students)

        // Ensure we're mapping properly regardless of property naming
        students.value = response.data.students.map((s) => {
          const mappedStudent = {
            id: s.id || s.user_id,
            username: s.username || s.student_username,
            name: s.name || s.student_name,
            school: s.school || s.school_name || '',
            schoolId: s.schoolId || s.school_id,
            class: s.class || s.class_name || '',
            classId: s.classId || s.class_id,
            parentEmail: s.parentEmail || s.parent_email,
            email: s.email || s.student_email,
          }

          console.log('Mapped student:', mappedStudent)
          return mappedStudent
        })

        console.log(`Successfully mapped ${students.value.length} students`)
      } else {
        console.warn('No students data in the response:', response.data)
        students.value = []
        error.value = 'Tiada data pelajar ditemui untuk ibu bapa ini.'
      }
    } catch (err) {
      console.error('Error fetching students for parent:', err)
      error.value =
        err.response?.data?.message ||
        err.message ||
        'Gagal memuatkan data pelajar untuk ibu bapa ini.'
      students.value = []
    } finally {
      loading.value = false
    }
  }
  // Fetch students by teacher class (filtered by teacher's assigned class)
  const fetchStudentsByTeacherClass = async () => {
    loading.value = true
    error.value = ''
    students.value = []
    try {
      console.log('Fetching students for teacher class...')

      // Get authentication headers
      const { headers } = getAuthHeader()
      if (!headers || !headers.Authorization) {
        throw new Error('Tiada pengesahan guru ditemui')
      }

      const response = await api.get('/students/teacher-class', { headers })

      if (response.data && response.data.students) {
        console.log('Teacher class students data received:', response.data.students)

        // Map students using the same mapping logic
        students.value = response.data.students.map(mapStudentToFrontend)

        console.log(`Successfully fetched ${students.value.length} students for teacher class`)
      } else {
        console.warn('No students data in the response:', response.data)
        students.value = []
        error.value = 'Tiada data pelajar ditemui untuk kelas guru ini.'
      }
    } catch (err) {
      console.error('Error fetching students for teacher class:', err)
      error.value =
        err.response?.data?.message ||
        err.message ||
        'Gagal memuatkan data pelajar untuk kelas guru ini.'
      students.value = []
    } finally {
      loading.value = false
    }
  }

  // Fetch a specific school by ID
  const fetchSchoolById = async (schoolId) => {
    if (!schoolId) {
      console.warn('fetchSchoolById called without schoolId')
      return null
    }

    // Check if we already have this school in our cache
    const cachedSchool = schools.value.find((s) => s.id === schoolId)
    if (cachedSchool) {
      console.log(`School found in cache: ${cachedSchool.name} (ID: ${schoolId})`)
      return cachedSchool
    }

    // If not in cache, try to fetch all schools first (which will populate the cache)
    if (schools.value.length === 0) {
      console.log('No schools in cache, fetching all schools...')
      await fetchSchools()

      // Check again after fetching
      const newlyCachedSchool = schools.value.find((s) => s.id === schoolId)
      if (newlyCachedSchool) {
        console.log(`School found after fetching: ${newlyCachedSchool.name} (ID: ${schoolId})`)
        return newlyCachedSchool
      }
    }

    // If still not found, try to fetch this specific school
    try {
      console.log(`Fetching specific school with ID: ${schoolId}`)
      const response = await api.get(`/schools/${schoolId}`)

      if (response.data) {
        // Check different data formats that might be returned
        let schoolData = response.data

        if (schoolData.error) {
          console.error(`API returned error for school ${schoolId}:`, schoolData.error)
          return null
        }

        // Create a school object with standardized format
        const school = {
          id: schoolData.school_id,
          name: schoolData.name || 'Unnamed School',
          address: schoolData.address || '',
          phone: schoolData.phone || '',
        }

        // Add to our cache if not already there
        if (!schools.value.some((s) => s.id === school.id)) {
          schools.value.push(school)
          console.log(`Added school to cache: ${school.name}`)
        }

        // If we get classes with the response, cache them too
        if (
          schoolData.classes &&
          Array.isArray(schoolData.classes) &&
          schoolData.classes.length > 0
        ) {
          classes.value[schoolId] = schoolData.classes.map((c) => ({
            id: c.class_id,
            name: c.class_name || 'Unnamed Class',
          }))
          console.log(`Cached ${classes.value[schoolId].length} classes for school ${schoolId}`)
        }

        return school
      } else {
        console.warn(`Invalid or empty response from school endpoint for ID ${schoolId}`)
        return null
      }
    } catch (err) {
      console.error(`Error fetching school with ID ${schoolId}:`, err)
      return null
    }
  }

  // Fetch a specific class by ID
  const fetchClassById = async (schoolId, classId) => {
    if (!schoolId || !classId) {
      console.warn(
        `fetchClassById called with missing parameters: schoolId=${schoolId}, classId=${classId}`,
      )
      return null
    }

    // Check if we already have this class in our cache
    if (classes.value[schoolId]) {
      const cachedClass = classes.value[schoolId].find((c) => c.id === classId)
      if (cachedClass) {
        console.log(`Class found in cache: ${cachedClass.name} (ID: ${classId})`)
        return cachedClass
      }
    }

    // If not in cache, try to fetch all classes for this school
    if (!classes.value[schoolId] || classes.value[schoolId].length === 0) {
      console.log(`No classes in cache for school ${schoolId}, fetching...`)
      await fetchClassesBySchool(schoolId)

      // Check again after fetching
      if (classes.value[schoolId]) {
        const newlyCachedClass = classes.value[schoolId].find((c) => c.id === classId)
        if (newlyCachedClass) {
          console.log(`Class found after fetching: ${newlyCachedClass.name} (ID: ${classId})`)
          return newlyCachedClass
        }
      }
    }

    // If still not found, try to fetch this specific class
    try {
      console.log(`Fetching specific class with ID: ${classId}`)
      const response = await api.get(`/classes/${classId}`)

      if (response.data) {
        // Check if response contains error
        if (response.data.error) {
          console.error(`API returned error for class ${classId}:`, response.data.error)
          return null
        }

        // Extract class data, handling different possible response formats
        const classData = {
          id: response.data.class_id,
          name: response.data.class_name || 'Unnamed Class',
          schoolId: response.data.school_id || schoolId,
        }

        // Initialize the classes array for this school if it doesn't exist
        if (!classes.value[schoolId]) {
          classes.value[schoolId] = []
        }

        // Add to our cache if not already there
        if (!classes.value[schoolId].some((c) => c.id === classData.id)) {
          classes.value[schoolId].push(classData)
          console.log(`Added class to cache: ${classData.name} (ID: ${classId})`)
        }

        return classData
      } else {
        console.warn(`Invalid or empty response from class endpoint for ID ${classId}`)
        return null
      }
    } catch (err) {
      console.error(`Error fetching class with ID ${classId}:`, err)
      return null
    }
  }

  // Fetch classes for a specific school
  const fetchClassesBySchool = async (schoolId) => {
    if (!schoolId) {
      console.warn('fetchClassesBySchool called without schoolId')
      return
    }

    try {
      console.log(`Fetching classes for school ID: ${schoolId}`)
      const response = await api.get(`/classes/school/${schoolId}`)

      if (response.data && Array.isArray(response.data)) {
        classes.value[schoolId] = response.data.map((c) => ({
          id: c.class_id,
          name: c.class_name,
        }))
        console.log(
          `Successfully fetched ${classes.value[schoolId].length} classes for school ${schoolId}:`,
          classes.value[schoolId],
        )
      } else {
        console.warn(
          `Invalid response from classes endpoint for school ${schoolId}:`,
          response.data,
        )
        classes.value[schoolId] = []
        error.value = 'Gagal memuatkan data kelas.'
      }
    } catch (err) {
      console.error(`Error fetching classes for school ${schoolId}:`, err)
      error.value = err.response?.data?.message || err.message || 'Gagal memuatkan data kelas.'
      classes.value[schoolId] = []
    }
  }

  // Update an existing student
  const updateStudent = async (student) => {
    loading.value = true
    error.value = ''
    try {
      console.log('Updating student:', student)

      // Ensure school and class names are set if we have the IDs
      if (student.schoolId && !student.school) {
        // Try to find the school name from our cached schools
        const school = schools.value.find((s) => s.id === student.schoolId)
        if (school) {
          student.school = school.name
          console.log(`Set school name: ${student.school} from ID: ${student.schoolId}`)
        } else {
          // If not found, try to fetch school data
          console.log(`School not found in cache, fetching schools...`)
          await fetchSchools()
          const refreshedSchool = schools.value.find((s) => s.id === student.schoolId)
          if (refreshedSchool) {
            student.school = refreshedSchool.name
            console.log(`Set school name from fetched data: ${student.school}`)
          } else {
            console.warn(`School with ID ${student.schoolId} not found, using placeholder`)
            student.school = 'Sekolah ' + student.schoolId // Use a placeholder
          }
        }
      }

      if (student.schoolId && student.classId && !student.class) {
        // Try to find the class name from our cached classes
        if (!classes.value[student.schoolId]) {
          console.log(`No cached classes for school ${student.schoolId}, fetching...`)
          await fetchClassesBySchool(student.schoolId)
        }

        const classData = classes.value[student.schoolId]?.find((c) => c.id === student.classId)
        if (classData) {
          student.class = classData.name
          console.log(`Set class name: ${student.class} from ID: ${student.classId}`)
        } else {
          console.warn(`Class with ID ${student.classId} not found, using placeholder`)
          student.class = 'Kelas ' + student.classId // Use a placeholder
        }
      }

      // Only include fields that match the database schema
      const payload = {
        student_name: student.name,
        student_username: student.username,
        school_id: student.schoolId,
        class_id: student.classId,
        parent_email: student.parentEmail,
        student_email: student.email,
      }

      console.log('Sending update payload:', payload)
      const response = await api.put(`/students/${student.id}`, payload)

      if (response.data && response.data.student) {
        console.log('Student updated successfully:', response.data.student)

        // Update the student in the list if it exists
        const index = students.value.findIndex((s) => s.id === student.id)
        if (index !== -1) {
          students.value[index] = mapStudentToFrontend(response.data.student)
          console.log('Updated student in store:', students.value[index])
        }
        return true
      }

      console.error('Update failed, response:', response.data)
      error.value = response.data?.message || 'Gagal mengemaskini pelajar.'
      return false
    } catch (err) {
      console.error('Error updating student:', err)
      error.value = err.response?.data?.message || err.message || 'Gagal mengemaskini pelajar.'
      return false
    } finally {
      loading.value = false
    }
  }
  // Delete a student
  const deleteStudent = async (studentId) => {
    loading.value = true
    error.value = ''
    try {
      const response = await api.delete(`/students/${studentId}`)
      if (response.data && response.data.success) {
        // Remove the student from the list
        students.value = students.value.filter((s) => s.id !== studentId)
        return true
      }
      error.value = response.data?.message || 'Gagal memadam pelajar.'
      return false
    } catch (err) {
      error.value = err.message || 'Gagal memadam pelajar.'
      return false
    } finally {
      loading.value = false
    }
  }

  // Fetch student profile by ID
  const fetchStudentProfile = async (studentId) => {
    loading.value = true
    error.value = ''
    try {
      console.log(`Fetching student profile for ID: ${studentId}`)
      const response = await api.get(`/students/profile/${studentId}`)

      if (response.data && response.data.student) {
        const student = mapStudentToFrontend(response.data.student)
        console.log('Student profile fetched successfully:', student)
        return student
      } else {
        console.warn('Invalid response from student profile endpoint:', response.data)
        error.value = 'Invalid response from server'
        return null
      }
    } catch (err) {
      console.error('Error fetching student profile:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to fetch student profile'
      return null
    } finally {
      loading.value = false
    }
  }

  // Fetch student profile by username
  const fetchStudentProfileByUsername = async (username) => {
    loading.value = true
    error.value = ''
    try {
      console.log(`Fetching student profile for username: ${username}`)
      const response = await api.get(`/students/profile/username/${username}`)

      if (response.data && response.data.student) {
        const student = mapStudentToFrontend(response.data.student)
        console.log('Student profile fetched successfully:', student)
        return student
      } else {
        console.warn('Invalid response from student profile endpoint:', response.data)
        error.value = 'Invalid response from server'
        return null
      }
    } catch (err) {
      console.error('Error fetching student profile:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to fetch student profile'
      return null
    } finally {
      loading.value = false
    }
  }

  // Fetch all schools
  const fetchSchools = async () => {
    try {
      console.log('Fetching all schools...')
      const response = await api.get('/schools')

      if (response.data && Array.isArray(response.data)) {
        schools.value = response.data.map((s) => ({
          id: s.school_id,
          name: s.name,
          address: s.address || '',
          phone: s.phone || '',
        }))
        console.log(`Successfully fetched ${schools.value.length} schools`)
        return schools.value
      } else {
        console.warn('Invalid response from schools endpoint:', response.data)
        schools.value = []
        return []
      }
    } catch (err) {
      console.error('Error fetching schools:', err)
      schools.value = []
      return []
    }
  }

  return {
    students,
    schools,
    classes,
    loading,
    error,
    fetchStudents,
    fetchStudentsByParent,
    fetchStudentsByTeacherClass,
    fetchSchools,
    fetchClassesBySchool,
    fetchSchoolById,
    fetchClassById,
    updateStudent,
    deleteStudent,
    // Add new functions for student profile
    fetchStudentProfile,
    fetchStudentProfileByUsername,
  }
})
