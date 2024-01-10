Bonus:
When hovering a Filter Item, the corresponding node lights up

    //TO DO:
    — Fullscreen Button?
    — Zoom and Pan to node on Click

Considerations and potiontial potholes:

Finding the node corresponding to the filter item by comparing node name might cause issues (if two nodes with identical nodes exist.)
If that is the case and only the main node should be shown, add a second check that only allows for nodes with a
depth of 2 or less, f.i.
