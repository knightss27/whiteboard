<script lang="ts">
    import { Palette } from '@untemps/svelte-palette';
    import RangeSlider from 'svelte-range-slider-pips';
    import { onMount } from 'svelte';
    import type Whiteboard from './Whiteboard';
    
    export let wb: Whiteboard;

	const colors = [
        'rgb(255,255,255)',
        'rgba(0,0,0, 0.2)',
        'rgb(0,0,0)',
		'rgb(134, 92, 84)', // '#865C54',
        'rgb(143, 84, 71)',    // '#8F5447',
        'rgb(166, 88, 70)',    // '#A65846',
        'rgb(169, 113, 94)',    // '#A9715E',
        'rgb(173, 140, 114)',    // '#AD8C72',
        'rgb(194, 176, 145)',    // '#C2B091',
        'rgb(23, 43, 65)',    // '#172B41',
        'rgb(50, 70, 92)',    // '#32465C',
        'rgb(97, 120, 153)',    // '#617899',
        'rgb(155, 162, 188)',    // '#9BA2BC',
        'rgb(132, 121, 153)',    // '#847999',
        'rgb(80, 82, 106)',    // '#50526A',
        'rgb(139, 140, 107)',    // '#8B8C6B',
        'rgb(151, 168, 71)',    // '#97A847',
        'rgb(91, 101, 44)',    // '#5B652C',
        'rgb(106, 106, 64)',    // '#6A6A40',
        'rgb(242, 217, 191)',    // '#F2D9BF',
        'rgb(245, 186, 174)',    // '#F5BAAE',
        'rgb(241, 161, 145)',
	]

    const handleShare = async () => {
        const res = await fetch("https://board.poop.fish/boards", {
            method: "POST",
            body: JSON.stringify(wb),
            headers: {
                'Access-Control-Allow-Origin': 'https://board.poop.fish',
                "Content-Type": "application/json"
            }
        })

        const slug = await res.json();
        console.log(slug);

        navigator.clipboard.writeText(`https://board.poop.fish/${slug}`).then(function() {
            console.log('Async: Copying to clipboard was successful!');
        }, function(err) {
            console.error('Async: Could not copy text: ', err);
        });
    }
</script>

<div>
    <Palette {colors} on:select={(e) => {wb.brushColor = e.detail.color; console.log(e.detail.color)}} />
    <RangeSlider min={1} values={[2]} on:stop={(e) => {wb.brushSize = e.detail.value}} float />
    <button on:click={handleShare}>share</button>
</div>

<style>
    div {
        /* display: flex; */
        flex-direction: column;
        position: absolute;
        top: 0;
        left: 0;
        margin: 20px;
        background-color: white;
        box-shadow: 0.1rem 0.1rem 1rem #ccc;
    }

    button {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 2.5rem;
        background-color: #eee;
        border: none;
        color: #99a2a2;
        cursor: pointer;
        transition: ease all 0.5s;
    }

    button:active {
        background-color: #ddd;
    }
</style>