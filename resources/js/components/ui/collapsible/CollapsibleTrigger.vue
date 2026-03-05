<script setup>
import { CollapsibleTrigger } from "reka-ui";

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: [String, Object, Function], required: false },
});
</script>

<template>
  <CollapsibleTrigger v-bind="props">
    <slot />
  </CollapsibleTrigger>
</template>
