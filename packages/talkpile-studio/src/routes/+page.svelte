<script>
    import "../app.css";

    import ComponentGrid from '../components/ComponentGrid.svelte';
    import Terminal from '../components/Terminal.svelte';

    import { keyboardShortcut } from '../stores/ui.js';

    $: console.log('keyboardShortcut', $keyboardShortcut);

    let components = [];

    const maxColumns = 5;
    const minColumns = 1;

    function addComponent(component, props) {
        components = [ ...components, { component, props } ];
    }

    async function handleNewTerminal() {
      addComponent(Terminal, { title: 'Example Terminal', port: 9394 });
      columns = Math.min(columns + 1, maxColumns);
    }

    let columns = 0;

</script>

<div class="w-full h-screen min-h-screen flex flex-col bg-slate-900">

    <div class="flex-1 text-white">
        <ComponentGrid {components} {columns} />
    </div>

    <div class="flex justify-between p-4">
        <label for="columns" class="block flex flex-row gap-4 text-neon-blue">
            <input
                type="range"
                min="0" max="5" step="1"
                bind:value={columns}
                class="bg-slate-800 text-neon-blue p-1 px-2 rounded-lg"
            />
            <span class="block pt-1">{columns}</span>
        </label>
        <div class="flex flex-col justify-center">
          <button
              on:click={handleNewTerminal}
              class="bg-neon-green text-slate-900 py-1 px-3 rounded-lg hover:bg-neon-green-dark"
          >
              <span>New Terminal</span>
          </button>
        </div>
    </div>

</div>
