<script context="module">
    import dragimageUrl from '../assets/images/dragimage.png';
    const img = document.createElement('img');
    img.src = dragimageUrl;
</script>

<script>
    import { dragging } from '../stores/ui.js';
    export let json = '';
    let el;

    function handleDragstart(evt) {
        evt.dataTransfer.setDragImage(img, 0, 0);
        $dragging = true;
        evt.dataTransfer.setData('application/json', json);
    }

    function handleDragover(evt) {
        evt.dataTransfer.dropEffect = 'copy';
    }

    function handleDragend(evt) {
        $dragging = false;
    }
</script>

<span draggable={true} bind:this={el} on:dragover|preventDefault={handleDragover} on:dragstart={handleDragstart} on:dragend={handleDragend}>
    <slot></slot>
</span>
