    //TO DO:
    — Zoom and Pan to node on Click


    // If a node is clicked and expanded, add it to the activeGroupFilter
    — I fear this doesn't work properly yet, as the group will still be set as active if the first level node is clicked, or if a node is clicked that hides all—In that case the group filter should be removed again

    —size is based on amount of descendants

—length of arrows should be shorter
—ideally nothing crossing

—cmd scrolling for zoom

(—see if center node can be removed)

— ATM when clicking a node the entire tree expands (issue occurs since all sector filters get added on initial load)

//
//
//Considerations and potiontial potholes:

Finding the node corresponding to the filter item by comparing node name might cause issues (if two nodes with identical nodes exist.)
If that is the case and only the main node should be shown, add a second check that only allows for nodes with a
depth of 2 or less, f.i.

Given a node with multiple descendant brances, when closing one of them, you will need to click the given node. This, however, will close the other brances as the default behaviour is to close children if "any of them"(actually just the first child) are active. Questionable whether this is desireable.

What doesn't work:
Restraining the sector filtering system to only already expanded nodes.
To me, it could be desirable for the filter to only apply to areas which have already been opened, (i.e where the child of a node filterable node in question is visible.)
this does not work because the function which is in charge of comparing all nodes to the ones that would be applicable by the filter is using an old nodes version—This leads to inaccurate on/off values.

Issues:
Command + Click to Zoom
Passing the newest state of Nodes to handleNodeFiltering();
