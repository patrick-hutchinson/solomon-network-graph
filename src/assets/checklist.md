Bonus:
When hovering a Filter Item, the corresponding node lights up

    //TO DO:
    — Zoom and Pan to node on Click
    <!-- — Change the Center node and links to be ideally not visible -->
    — Check if there are as many sectors as on values in json to make sure all is complete
    — Change zoom to be Ctrl/Cmd + Scroll
    — Check note from call with loonatiks and fix all notes

Considerations and potiontial potholes:

Finding the node corresponding to the filter item by comparing node name might cause issues (if two nodes with identical nodes exist.)
If that is the case and only the main node should be shown, add a second check that only allows for nodes with a
depth of 2 or less, f.i.

Given a node with multiple descendant brances, when closing one of them, you will need to click the given node. This, however, will close the other brances as the default behaviour is to close children if "any of them"(actually just the first child) are active. Questionable whether this is desireable.

What doesn't work:
Restraining the sector filtering system to only already expanded nodes.
To me, it could be desirable for the filter to only apply to areas which have already been opened, (i.e where the child of a node filterable node in question is visible.)
this does not work because the function which is in charge of comparing all nodes to the ones that would be applicable by the filter is using an old nodes version—This leads to inaccurate on/off values.

If the path is too long, it runs off of the screen. replace with ellipsis
