DO:

— The zoom popup still gets triggered by the scroll inertia
— Ideally remove event listeners (one remaining)
— Panning to Node doesn't work anymore — It calculates the center position before all nodes are places on the canvas leading to unpredictable results
— Panning and Zooming to Node group only works on first time clicking the group filter

<<<<<<< Updated upstream
d.depth > 1 ? e.target.parentElement.querySelector("h5").classList.add("hovered") : null; might cause issues?
=======
— Mobile zooming only on pinch

— Check how to differentiate between Chrome and Safari for -webkit positioning (-40 works for chrome, -20 works for safari)

—Ideally fix flickering on enable/disable
— — If a filter is active and a whole group is expanded, the nodes first get enabled, then filtered and disabled
>>>>>>> Stashed changes

END: Disable right click

Desired behaviour:
At start,
All groups are active, meaning they are all showing their sector nodes. Disabling a group hides their sector node, meaning it is currently not eligable to be filterd.

Filters work on all active groups.

The issue: There is no distinction between a group being eligible to be filtered and a button to expand the entire group
