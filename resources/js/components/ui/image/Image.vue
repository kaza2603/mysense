<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, required: true },
  width: { type: [String, Number], default: 'auto' },
  height: { type: [String, Number], default: 'auto' },
  class: { type: String, default: '' },
})
</script>

<template>
  <div :class="cn('relative overflow-hidden', props.class)">
    <img
      :src="src"
      :alt="alt"
      :style="{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }"
      class="object-cover transition-all hover:scale-105 duration-300"
      loading="lazy"
    />
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  img {
    transition: none !important;
  }
}
</style>
