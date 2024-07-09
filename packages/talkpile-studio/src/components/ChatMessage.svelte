<script>
  export let message;
  export let sender;
  export let timestamp;
</script>

<div class="message my-2 p-2 rounded-md flex items-start space-x-2 bg-slate-800 text-neon-blue shadow-sm">
  <div class="flex-1">
    <div class="text-sm text-neon-green font-semibold">{sender}</div>
    <div class="text-sm">{message}</div>
    <div class="text-xs text-neon-orange mt-1">{timestamp}</div>
  </div>
</div>

<style>
  .message {
    transition: all 0.2s ease-in-out;
  }
  .message:hover {
    transform: translate(-2px, -2px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  }
</style>
