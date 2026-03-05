<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  items: { type: Array, required: true },
  align: { type: String, default: 'alternate' },
  class: { type: null, required: false },
})

const timelineClasses = computed(() => {
  return cn(
    'relative',
    props.align === 'alternate' ? 'timeline-alternate' : 'timeline-left',
    props.class,
  )
})
</script>

<template>
  <div :class="timelineClasses">
    <!-- Timeline line -->
    <div class="absolute inset-0 h-full w-px bg-yellow-200 ml-9 md:mx-auto" aria-hidden="true" />

    <!-- Timeline items -->
    <div class="relative space-y-8">
      <div
        v-for="(item, index) in items"
        :key="index"
        :class="[
          'relative flex items-center',
          align === 'alternate' && index % 2 === 1 ? 'md:flex-row-reverse' : '',
        ]"
      >
        <!-- Content -->
        <div
          :class="[
            'flex-1',
            align === 'alternate' ? (index % 2 === 0 ? 'md:pr-12' : 'md:pl-12') : 'ml-12',
          ]"
        >
          <slot name="item" :item="item" :index="index">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <slot name="content" :item="item" :index="index" />
            </div>
          </slot>
        </div>

        <!-- Dot -->
        <div
          :class="[
            'absolute left-0 md:static flex items-center justify-center w-7 h-7 rounded-full border-4 border-white bg-yellow-500 shadow',
            align === 'alternate' ? 'md:mx-auto' : '',
          ]"
          aria-hidden="true"
        >
          <slot name="dot" :item="item" :index="index" />
        </div>

        <!-- Opposite Content (for alternate layout) -->
        <div
          v-if="align === 'alternate'"
          class="flex-1 hidden md:block"
          :class="index % 2 === 0 ? 'md:pl-12' : 'md:pr-12'"
        >
          <slot name="opposite" :item="item" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-alternate,
.timeline-left {
  @apply relative;
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>
