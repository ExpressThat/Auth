<script setup lang="ts">
import { ExTestButton } from "@expressthat-auth/ui-vue";

const handleClick = () => alert("clicked!");
</script>

<template>
  <main style="padding: 2rem; font-family: sans-serif">
    <h1>Vue 3 Example (Vite, no SSR)</h1>
    <p>Renders ExTestButton from @expressthat-auth/ui-vue as a client-side web component.</p>
    <ExTestButton label="Click Me" variant="primary" @ex-test-click="handleClick" />
  </main>
</template>
