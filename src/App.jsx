import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import solomonData from "./data.json";
import InfoBox from "./assets/Components/InfoBox";
import Navigation from "./assets/Components/Navigation";
import Zoombar from "./assets/Components/Zoombar";

function D3Chart() {
  // http://localhost:5173/

  let chartRef = useRef(null);

  // Set state values for the data graph
  let data = solomonData;
  let root = d3.hierarchy(data);
  let [links, setLinks] = React.useState(root.links());
  let [nodes, setNodes] = React.useState(root.descendants());

  // Set state values for the Zoombar component
  let [zoomAmount, setZoomAmount] = React.useState(0);

  let [hasBeenZoomed, setHasBeenZoomed] = React.useState(false);

  let [initialZoom, setInitialZoom] = React.useState({
    x: 450,
    y: 350,
    k: 0.4,
  });

  let [zoomTransform, setZoomTransform] = React.useState(
    `translate(${initialZoom.x}, ${initialZoom.y}) scale(${initialZoom.k})`
  );

  let width = window.innerWidth * 0.8;
  let height = window.innerHeight * 0.95;

  let zoomRange = [0.25, 1];

  // Set state values for the InfoBox component
  let [nodeInfo, setNodeInfo] = React.useState({
    title: "No Node Selected!",
    date: "dd/mm/yyyy",
    description: "Hover a Datapoint to learn more about it.",
    // ...
  });

  // Declare Scales and Values
  // Perhaps size should be based on height
  let nodeSizesArray = [10, 95, 75, 1, 10];
  let nodeSizes = d3
    .scaleOrdinal() //
    .domain(Array.from(new Set(nodes.map((d) => d.data.type))))
    .range(nodeSizesArray);

  let nodeColorsArray = [
    "transparent",
    "#FF295B",
    "#DE62D9",
    "#44B0FF",
    "#99D934",
    "#FEA800",
    // "#AF1BF5",
    // "#0E6292",
    // "#FF295B",
  ];
  let nodeColors = d3
    .scaleOrdinal() //
    .domain([...new Set(nodes.map((d) => d.data.group))])
    .range(nodeColorsArray);

  // Match filterItems with corresponding nodes
  // (See more in Navigation component)
  function findFilteredNode(IDText) {
    nodes.forEach(function (node) {
      if (node.data.name === IDText) {
        console.log("found the node, its name is ", node);
        // activateNodes(node);
        findDescendants(node);
        findAncestors(node);
        document.documentElement.style.setProperty("--highlightColorClick", nodeColors(node.data.group));
      }
    });
  }

  function findDescendants(filterNode) {
    let descendantNodesArray = [];
    findDescendantsManually(filterNode).forEach(function (descendantNode) {
      // if (filterNode !== descendantNode) {
      descendantNodesArray.push(descendantNode);
      // }
    });

    activateNodes(descendantNodesArray);
  }

  function findAncestors(filterNode) {
    let ancestorNodesArray = [];
    findAncestorsManually(filterNode).forEach(function (ancestorNode) {
      if (filterNode !== ancestorNode) {
        ancestorNodesArray.push(ancestorNode);
      }
    });

    activateNodes(ancestorNodesArray);
  }

  // finding descendants manually seems to be necessary as:
  // when the data of a node gets updated, it (seemingly) loses its elligibility for d3 descendant() functions.
  // perhaps this only works in with the data of the originally generated array, and discrepancies prevent the code from running.
  // finding nodes manually uses the current state of nodes and seems to be working fine.
  function findDescendantsManually(node) {
    let descendants = [];
    function traverse(currentNode) {
      descendants.push(currentNode);

      if (currentNode.children) {
        currentNode.children.forEach((child) => {
          traverse(child);
        });
      }
    }
    traverse(node);
    return descendants;
  }

  function findAncestorsManually(node) {
    let ancestors = [];
    function traverse(currentNode) {
      if (currentNode.parent) {
        ancestors.push(currentNode.parent);
        traverse(currentNode.parent);
      }
    }
    // Include the starting node itself in the ancestors array
    ancestors.push(node);

    traverse(node);
    return ancestors;
  }

  // Change the text highlighing color in the menu to that of the currently hovered node
  function hoverFilteredNode(IDText) {
    nodes.forEach(function (node) {
      if (node.data.name === IDText) {
        document.documentElement.style.setProperty("--highlightColorHover", nodeColors(node.data.group));
      }
    });
  }

  // Change the on value of nodes passed into this function.
  function activateNodes(connectedNodes) {
    setNodes((prevNodes) => {
      let updatedNodes = prevNodes.map((node) => {
        // match the node from the data to the input node via index
        const isConnectedNode = connectedNodes.some((connectedNode) => connectedNode.index === node.index);

        // return the node with the new on value. Return every other node unchanged.
        return isConnectedNode ? { ...node, data: { ...node.data, on: true } } : node;
      });
      // Call updateLinks once after updating all nodes
      updateLinks(updatedNodes);
      // Return the updatedNodes to the stateSetter function
      return updatedNodes;
    });
  }

  function deactivateNodes(connectedNodes) {
    setNodes((prevNodes) => {
      let updatedNodes = prevNodes.map((node) => {
        const isConnectedNode = connectedNodes.some((connectedNode) => connectedNode.index === node.index);

        return isConnectedNode ? { ...node, data: { ...node.data, on: false } } : node;
      });
      updateLinks(updatedNodes);
      return updatedNodes;
    });
  }

  function toggleNodes(connectedNodes) {
    setNodes((prevNodes) => {
      let updatedNodes = prevNodes.map((node) => {
        const isConnectedNode = connectedNodes.some((connectedNode) => connectedNode.index === node.index);

        return isConnectedNode ? { ...node, data: { ...node.data, on: !node.data.on } } : node;
      });
      updateLinks(updatedNodes);
      return updatedNodes;
    });
  }

  function updateLinks(updatedNodes) {
    setLinks((prevLinks) => {
      return prevLinks.map((link) => {
        const findUpdatedNode = (node) => updatedNodes.find((updatedNode) => updatedNode.index === node.index);

        const updatedTargetNode = findUpdatedNode(link.target);
        const updatedSourceNode = findUpdatedNode(link.source);

        return {
          ...link,
          target: updatedTargetNode || link.target,
          source: updatedSourceNode || link.source,
        };
      });
    });
  }

  // Zooming functionality
  function handleZoom(e) {
    d3.selectAll("svg g").attr("transform", e.transform);
    setZoomTransform(d3.zoomTransform(chartRef.current));
    setZoomAmount(e.transform.k);

    setHasBeenZoomed(true);
  }
  let zoom = d3
    .zoom()
    .on("zoom", handleZoom) //
    .scaleExtent(zoomRange)
    .translateExtent([
      [width * -4, height * -4],
      [width * 4, height * 4],
    ]);

  function zoomIn() {
    d3.select("svg").transition().call(zoom.scaleBy, 1.33);
  }
  function zoomOut() {
    d3.select("svg").transition().call(zoom.scaleBy, 0.66);
  }

  useEffect(() => {
    //
    // Declare Dragging / Interaction Functionality
    const drag = (simulation) => {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.2).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3
        .drag()
        .on("start", (event, d) => dragstarted(event, d))
        .on("drag", (event, d) => dragged(event, d))
        .on("end", (event, d) => dragended(event, d));
    };

    //
    // Declare Physics Properties of the Graph
    const simulation = d3
      .forceSimulation(
        nodes.filter((d) => d.data.on === true),
        (d) => d
      )
      .force("link", d3.forceLink(links.filter((d) => d.target.data.on === true)).distance(100))
      .force("charge", d3.forceManyBody().strength(-2000))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(1.1))
      .force(
        "collision",
        d3.forceCollide().radius((d) => nodeSizes(d.data.type))
      );

    //
    // Element Creation
    // Create the Canvas
    const svg = d3
      .select(chartRef.current) //
      .attr("width", width)
      .attr("height", height)
      .call(zoom)
      .call(
        // if the page has not been used yet, base off of the initialZoom values. If it has, use the updated values.
        zoom.transform,
        hasBeenZoomed ? zoomTransform : d3.zoomIdentity.translate(initialZoom.x, initialZoom.y).scale(initialZoom.k)
      )

      .attr("class", "graphCanvas")
      .on("mouseover", function (e) {
        d3.select(this).attr("cursor", "grab"); //
      });

    //Ensure there is no double rendering of nodes,
    //clear before redrawing
    svg.selectAll("*").remove();

    //create a container to hold node and text
    let nodeElement = svg
      .selectAll("g")
      .data(
        nodes.filter((d) => d.data.on === true),
        (d) => d
      )
      .attr("class", "nodeContainer");

    const arrowheads = svg
      .append("defs")
      .selectAll("marker")
      // Linking the nodes data will create a def element for each element in nodes.
      // The refX and fill values will associate to each node, creating an arrowhead that fits for each.
      // Since it goes through from start to finish, we can incremement the id number and later match that with the made arrows.
      .data(nodes, (d) => d)
      // .join("marker")
      .enter()
      .append("marker")
      .attr("id", (d, i) => "arrowhead" + i)
      // Calculation is tailormade to place all arrowheads correctly.
      .attr("refX", (d) => nodeSizes(d.data.type) / 1.5 + 3.5)
      .attr("refY", 3)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto-start-reverse")
      .attr("fill", (d) => nodeColors(d.data.group))
      .append("path")
      .attr("d", "M0,0 L0,6 L4,3 z");

    // Create/draw the Links
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links, (d) => d)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", "1.5");

    // link.exit().remove();

    let elementEnter = nodeElement.enter().append("g");

    // Create the circles
    let circle = elementEnter
      .append("circle")
      .attr("r", (d) => nodeSizes(d.data.type))
      .attr("stroke", (d) => nodeColors(d.data.group))
      //if the depth of the node is smaller than three, fill it. Else, white.
      .attr("fill", (d) => (d.depth < 3 ? nodeColors(d.data.group) : "#fff"))
      .attr("stroke-opacity", (d) => (d.data.on ? 0.6 : 0.1))
      .call(drag(simulation))
      .attr("class", (d) => (d.depth < 3 ? "largeNode" : "smallNode"));

    // Add the Text
    elementEnter
      .append("foreignObject")
      .attr("width", "180px")
      .attr("height", "40px")
      .append("xhtml:h5")
      .attr("class", "nodeTextElement")
      .call(drag(simulation))
      .html((d) => {
        return `<p>${d.data.name} ${d.children ? `[${d.children.length}]` : "[end]"}</p>`;
      })
      .attr("xmlns", "http://www.w3.org/1999/xhtml");

    // Give all foreignObject elements that are small Nodes a class for easier selection
    document.querySelectorAll(".smallNode").forEach(function (smallNode) {
      smallNode.parentElement.querySelector("foreignObject").classList.add("smallText");
    });

    // Turn on Pointer Events for smaller Text
    document.querySelectorAll(".smallText").forEach(function (smallTextContainer) {
      smallTextContainer.querySelector("h5").style.pointerEvents = "all";
    });

    // Style the color of the text
    d3.selectAll("circle").each(function (d) {
      if (this.classList.contains("smallNode")) {
        d3.select(this.parentElement).select("h5").style("color", nodeColors(d.data.group));
        // d3.select(this.parentElement).select("h5").style("color", "#000");
      }
      if (d.depth === 0) {
        d3.select(this.parentElement).select("h5").style("color", "#000");
        d3.select(this).attr("stroke", "#000");
      }
    });

    // Arrow Heads
    // Correctly assign an url("arrowheadX") tag to position the arrowhead based on the target node's radius
    d3.selectAll("line") //
      .attr("marker-end", (d, i) => {
        let markerUrl;

        d3.selectAll("circle").each(function (f) {
          // Add an arrowtop to the line if it the target is a large enough node
          if (d.target === f) {
            markerUrl = `url(#arrowhead${i + 1})`;
          } else {
            null;
          }
        });

        return markerUrl;
      })
      // Match the stroke color to the node group
      .attr("stroke", (d) => {
        let nodeColor;
        d3.selectAll("circle").each(function (f) {
          if (d.target === f) {
            nodeColor = nodeColors(f.data.group);
            // console.log("node mathces color");
            // console.log("d target is", d.target, "f is", f);
          }
        });
        return nodeColor;
      });

    document.querySelectorAll(".zoomButton").forEach(function (zoomButton) {
      zoomButton.addEventListener("mouseenter", function () {
        zoomButton.style.color = "#af1bf5";
      });
      zoomButton.addEventListener("mouseleave", function () {
        zoomButton.style.color = "#000";
      });
    });

    // UPDATE & INTERACTION
    // Cirlces
    d3.selectAll("circle")
      .on("mouseover", function (e, d) {
        d3.select(this) //
          .transition()
          .duration("200")
          .attr("fill", "transparent")
          .attr("cursor", "pointer");

        document.documentElement.style.setProperty("--highlightColorHover", nodeColors(d.data.group));
        // Change the text color contained in the node
        e.target.parentElement.querySelector("h5").classList.add("hovered");

        setNodeInfo((prevNodeInfo) => {
          return { ...prevNodeInfo, title: d.data.name, date: d.data.date, description: d.data.description };
        });
      })
      .on("mouseleave", function (e) {
        d3.select(this) //
          .transition()
          .duration("200")
          .attr("fill", (d) => (d.depth < 3 ? nodeColors(d.data.group) : "#fff"))

          .attr("cursor", "default");
        e.target.parentElement.querySelector("h5").classList.remove("hovered");
      })
      .on("click", handleNodeClick);

    d3.selectAll("svg g").attr("transform", zoomTransform);

    //
    function handleNodeClick(event, clickedNode) {
      console.log("clickedNode is", clickedNode);
      //
      nodes.forEach(function (node) {
        if (node.index === clickedNode.children[0].index) {
          if (node.data.on === true) {
            //close all descendants
            hideDescendantsIfOpen(clickedNode);
          } else {
            //show all children
            showChildren(clickedNode);
          }
        }
      });

      //if a node is clicked, remove any clicked class from the filterItemMenu
      document.querySelectorAll(".filterItem").forEach(function (filterItem) {
        filterItem.classList.remove("clicked");
      });

      // Pan to the clicked node to center it on the screen
      //(...)
    }

    function hideDescendantsIfOpen(clickedNode) {
      let descendantNodesArray = [];
      // findClickDescendants(clickedNode);
      findDescendantsManually(clickedNode).forEach(function (descendantNode) {
        if (descendantNode !== clickedNode) {
          descendantNodesArray.push(descendantNode);
        }
        deactivateNodes(descendantNodesArray);
      });
    }

    function showChildren(clickedNode) {
      let childNodes = clickedNode.children;
      if (childNodes !== undefined) {
        activateNodes(childNodes);
      } else {
        console.log("cannot expand leaf node!");
      }
    }

    // SMALL TEXT NODES
    d3.selectAll(".smallText > h5") //
      .on("mouseover", function (e, d) {
        setNodeInfo((prevNodeInfo) => {
          return { ...prevNodeInfo, title: d.data.name, description: d.data.description };
        });
      })
      .on("click", function (e, d) {
        // Find Children
        function showChildrenNodes(clickedNode) {
          return clickedNode.children;
        }
        let childNodes = showChildrenNodes(d);
        if (childNodes !== undefined) {
          toggleNodes(childNodes);
        } else {
          console.log("cannot expand leaf node!");
        }
      });

    //state is now updated
    // console.log(links);
    //
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      circle
        .attr("cx", (d) => d.x) //
        .attr("cy", (d) => d.y);
      circle.call(drag(simulation));

      elementEnter
        .select("text")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y);

      document.querySelectorAll("foreignObject").forEach(function (foreignObject) {
        let circle = foreignObject.parentElement.querySelector("circle");
        let circleRadius = circle.getAttribute("r");
        if (circle.getAttribute("cx") !== null || circle.getAttribute("cy") !== null) {
          foreignObject.setAttribute("x", circle.getAttribute("cx"));
          foreignObject.setAttribute("y", circle.getAttribute("cy"));
        }

        //only run code if text is contained in a circe
        // here, changing the hardcoded value to, say, the second highest in the nodeWidth scale, might be slightly more dynamic.
        // if (circleRadius > 19) {
        foreignObject.setAttribute("width", "150");
        foreignObject.setAttribute("height", "150");
        foreignObject.style.transform = `translate(-${150 / 2}px, ${-25}px)`;

        // }
      });
    });

    // circle.exit().remove();
    simulation.nodes(nodes);
  }, [nodes]);

  return (
    <div className="componentContainer">
      <Navigation
        className="navigationContainer"
        filterItems={nodes}
        findFilteredNode={findFilteredNode}
        hoverFilteredNode={hoverFilteredNode}
      />
      <Zoombar className="zoombar" zoomAmount={zoomAmount} zoomRange={zoomRange} />
      <InfoBox className="" nodeInfo={nodeInfo} />
      <svg ref={chartRef}></svg>
      <div className="zoomButtonContainer">
        <div className="zoomButton" onClick={zoomIn}>
          Zoom In +
        </div>
        <div className="zoomButton" onClick={zoomOut}>
          Zoom Out -
        </div>
      </div>
    </div>
  );
}

export default D3Chart;
