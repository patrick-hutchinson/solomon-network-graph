DO:

d.depth > 1 ? e.target.parentElement.querySelector("h5").classList.add("hovered") : null; might cause issues?

New:

- show type of connections between the first persons in a group

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
