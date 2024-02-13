DO:

— The zoom popup still gets triggered by the scroll inertia
— Ideally remove event listeners (one remaining)
— Panning to Node doesn't work anymore — It calculates the center position before all nodes are places on the canvas leading to unpredictable results
— Panning and Zooming to Node group only works on first time clicking the group filter

d.depth > 1 ? e.target.parentElement.querySelector("h5").classList.add("hovered") : null; might cause issues?

END: Disable right click
