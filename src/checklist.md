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

New:

Clicking A node when all children are on should turn it off?

- make zoom bar draggable
- show type of connections between the first persons in a group
- opening scene shouldnt have crossed groups
- intro animation (zoom)

— Perhaps:
if all nodes of a certain sector are on, the filter lights up at the top
That way you know if if you're missing something: If its not lit up, click to light all, if it is, click to dim

—On Launch: MME Filter only turns black upon interacting w the graph

Update: To not Find filter based on index but on Tag
let sectorFilters = document.querySelectorAll(".sectorFilter");
if (isFirstLoad) {
if (sectorFilters.length > 1) {
sectorFilters[1].classList.add("active");
}
}
