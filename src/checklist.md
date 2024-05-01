DO:

— Panning to Node doesn't work anymore — It calculates the center position before all nodes are places on the canvas leading to unpredictable results
— Panning and Zooming to Node group only works on first time clicking the group filter

<<<<<<< Updated upstream
d.depth > 1 ? e.target.parentElement.querySelector("h5").classList.add("hovered") : null; might cause issues?
=======
— Mobile zooming only on pinch

— Check how to differentiate between Chrome and Safari for -webkit positioning (-40 works for chrome, -20 works for safari)

—Ideally fix flickering on enable/disable
— — If a filter is active and a whole group is expanded, the nodes first get enabled, then filtered and disabled

> > > > > > > Stashed changes

END: Disable right click

New:

- remove sector nodes
- more info on click (not on hover)
- nodes should not hide/collapse, they should fade instead, so the network is always completely visible/expanded
- names in first groups should be bigger (2x?)
- make zoom bar draggable
- show type of connections between the first persons in a group
- opening scene shouldnt have crossed groups
- intro animation (zoom)
