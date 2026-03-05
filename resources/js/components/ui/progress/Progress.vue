<script setup>
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  value: { type: [Number, null], required: false, default: 0 },
  modelValue: { type: [Number, null], required: false, default: null },
  max: { type: Number, required: false, default: 100 },
  getValueLabel: { type: Function, required: false },
  getValueText: { type: Function, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: [String, Object, Function], required: false },
  class: { type: null, required: false },
})

// Use value prop if provided, otherwise fallback to modelValue
const progressValue = computed(() => {
  const value = props.value ?? props.modelValue ?? 0
  // Ensure value is between 0 and max
  return Math.max(0, Math.min(value, props.max))
})

// Calculate percentage safely
const progressPercentage = computed(() => {
  if (props.max <= 0) return 0
  return (progressValue.value / props.max) * 100
})

const delegatedProps = reactiveOmit(props, 'class', 'value')
</script>

<template>
  <ProgressRoot
    v-bind="delegatedProps"
    :modelValue="progressValue"
    :max="max"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', props.class)"
  >
    <ProgressIndicator
      class="h-full w-full flex-1 bg-primary transition-all"
      :style="`transform: translateX(-${100 - progressPercentage}%);`"
    />
  </ProgressRoot>
</template>
