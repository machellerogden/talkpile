<script>
  let chats = [
    { label: 'Chat with Alice', timestamp: '10:00 AM' },
    { label: 'Chat with Bob', timestamp: '10:02 AM' },
    // More chat items...
  ];
</script>

<div class="chat-list bg-slate-800 p-4 rounded-lg shadow-lg">
  <h3 class="text-lg font-semibold text-neon-green font-sleek mb-4">Chats</h3>
  <ul>
    {#each chats as chat}
      <li class="chat-item mb-2 p-2 rounded-lg hover:bg-slate-700 cursor-pointer flex flex-col justify-between">
        <span class="chat-label text-neon-blue">{chat.label}</span>
        <span class="chat-timestamp text-neon-blue text-sm transition-opacity duration-300 opacity-0 chat-item:hover:opacity-100">{chat.timestamp}</span>
      </li>
    {/each}
  </ul>
</div>

<style>
  .chat-item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .chat-item:hover .chat-timestamp {
    opacity: 1;
  }
  .chat-timestamp {
    font-size: 0.75rem; /* Smaller font size */
    opacity: 0;
    transition: opacity 0.3s;
  }
</style>
