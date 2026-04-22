<template>
  <div>
    <h1>Vue — @expressthat-auth/ui</h1>
    <Button label="Hello from Vue" :onClick="handleClick" />
  </div>
</template>

<script lang="ts">
import Button from "@expressthat-auth/ui/vue/button";
import { defineComponent } from "vue";

export default defineComponent({
  components: { Button },
  methods: {
    handleClick() {
      alert("Clicked!");
    },
  },
});
</script>
