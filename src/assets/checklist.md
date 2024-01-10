Bonus:
When hovering a Filter Item, the corresponding node lights up

    //TO DO:
    — Zoom buttons
    — Fullscreen Button?
    — Zoom and Pan to node on Click


    The concrete problem: links are generated based on the data. Once nodes get updated, the (target) nodes no not match the previous node in the data anymore. The node gets updated, but the node saved under the target for the link does not, there is a data mismatch.

Considerations and potiontial potholes:

Finding the node corresponding to the filter item by comparing node name might cause issues (if two nodes with identical nodes exist.)
If that is the case and only the main node should be shown, add a second check that only allows for nodes with a
depth of 2 or less, f.i.

I'm guessing descendants() is not a function happens because in the nodeData, the node is off, and it it is off, it is not considered part of the data anymore.
It seems to not be working if a node was ever turned off.
