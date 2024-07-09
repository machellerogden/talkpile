<script>
    import "../app.css";

    import ChatHeader from '../components/ChatHeader.svelte';
    import ChatWindow from '../components/ChatWindow.svelte';
    import ChatInput from '../components/ChatInput.svelte';
    import MockListing from '../components/MockListing.svelte';
    import MockLLMSettings from '../components/MockLLMSettings.svelte';

    let messages = [
        { sender: 'Alice', message: 'Hello!', timestamp: '10:00 AM' },
        { sender: 'Bob', message: 'Hi Alice!', timestamp: '10:02 AM' },
        // More messages...
    ];

    function sendMessage(newMessage) {
        messages = [
            ...messages,
            { sender: 'You', message: newMessage, timestamp: new Date().toLocaleTimeString() }
        ];
    }
</script>

<div class="bg-slate-900 flex flex-col items-center justify-center min-h-screen p-4">
    <div class="flex flex-row gap-4 w-full">
        <div class="hidden lg:block flex-2">
            <MockListing />
        </div>
        <div class="chat-container flex flex-col flex-1 rounded-4xl overflow-hidden shadow-lg bg-slate-800">
            <ChatHeader title="Chat" />
            <div class="flex-1 overflow-hidden flex flex-col">
                <ChatWindow {messages} class="flex-1" />
            </div>
            <div class="sticky bottom-0 w-full">
                <ChatInput {sendMessage} />
            </div>
        </div>
        <div class="hidden lg:block flex-2">
            <MockLLMSettings />
        </div>
    </div>
</div>

<style>
    .chat-container {
        height: 90vh;
        max-height: 90vh;
    }
</style>
