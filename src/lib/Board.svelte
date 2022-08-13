<script lang="ts">
import { onMount } from "svelte";
import Controls from "./Controls.svelte";
import Whiteboard from "./Whiteboard";



// Get canvas bounds
let innerWidth: number, innerHeight: number;
let c: HTMLCanvasElement;

// Main whiteboard
let wb: Whiteboard;

onMount(async () => {
    console.log(c)

    wb = new Whiteboard(c);
    document.addEventListener("keydown", (e) => {wb.keydown(e)});

    if (window.location.pathname.length > 1) {
        const slug = window.location.pathname.split("/")[1];
        const res = await fetch(`https://board.poop.fish/boards/${slug}`)
        const json: Whiteboard = await res.json();
        
        console.log(json);
        wb.loadJson(json);
    }
})



</script>

<svelte:window bind:innerWidth bind:innerHeight></svelte:window>

<Controls {wb} />
<canvas
    id="test"
    width={innerWidth} 
    height={innerHeight}
    bind:this={c}
/>
  
<style>
  
</style>