<script setup lang="ts">
import { ExButton } from "@expressthat-auth/ui-vue";
</script>

<template>
  <main style="padding: 2rem; font-family: sans-serif">
    <h1>Nuxt 4 Example (SPA mode, no SSR)</h1>
    <p>ExButton is a client-side web component from @expressthat-auth/ui-vue.</p>
    <ExButton label="Click Me" variant="primary" @ex-click="() => console.log(`alert`)" />
  </main>
</template>
