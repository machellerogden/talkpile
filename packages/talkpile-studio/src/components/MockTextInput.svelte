<script>
  import { inputSchema } from '../store.js';
  import { onMount } from 'svelte';

  onMount(() => {
    inputSchema.set({ type: 'text', placeholder: 'Enter text here...' });
  });
</script>

<div class="mock-text-input p-4 bg-slate-700 text-neon-blue rounded-lg">
  <p>This is a mock text input component.</p>
</div>

<style>
  .mock-text-input {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }
</style>