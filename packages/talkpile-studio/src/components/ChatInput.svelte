<script>
    let newMessage = '';

    export let sendMessage;

    function handleSend() {
        if (newMessage.trim()) {
            sendMessage(newMessage);
            newMessage = '';
        }
    }
</script>

<div class="chat-input-container bg-slate-800 p-4 flex items-center space-x-2 rounded-4xl">

  <input
    type="text"
    class="flex-1 px-4 py-2 rounded-full bg-slate-800 text-neon-blue border border-slate-700 focus:outline-none focus:ring-2 focus:ring-neon-green"
    placeholder="Type your message..."
    bind:value={newMessage}
    on:keydown={(e) => e.key === 'Enter' && handleSend()}
  />

  <button
    class="bg-neon-green text-slate-900 py-2 px-3 rounded-full hover:bg-neon-green-dark"
    on:click={handleSend}
  >
    Send
  </button>

</div>
