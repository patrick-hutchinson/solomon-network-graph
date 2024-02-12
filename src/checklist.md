DO:

— The zoom popup still gets triggered by the scroll inertia
— Ideally remove event listeners (one remaining)
— Panning to Node doesn't work anymore — It calculates the center position before all nodes are places on the canvas leading to unpredictable results
— Panning and Zooming to Node group only works on first time clicking the group filter

— Mobile panning wiht two fingers only

— Check how to differentiate between Chrome and Safari for -webkit positioning (-40 works for chrome, -20 works for safari)

END: Disable right click
