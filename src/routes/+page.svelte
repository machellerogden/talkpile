<script>
    import TextBuffer from '$lib/components/TextBuffer.svelte';
    import { browser } from '$app/environment';
    import { darkMode, mode, command, keyListener } from '$lib/store.js';
    import { onMount } from 'svelte';
    import { MODE } from '$lib/constants.js';
    import { nanoid } from 'nanoid';
    import { getChatCompletion, SystemMessage, AIMessage, UserMessage } from '$lib/llm.js';

    let inputNode;
    let inputBuffer = '';

    let commandNode;
    let commandBuffer = '';

    $: if (browser) {
        window.document.documentElement.style.backgroundColor = 'white';
        window.document.documentElement.style.filter = $darkMode
            ? `invert(1) hue-rotate(180deg) contrast(86%) sepia(18%) brightness(93%)`
            : '';
    }

    $: if ($command) console.log('command', $command);

    $: if ($mode === MODE.insert) {
        inputNode?.focus();
    } else if ($mode === MODE.visual) {
    } else if ($mode === MODE.command) {
        commandNode?.focus();
    } else {
    }

    let items = [{ id: nanoid() }, { id: nanoid() }, { id: nanoid() }];
    console.log(items);

    onMount(() => {
        if (browser) window.addEventListener('keyup', keyListener);
        return () => {
            if (browser) window.removeEventListener('keyup', keyListener);
        };
    });

    async function submit(messages) {
        const options = {
            model: 'gpt-4-0613',
            temperature: 0.3,
            n: 1,
            messages
        };
        const response = await getChatCompletion(options);
        console.log('received:', response);
        return response;
    }
</script>

<div id="app">
    <div id="layout">
        <header id="layout-header"></header>
        <main id="layout-main" class="pane pane-xsplit">
            <div class="pane">
                <button
                    on:click={async () => {
                        await submit([
                            SystemMessage(`Your job is tell a joke about whatever topic comes up.`),
                            UserMessage('This is a rose.')
                        ]);
                    }}>here</button
                >
                <TextBuffer
                    bind:inputBuffer
                    bind:this={inputNode}
                    on:blur={() => mode.set(MODE.normal)}
                />
            </div>
        </main>
        <footer id="layout-footer">
            <TextBuffer
                bind:commandBuffer
                bind:this={commandNode}
                on:blur={() => mode.set(MODE.normal)}
            />
        </footer>
    </div>
</div>

<style>
    div#app {
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: stretch;

        height: 100%;

        background-color: #0f090a;
        color: #fff;
    }

    div#layout {
        flex-shrink: 0;
        flex-grow: 1;
        flex-basis: auto;

        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: stretch;
        gap: 1rem;

        padding: 1rem;
        margin: 0;

        text-align: center;
    }

    header#layout-header {
        flex-shrink: 0;
        flex-grow: 0;
        flex-basis: auto;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: stretch;

        color: inherit;
    }

    footer#layout-footer {
        flex-shrink: 0;
        flex-grow: 0;
        flex-basis: auto;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: stretch;

        color: inherit;
    }

    main#layout-main {
        color: inherit;
    }

    .pane {
        flex-shrink: 0;
        flex-grow: 1;
        flex-basis: auto;

        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
        align-items: stretch;
    }

    .pane.pane-xsplit {
        flex-direction: row;
    }

    .pane.pane-ysplit {
        flex-direction: column;
    }
</style>
