<template>
  <div class="min-h-screen flex-1 flex-col">
    <div
      class="pt-24 lg:pt-16"
      :style="{
        paddingTop: 'calc(env(safe-area-inset-top) + 48px)',
      }"
    >
      <!-- pt-16 compensates for the fixed h-16 navbar -->
      <slot />
    </div>
  </div>
</template>
