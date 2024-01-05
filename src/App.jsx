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
  let [data, setData] = React.useState(solomonData);
  let [root, setRoot] = React.useState(d3.hierarchy(data));
  let [links, setLinks] = React.useState(root.links());
  let [nodes, setNodes] = React.useState(root.descendants());

  // Set state values for the Zoombar component
  let [zoomAmount, setZoomAmount] = React.useState(0);
  //currently not working
  let [zoomTransform, setZoomTransform] = React.useState({ k: 0.35, x: 200, y: -50 });
  let [zoomValues, setZoomValues] = React.useState([0, 0]);

  // Set state values for the InfoBox component
  let [nodeInfo, setNodeInfo] = React.useState({
    title: "No Node Selected!",
    date: "dd/mm/yyyy",
    description: "Click a Datapoint to learn more about it.",
    // ...
  });

  //
  // Declare Scales and Values
  // Perhaps size should be based on height
  let nodeSizesArray = [120, 75, 55, 10, 10];
  let nodeSizes = d3
    .scaleOrdinal() //
    .domain(Array.from(new Set(nodes.map((d) => d.data.type))))
    .range(nodeSizesArray);

  let nodeColorsArray = [
    "black",
    "#20AE98",
    "#DE62D9",
    "#44B0FF",
    "#99D934",
    "#FEA800",
    "#AF1BF5",
    "#0E6292",
    "#FF295B",
  ];
  let nodeColors = d3
    .scaleOrdinal() //
    .domain([...new Set(nodes.map((d) => d.data.group))])
    .range(nodeColorsArray);

  // Create a new array of links and nodes, consisting only of nodes (and connecting links) where on:true.
  // This will update on every rerun and be rerendered.
  let activeNodeArray = [];
  let activeLinkArray = [];
  function findOnElements() {
    function findOnNodes() {
      nodes.forEach(function (node) {
        if (node.data.on) {
          activeNodeArray.push(node);
        }
      });
    }
    findOnNodes();
    findOnLinks(activeNodeArray);
    function findOnLinks(connectingNodes) {
      links.forEach(function (link) {
        connectingNodes.forEach(function (connectingNode) {
          if (link.target === connectingNode) {
            activeLinkArray.push(link);
          }
        });
      });
    }
  }
  findOnElements();

  // Match filterItems with corresponding nodes
  // (See more in Navigation component)
  function findFilteredNode(IDText) {
    let filteredDescendants;
    let filteredAncestors;
    nodes.forEach(function (node) {
      if (node.data.name === IDText) {
        document.documentElement.style.setProperty("--highlightColorClick", nodeColors(node.data.group));

        filteredDescendants = node.descendants();
        filteredAncestors = node.ancestors();
      }
    });
    activateNodeVisibility(filteredDescendants);
    activateNodeVisibility(filteredAncestors);
  }

  // Change the text highlighing color in the menu to that of the currently hovered node
  function hoverFilteredNode(IDText) {
    nodes.forEach(function (node) {
      if (node.data.name === IDText) {
        document.documentElement.style.setProperty("--highlightColorHover", nodeColors(node.data.group));
      }
    });
  }

  // Change a the on value of nodes passed into this function.
  function activateNodeVisibility(connectedNodes) {
    let connectedNodesData = connectedNodes.map((connectedNode) => {
      return connectedNode.data;
    });
    //
    setData((prevData) => {
      // Loop through all objects (which will become Nodes) in the Data
      function findObjects(obj) {
        if (obj.children) {
          obj.children = obj.children.map(findObjects);
        }
        // Update the On value if there is a Match
        if (connectedNodesData.includes(obj)) {
          return { ...obj, on: "on" };
        } else {
          return obj;
        }
      }
      // Rerender both data and root
      const newData = findObjects(prevData);
      setData(newData);
      updateGraph(newData);

      // Retun newData to the stateSetter function
      return newData;
    });
  }

  // A second, separate functions for toggling instead of always turning on.
  // Might merge with the previous one.
  function toggleNodeVisibility(connectedNodes) {
    let connectedNodesData = connectedNodes.map((connectedNode) => {
      return connectedNode.data;
    });
    //
    setData((prevData) => {
      function findObjects(obj) {
        if (obj.children) {
          obj.children = obj.children.map(findObjects); // Update the children recursively
        }
        if (connectedNodesData.includes(obj)) {
          return { ...obj, on: !obj.on };
        } else {
          return obj;
        }
      }
      // Update both data and root
      const newData = findObjects(prevData);
      setData(newData);
      updateGraph(newData);

      return newData;
    });
  }

  // Update the entire tree, regenrate nodes & links after the underlying data has changed
  function updateGraph(newData) {
    const newRoot = d3.hierarchy(newData);
    setRoot(newRoot);

    const newNodes = newRoot.descendants();
    setNodes(newNodes);

    const newLinks = newRoot.links();
    setLinks(newLinks);
  }

  useEffect(() => {
    // These widths need to be adjusted and grabbed live from js
    const width = 867;
    const height = 700;

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

    // Declare Physics Properties of the Graph
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => {
            if (d.target.depth === 1) {
              return 30;
            } else {
              return 100;
            }
          })
          .strength((d) => (d.target.depth < 3 ? 1 : 0.5))
      )
      .force("charge", d3.forceManyBody().strength(-2000))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(1))
      .force(
        "collision",
        d3.forceCollide().radius((d) => nodeSizes(d.data.type))
      );

    // Zooming functionality
    function handleZoom(e) {
      setZoomTransform(e.transform);
      d3.selectAll("svg g").attr("transform", e.transform);
      console.log(e.transform);

      setZoomAmount(e.transform.k);
    }

    let newZoomValues = [0.25, 1];
    setZoomValues(newZoomValues);
    let zoom = d3.zoom().on("zoom", handleZoom).scaleExtent(newZoomValues);

    // Element Creation
    // Create the Canvas
    const svg = d3
      .select(chartRef.current) //
      .attr("width", width)
      .attr("height", height)
      // .attr("style", "outline: thin solid red")
      .call(zoom)
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
      .data(activeNodeArray, (d) => d)
      .attr("class", "nodeContainer");

    const arrowheads = svg
      .append("defs")
      .selectAll("marker")
      // this will run through all of the node data and create a def element for each element in nodes.
      // the refX and fill values will associate through that node. Since it goes through from start to finish,
      // we can incremement the id number and later match that with the made arrows.
      .data(nodes)
      .enter()
      .append("marker")
      .attr("id", (d, i) => "arrowhead" + i)
      //this here just happens to be the magic calculation to place all arrows correctly.
      //first
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
      .data(activeLinkArray, (d) => d)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", "1.5");

    link.exit().remove();

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
      .html((d) => {
        return `<p>${d.data.name} ${d.children ? `[${d.children.length}]` : "[end]"}</p>`;
      })
      .attr("xmlns", "http://www.w3.org/1999/xhtml");

    //style the color of the text
    d3.selectAll("circle").each(function (d) {
      if (this.classList.contains("smallNode")) {
        d3.select(this.parentElement).select("h5").style("color", nodeColors(d.data.group));
      }
    });

    //correctly assign an url("arrowheadX") tag to position the arrowhead based on the target node's radius
    d3.selectAll("line") //
      .attr("marker-end", (d, i) => {
        let markerUrl;

        d3.selectAll("circle").each(function (f) {
          //add an arrowtop to the line if it the target is a large enough node
          if (d.target === f) {
            markerUrl = `url(#arrowhead${i + 1})`;
          } else {
            null;
          }
        });

        return markerUrl;
      })
      .attr("stroke", (d) => {
        let nodeColor;
        d3.selectAll("circle").each(function (f) {
          if (d.target === f) {
            nodeColor = nodeColors(f.data.group);
          } else {
            null;
          }
        });
        return nodeColor;
      });

    // Update the circes
    // Hovering effects
    d3.selectAll("circle")
      .on("mouseover", function (e, d) {
        d3.select(this) //
          .transition()
          .duration("200")
          .attr("fill", "#fff")
          .attr("cursor", "pointer");

        document.documentElement.style.setProperty("--highlightColorHover", nodeColors(d.data.group));
        // Change the text color contained in the node
        e.target.parentElement.querySelector("h5").classList.add("hovered");

        setNodeInfo((prevNodeInfo) => {
          return { ...prevNodeInfo, title: d.data.name, description: d.data.description };
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

    //since the whole graph gets redrawn, the previous zoom position needs to be remembered and assigned to each node.
    d3.selectAll("svg g").attr("transform", zoomTransform);
    console.log(zoomTransform);

    //
    function handleNodeClick(event, clickedNode) {
      //Set the node fill (currently not working)
      d3.select(this) //
        .attr("class", (d) => (d3.select(this).classed("isClicked") ? "" : "isClicked"));

      //if the clicked node is on and contains on descendants, close all deschendant nodes
      function hideDescendantsIfOpen() {
        let descendantNodesArray = [];
        let descendingNodes = clickedNode.descendants();
        descendingNodes.forEach(function (descendingNode) {
          if (descendingNode.data.on && descendingNode !== clickedNode) {
            // toggleNodeVisibility(descendingNode);
            descendantNodesArray.push(descendingNode);
          }
        });
        toggleNodeVisibility(descendantNodesArray);
      }
      hideDescendantsIfOpen();

      document.querySelectorAll(".filterItem").forEach(function (filterItem) {
        filterItem.classList.remove("clicked");
      });

      // Find Parent
      function findParentNode(clickedNode) {
        return clickedNode.parent;
      }
      let parentNode = findParentNode(clickedNode);

      // Find Ancenstors
      function findAnscestorNodes(clickedNode) {
        return clickedNode.ancestors();
      }
      let anscestorNodes = findParentNode(clickedNode);

      // Find Children
      function showChildrenNodes(clickedNode) {
        return clickedNode.children;
      }
      let childNodes = showChildrenNodes(clickedNode);
      if (childNodes !== undefined) {
        toggleNodeVisibility(childNodes);
      } else {
        console.log("cannot expand leaf node!");
      }

      // Find Descendants
      function findDescendants(clickedNode) {
        return clickedNode.descendants();
      }
      let descendants = findDescendants(clickedNode);
      // if (descendants !== undefined) {
      //   toggleNodeVisibility(descendants);
      // } else {
      //   console.log("cannot expand leaf node!");
      // }

      // console.log("parentNode is", findParentNode(clickedNode).data);
      // console.log("ancestorNodes are", findAnscestorNodes(clickedNode));
      // console.log("descendantNodes are", findDescendants(clickedNode));
    }

    //state is now updated
    console.log(links);
    //
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      circle.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      circle.call(drag(simulation));

      elementEnter
        .select("text")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y);

      document.querySelectorAll("foreignObject").forEach(function (foreignObject) {
        let circle = foreignObject.parentElement.querySelector("circle");
        let circleRadius = circle.getAttribute("r");
        foreignObject.setAttribute("x", circle.getAttribute("cx"));
        foreignObject.setAttribute("y", circle.getAttribute("cy"));

        //only run code if text is contained in a circe
        // here, changing the hardcoded value to, say, the second highest in the nodeWidth scale, might be slightly more dynamic.
        // if (circleRadius > 19) {
        foreignObject.setAttribute("width", "150");
        foreignObject.setAttribute("height", "150");
        foreignObject.style.transform = `translate(-${150 / 2}px, ${-25}px)`;
        // }
      });
    });

    circle.exit().remove();
    simulation.nodes(nodes);
  }, [data, nodes, links]);

  return (
    <div className="componentContainer">
      <Navigation
        className="navigationContainer"
        filterItems={nodes}
        findFilteredNode={findFilteredNode}
        hoverFilteredNode={hoverFilteredNode}
      />
      <Zoombar className="zoombar" zoomAmount={zoomAmount} zoomRange={zoomValues} />
      <InfoBox className="" nodeInfo={nodeInfo} />
      <svg ref={chartRef}></svg>
    </div>
  );
}

export default D3Chart;
