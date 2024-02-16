DO:

— The zoom popup still gets triggered by the scroll inertia
— Ideally remove event listeners (one remaining)
— Panning to Node doesn't work anymore — It calculates the center position before all nodes are places on the canvas leading to unpredictable results
— Panning and Zooming to Node group only works on first time clicking the group filter

d.depth > 1 ? e.target.parentElement.querySelector("h5").classList.add("hovered") : null; might cause issues?

END: Disable right click

Desired behaviour:
At start,
All groups are active, meaning they are all showing their sector nodes. Disabling a group hides their sector node, meaning it is currently not eligable to be filterd.

Filters work on all active groups.

The issue: There is no distinction between a group being eligible to be filtered and a button to expand the entire group
