<script setup lang="ts">
import { ExButton } from "@expressthat-auth/ui-vue";
</script>

<template>
  <main style="padding: 2rem; font-family: sans-serif">
    <h1>Nuxt 4 Example (SSR via withSSR vite plugin)</h1>
    <p>ExButton is server-rendered by the Stencil SSR vite plugin.</p>
    <ExButton label="Click Me" variant="primary" @ex-click="() => {console.log(`alert`)}" />
  </main>
</template>
