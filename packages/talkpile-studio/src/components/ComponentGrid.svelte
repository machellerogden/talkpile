<script>
    export let components = [];
    export let columns = 3; // Default to 3 columns if not provided

    // ensure postcss does not remove unused classes
    'grid-cols-1';
    'grid-cols-2';
    'grid-cols-3';
    'grid-cols-4';
    'grid-cols-5';
    'grid-cols-6';
    'grid-cols-7';
    'grid-cols-8';
    'grid-cols-9';
    'grid-cols-10';
    'grid-cols-11';
    'grid-cols-12';

    $: classes = `grid grid-cols-${columns}`;

</script>

<div class={classes}>

    {#each components as { component: Component, props }, index}
        <div>
            <svelte:component this={Component} {...props} />
        </div>
    {/each}

</div>
