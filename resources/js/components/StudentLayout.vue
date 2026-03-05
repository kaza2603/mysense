<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Main Content -->
    <div class="flex-1 flex flex-col bg-gray-50">
      <!-- Content Area -->
      <div class="flex-1 overflow-auto">
        <div class="mx-auto">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
