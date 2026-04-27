<script setup lang="ts">
import { ExTestButton } from "@expressthat-auth/ui-vue";
</script>

<template>
  <main style="padding: 2rem; font-family: sans-serif">
    <h1>Nuxt 4 Example (SPA mode, no SSR)</h1>
    <p>ExTestButton is a client-side web component from @expressthat-auth/ui-vue.</p>
    <ExTestButton label="Click Me" variant="primary" @ex-test-click="() => console.log(`alert`)" />
  </main>
</template>
