import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Composable to extract quiz identifier from route or component
 * @param {Object} options - Configuration options
 * @param {string} options.unit - Manual unit override
 * @param {number} options.activity - Manual activity override
 * @param {string} options.type - Manual type override
 * @returns {Object} Quiz identifier utilities
 */
export function useQuizIdentifier(options = {}) {
  const route = useRoute()

  // Manual overrides from options
  const manualUnit = options.unit
  const manualActivity = options.activity
  const manualType = options.type

  // Extract from route params/query if available
  const routeUnit = computed(() => route.params.unit || route.query.unit)
  const routeActivity = computed(() => route.params.activity || route.query.activity)
  const routeType = computed(() => route.params.type || route.query.type)

  // Extract from route path patterns
  const pathUnit = computed(() => {
    const path = route.path
    // Match patterns like "/kuiz/unit4/aktiviti2" or "/student/kuiz/unit-4/activity-2"
    const unitMatch = path.match(/unit[-_]?(\d+)/i)
    return unitMatch ? `Unit ${unitMatch[1]}` : null
  })

  const pathActivity = computed(() => {
    const path = route.path
    // Match patterns like "aktiviti2", "activity-2", "act2"
    const activityMatch = path.match(/(?:aktiviti|activity|act)[-_]?(\d+)/i)
    return activityMatch ? parseInt(activityMatch[1]) : null
  })

  // Determine type from component name or route
  const pathType = computed(() => {
    const path = route.path.toLowerCase()
    const name = route.name?.toLowerCase() || ''

    // Common patterns for learning types
    if (path.includes('visual') || name.includes('visual')) return 'visual'
    if (path.includes('kinesthetic') || path.includes('kinestetik') || name.includes('kinesthetic'))
      return 'kinestetik'
    if (path.includes('auditory') || path.includes('auditori') || name.includes('auditory'))
      return 'auditori'

    // Default to visual if not specified
    return 'visual'
  })

  // Final computed values with priority: manual > route params > path extraction
  const unit = computed(() => {
    return manualUnit || routeUnit.value || pathUnit.value
  })

  const activity = computed(() => {
    return (
      manualActivity ||
      (routeActivity.value ? parseInt(routeActivity.value) : null) ||
      pathActivity.value
    )
  })

  const type = computed(() => {
    return manualType || routeType.value || pathType.value
  })

  // Validation
  const isValid = computed(() => {
    return unit.value && activity.value && type.value
  })

  // Generate identifier object
  const identifier = computed(() => ({
    unit: unit.value,
    activity: activity.value,
    type: type.value,
  }))

  // Generate a unique key for caching
  const identifierKey = computed(() => {
    if (!isValid.value) return null
    return `${unit.value}_${activity.value}_${type.value}`.toLowerCase().replace(/\s+/g, '-')
  })

  return {
    unit,
    activity,
    type,
    identifier,
    identifierKey,
    isValid,
    // Debug info
    debug: {
      route: route.path,
      manualUnit,
      manualActivity,
      manualType,
      routeUnit: routeUnit.value,
      routeActivity: routeActivity.value,
      routeType: routeType.value,
      pathUnit: pathUnit.value,
      pathActivity: pathActivity.value,
      pathType: pathType.value,
    },
  }
}
