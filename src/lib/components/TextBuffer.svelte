<script>
    import { onMount } from 'svelte';
    export let id = 'buffer';
    export let buffer = '';

    function observe(element, event, handler) {
        element.addEventListener(event, handler, false);
    }

    let textarea;

    function init() {
        function resize() {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
        function resizeImmediate() {
            window.setTimeout(resize, 0);
        }
        observe(textarea, 'change', resize);
        observe(textarea, 'cut', resizeImmediate);
        observe(textarea, 'paste', resizeImmediate);
        observe(textarea, 'drop', resizeImmediate);
        observe(textarea, 'keydown', resizeImmediate);
        textarea.focus();
        textarea.select();
        resize();
    }

    export const focus = () => {
        textarea.focus();
    };

    onMount(() => {
        init();
    });
</script>

<div class="wrapper">
    <div class="wrapper-row">
        <textarea
            {id}
            name={id}
            type="text"
            rows="1"
            placeholder=" "
            bind:this={textarea}
            bind:value={buffer}
            on:keyup|stopPropagation={(e) => e.key === 'Escape' && e?.target?.blur()}
            on:keypress|stopPropagation
            on:blur
        />
    </div>
</div>

<style>
    .wrapper {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        margin: 0;
        text-align: center;
    }
    .wrapper-row {
        flex-shrink: 0;
        flex-grow: 1;
        flex-basis: auto;
    }
    textarea {
        display: block;
        width: 100%;
        border-style: none;
        border-width: 0px;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-family: 'Courier New', monospace;
        background-color: inherit;
        color: inherit;
        padding: 1rem 0.9rem;
    }
    textarea:focus {
        background-color: rgba(255, 255, 255, 0.03);
    }
    textarea:not(:placeholder-shown) {
        background-color: rgba(255, 255, 255, 0.01);
    }
    textarea:focus-visible {
        outline: 0 none;
    }
    textarea::-webkit-resizer {
        -webkit-appearance: none;
    }
</style>
