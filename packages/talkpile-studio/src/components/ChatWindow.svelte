<script>
    import ChatMessage from './ChatMessage.svelte';
    export let messages = [];
</script>

<div class="chat-window-container bg-slate-700 p-4 shadow-inner overflow-y-auto">
    {#each messages as { sender, message, timestamp }}
        <ChatMessage {sender} {message} {timestamp} />
    {/each}
</div>
