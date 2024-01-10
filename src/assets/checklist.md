Bonus:
When hovering a Filter Item, the corresponding node lights up

    //TO DO:
    — Zoom and Pan to node on Click
    <!-- — Configure Physics -->
    <!-- — Fix Bounds -->
    — Add Sector Nodes
    — Add funding partner nodes?
    — Change the Center node and links to be ideally not visible
    — Tidy up styling on smaller nodes

Considerations and potiontial potholes:

Finding the node corresponding to the filter item by comparing node name might cause issues (if two nodes with identical nodes exist.)
If that is the case and only the main node should be shown, add a second check that only allows for nodes with a
depth of 2 or less, f.i.

Given a node with multiple descendant brances, when closing one of them, you will need to click the given node. This, however, will close the other brances as the default behaviour is to close children if "any of them"(actually just the first child) are active. Questionable whether this is desireable.
