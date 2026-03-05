import { defineStore } from 'pinia'
import { ref } from 'vue'

const TOPICS = [
  'BENDA HIDUP DAN BENDA BUKAN HIDUP',
  'MANUSIA',
  'HAIWAN',
  'TUMBUHAN',
  'CAHAYA',
  'AIR',
  'BENTUK MUKA BUMI',
  'BENCANA ALAM',
  'KITAR SEMULA',
  'KENALI MALAYSIA',
  'MASYARAKAT DI MALAYSIA',
  'KEMAHIRAN SOSIAL DI TEMPAT AWAM',
]

// Helper function to generate realistic mock data
const generateMockPerformance = (studentId) => {
  // Generate a unique seed based on student ID for consistent randomization
  let seedValue = studentId * 137
  const random = (min, max) => {
    seedValue = (seedValue * 9301 + 49297) % 233280
    const rnd = seedValue / 233280
    return Math.floor(rnd * (max - min + 1)) + min
  }

  // Generate quiz performance data
  const completedCount = random(3, 8) // Each student has completed 3-8 topics
  const quizzes = TOPICS.map((topic, index) => {
    const completed = index < completedCount
    return {
      topic,
      completed,
      score: completed ? random(65, 98) : 0, // Scores between 65-98%
      timeSpent: completed ? random(20, 45) : 0, // 20-45 minutes per topic
      attemptCount: completed ? random(1, 3) : 0,
      lastAttemptDate: completed
        ? new Date(Date.now() - random(1, 30) * 24 * 60 * 60 * 1000).toISOString()
        : null,
      strengthAreas: completed
        ? [
            random(1, 100) > 30 ? 'Pemahaman Konsep' : null,
            random(1, 100) > 40 ? 'Penyelesaian Masalah' : null,
            random(1, 100) > 50 ? 'Mengingat Fakta' : null,
          ].filter(Boolean)
        : [],
      improvementAreas: completed
        ? [
            random(1, 100) > 60 ? 'Perbendaharaan Kata Sains' : null,
            random(1, 100) > 70 ? 'Aplikasi Konsep' : null,
            random(1, 100) > 80 ? 'Analisis Data' : null,
          ].filter(Boolean)
        : [],
    }
  })

  // Generate weekly activity data (last 7 days)
  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
    const baseTime = random(30, 90) // Base time 30-90 minutes
    const adjustedTime = i < 5 ? baseTime : Math.floor(baseTime * 0.7) // Less time on weekends

    return {
      date: date.toISOString(),
      timeSpent: adjustedTime,
      activitiesCompleted: random(2, 6),
      topicsStudied: random(1, 3),
    }
  })

  // Generate monthly progress data
  const monthlyProgress = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000)
    return {
      month: month.toISOString(),
      topicsCompleted: random(0, 2),
      averageScore: random(70, 95),
      totalTimeSpent: random(200, 400),
    }
  }).reverse()

  return {
    quizzes,
    weeklyActivity,
    monthlyProgress,
    learningStyle: {
      visual: random(60, 90),
      auditory: random(40, 80),
      kinesthetic: random(50, 85),
    },
    overallStats: {
      totalQuizzesTaken: quizzes.reduce((acc, q) => acc + q.attemptCount, 0),
      averageTimePerSession: random(25, 45),
      consistencyScore: random(70, 95),
      engagementLevel: ['Tinggi', 'Sederhana', 'Rendah'][random(0, 2)],
    },
  }
}

// Generate mock data for each student
const mockPerformanceData = {
  1: generateMockPerformance(1),
  2: generateMockPerformance(2),
  3: generateMockPerformance(3),
  4: generateMockPerformance(4),
  5: generateMockPerformance(5),
  6: generateMockPerformance(6),
  7: generateMockPerformance(7),
  8: generateMockPerformance(8),
}

export const usePerformanceStore = defineStore('performance', () => {
  const performanceData = ref({})

  const fetchStudentPerformance = async (studentId) => {
    console.log('Fetching performance data for student ID:', studentId)

    try {
      // Import the new performance store
      const { useStudentPerformanceStore } = await import('./studentPerformance')
      const performanceStore = useStudentPerformanceStore()

      // Fetch real data from API
      const data = await performanceStore.fetchStudentAnalytics(studentId)

      // Transform the data to match the expected format for backward compatibility
      const transformedData = {
        quizzes: performanceStore.getTopicPerformance(studentId),
        weeklyActivity: performanceStore.getWeeklyActivityData(studentId),
        monthlyProgress: [], // Could be implemented later
        learningStyle: performanceStore.getLearningStylePreference(studentId).percentages,
        overallStats: performanceStore.getPerformanceStats(studentId),
      }

      performanceData.value[studentId] = transformedData
      return transformedData
    } catch (error) {
      console.error('Failed to fetch real performance data, falling back to mock:', error)

      // Fallback to mock data if API fails
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Handle different ID formats
      let numericId = 1 // Default fallback ID

      if (typeof studentId === 'number') {
        // If it's already a number, use it directly
        numericId = studentId % 8 || 1 // Use modulo to stay within our data range 1-8
      } else if (typeof studentId === 'string') {
        if (studentId.startsWith('S')) {
          // If it's an SXXXXX format, extract the numeric part
          if (studentId === 'S12345') {
            numericId = 4 // Special case for demo student
          } else {
            const extractedNum = parseInt(studentId.substring(1)) % 8
            numericId = extractedNum || 1 // Fallback to 1 if parsing fails
          }
        } else if (studentId.includes('-')) {
          // Likely a UUID from Supabase - use a hash function to get a stable number between 1-8
          let hash = 0
          for (let i = 0; i < studentId.length; i++) {
            hash = (hash << 5) - hash + studentId.charCodeAt(i)
            hash = hash & hash // Convert to 32bit integer
          }
          numericId = Math.abs(hash % 8) + 1 // Get a number between 1-8
        } else {
          // For any other string format, hash it to get a consistent numeric ID
          let hash = 0
          for (let i = 0; i < studentId.length; i++) {
            hash = (hash << 5) - hash + studentId.charCodeAt(i)
            hash = hash & hash
          }
          numericId = Math.abs(hash % 8) + 1
        }
      }

      console.log('Using mock data ID:', numericId)

      // Use the mock data if it exists, or generate new data
      performanceData.value[studentId] =
        mockPerformanceData[numericId] || generateMockPerformance(numericId)
      return performanceData.value[studentId]
    }
  }

  const getStudentStats = (studentId) => {
    const data = performanceData.value[studentId]
    if (!data) return null

    const completedQuizzes = data.quizzes.filter((q) => q.completed)
    return {
      totalQuizzes: data.quizzes.length,
      completedQuizzes: completedQuizzes.length,
      averageScore:
        completedQuizzes.length > 0
          ? Math.round(
              completedQuizzes.reduce((acc, q) => acc + q.score, 0) / completedQuizzes.length,
            )
          : 0,
      totalTimeSpent: data.quizzes.reduce((acc, q) => acc + q.timeSpent, 0),
      progressPercentage: Math.round((completedQuizzes.length / data.quizzes.length) * 100),
      learningStyle: data.learningStyle,
      overallStats: data.overallStats,
    }
  }

  const getWeeklyActivity = (studentId) => {
    const data = performanceData.value[studentId]
    if (!data) return []
    return data.weeklyActivity
  }

  const getTopicPerformance = (studentId) => {
    const data = performanceData.value[studentId]
    if (!data) return []
    return data.quizzes
  }

  const getMonthlyProgress = (studentId) => {
    const data = performanceData.value[studentId]
    if (!data) return []
    return data.monthlyProgress
  }

  const getLearningAnalytics = (studentId) => {
    const data = performanceData.value[studentId]
    if (!data) return null

    const completedQuizzes = data.quizzes.filter((q) => q.completed)
    const strengthAreas = completedQuizzes
      .flatMap((q) => q.strengthAreas)
      .reduce((acc, area) => {
        acc[area] = (acc[area] || 0) + 1
        return acc
      }, {})

    const improvementAreas = completedQuizzes
      .flatMap((q) => q.improvementAreas)
      .reduce((acc, area) => {
        acc[area] = (acc[area] || 0) + 1
        return acc
      }, {})

    return {
      strengthAreas,
      improvementAreas,
      learningStyle: data.learningStyle,
      consistencyScore: data.overallStats.consistencyScore,
      engagementLevel: data.overallStats.engagementLevel,
    }
  }

  return {
    fetchStudentPerformance,
    getStudentStats,
    getWeeklyActivity,
    getTopicPerformance,
    getMonthlyProgress,
    getLearningAnalytics,
  }
})
