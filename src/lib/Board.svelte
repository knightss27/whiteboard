<script lang="ts">
import { onMount } from "svelte";
import Controls from "./Controls.svelte";
import Whiteboard from "./Whiteboard";



// Get canvas bounds
let innerWidth: number, innerHeight: number;
let c: HTMLCanvasElement;

// Main whiteboard
let wb: Whiteboard;

let shareText = "share";

onMount(async () => {
    console.log(c)

    wb = new Whiteboard(c);
    document.addEventListener("keydown", (e) => {wb.keydown(e)});


    document.body.onresize = () => {
        wb.draw();
    }

    wb.canvas.ontouchstart = (e: TouchEvent) => {
        if (shareText != "share") {
            shareText = "share";
        }
        wb.touchstart(e);
    }

    if (window.location.hash.length > 1) {
        const slug = window.location.hash.split("#")[1];
        const res = await fetch(`https://board.poop.fish/?board=${slug}`)
        const json = await res.json();
        
        // console.log(json);
        console.log("Loading board JSON")
        wb.loadJson(JSON.parse(json));
    }
})



</script>

<svelte:window bind:innerWidth bind:innerHeight></svelte:window>

<Controls {wb} bind:shareText />
<canvas
    id="test"
    width={innerWidth} 
    height={innerHeight}
    bind:this={c}
/>
  
<style>
  
</style>