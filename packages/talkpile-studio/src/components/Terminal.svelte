<script>
    import { onMount } from 'svelte';
    import { Terminal } from '@xterm/xterm';
    import { WebLinksAddon } from '@xterm/addon-web-links';
    import { AttachAddon } from '@xterm/addon-attach';
    import { WebglAddon } from '@xterm/addon-webgl';
    import { Unicode11Addon } from '@xterm/addon-unicode11';
    import { FitAddon } from '@xterm/addon-fit';
    import { useResizeObserver } from '../directives/useResizeObserver.js';

    export let port = 9394;

    const socket = new WebSocket(`ws://localhost:${port}`);

    const sendResize = size => socket.send(JSON.stringify({ event: 'resize', size }));

    let term;
    let termElement;

    let webLinksAddon = new WebLinksAddon();
    let attachAddon = new AttachAddon(socket);
    let webglAddon = new WebglAddon();
    let unicode11Addon = new Unicode11Addon();
    let fitAddon = new FitAddon();

    onMount(() => {

        term = new Terminal({
            allowProposedApi: true,
            fontFamily: `"Source Code Pro for Powerline", Monaco, "Lucida Console", Courier, monospace`,
            theme: {
                background: "rgba(0,0,0,0.8)"
            }
        });

        term.loadAddon(webLinksAddon);
        term.loadAddon(attachAddon);
        term.loadAddon(fitAddon);
        term.loadAddon(unicode11Addon);
        term.unicode.activeVersion = '11';

    });

    $: if (termElement && term) {

        term.open(termElement);
        term.loadAddon(webglAddon);
        webglAddon.onContextLoss(e => webglAddon.dispose());
        fitAddon.fit();

        //term.write('Hello from Talkpile!\r\n');

    }

    let ptyResizeHandler;

    socket.addEventListener('open', event => {
        sendResize({ cols: term.cols, rows: term.rows });
        ptyResizeHandler = term.onResize(sendResize);
    });

    socket.addEventListener('close', event => {
        ptyResizeHandler?.dispose();
    });

    const debounce = (fn, ms) => {
        let timeout;
        return function() {
            const fnCall = () => { fn.apply(this, arguments); };
            clearTimeout(timeout);
            timeout = setTimeout(fnCall, ms);
        };
    };

    let ignoreRefit = false;

    function handleResize(entry) {
        if (ignoreRefit) {
            ignoreRefit = false;
            return;
        }
        ignoreRefit = true;
        fitAddon.fit();
    }

</script>

<div class="bg-slate-800">
    <div
        use:useResizeObserver={handleResize}
        bind:this={termElement}
    />
</div>
