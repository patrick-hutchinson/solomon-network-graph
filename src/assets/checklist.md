Bonus:
When hovering a Filter Item, the corresponding node lights up

    //TO DO:
    — Fullscreen Button?
    — Zoom and Pan to node on Click
    — Fix Physics
    — If name or year or information is empty, display fallbacl text
    — Fix Bounds
    — Add Sector Nodes
    — Fix zoom jumping issue

Considerations and potiontial potholes:

Finding the node corresponding to the filter item by comparing node name might cause issues (if two nodes with identical nodes exist.)
If that is the case and only the main node should be shown, add a second check that only allows for nodes with a
depth of 2 or less, f.i.
