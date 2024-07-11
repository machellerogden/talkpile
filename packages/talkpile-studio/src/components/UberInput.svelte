<script>
  import { createEventDispatcher } from 'svelte';
  import { inputSchema } from '../store.js';
  import { onMount } from 'svelte';

  let schema = {};
  let inputValue = '';
  let file = null;
  const dispatch = createEventDispatcher();

  onMount(() => {
    inputSchema.subscribe(value => {
      schema = value;
    });
  });

  function handleSend() {
    if (schema.type === 'text' && inputValue.trim()) {
      dispatch('send', { value: inputValue });
      inputValue = '';
    } else if (schema.type === 'file' && file) {
      dispatch('send', { file });
      file = null;
    }
  }
</script>

<div class="uber-input-container bg-slate-800 p-4 flex items-center space-x-2 rounded-4xl fixed bottom-4 left-1/2 transform -translate-x-1/2">
  {#if schema.type === 'text'}
    <input
      type="text"
      class="flex-1 px-4 py-2 rounded-full bg-slate-800 text-neon-blue border border-slate-700 focus:outline-none focus:ring-2 focus:ring-neon-green"
      placeholder={schema.placeholder || 'Type here...'}
      bind:value={inputValue}
      on:keydown={(e) => e.key === 'Enter' && handleSend()}
    />
  {:else if schema.type === 'file'}
    <input
      type="file"
      class="flex-1 px-4 py-2 rounded-full bg-slate-800 text-neon-blue border border-slate-700 focus:outline-none focus:ring-2 focus:ring-neon-green"
      on:change={(e) => file = e.target.files[0]}
    />
  {/if}
  <button
    class="bg-neon-green text-slate-900 py-2 px-3 rounded-full hover:bg-neon-green-dark"
    on:click={handleSend}
  >
    Send
  </button>
</div>

<style>
  .uber-input-container {
    width: 90%;
    max-width: 600px;
  }
</style>