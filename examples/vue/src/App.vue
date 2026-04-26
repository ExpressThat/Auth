<script setup lang="ts">
import { ExButton } from "@expressthat-auth/ui-vue";

const handleClick = () => alert("clicked!");
</script>

<template>
  <main style="padding: 2rem; font-family: sans-serif">
    <h1>Vue 3 Example (Vite, no SSR)</h1>
    <p>Renders ExButton from @expressthat-auth/ui-vue as a client-side web component.</p>
    <ExButton label="Click Me" variant="primary" @ex-click="handleClick" />
  </main>
</template>
