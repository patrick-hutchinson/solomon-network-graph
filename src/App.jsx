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
  let initialZoom = { k: 0.35, x: 200, y: -50 };
  let [zoomTransform, setZoomTransform] = React.useState(initialZoom);
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
  let nodeSizes = d3
    .scaleOrdinal() //
    .domain(Array.from(new Set(nodes.map((d) => d.data.type))))
    .range([120, 75, 55, 10, 10]);

  let nodeColors = d3
    .scaleOrdinal() //
    .domain([...new Set(nodes.map((d) => d.data.group))])
    .range(["black", "#AF1BF5", "orange", "gold", "blue", "green", "pink", "red", "grey"]);

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
      .attr("fill", "#fff")
      .attr("stroke-opacity", (d) => (d.data.on ? 0.6 : 0.1))
      .call(drag(simulation))

      //update the circes
      //hovering effects
      .on("mouseover", function (e, d) {
        d3.select(this) //
          .transition()
          .duration("200")
          .attr("fill", (d) => (d.depth !== 0 ? nodeColors(d.data.group) : "#fff"))
          .attr("cursor", "pointer");

        d3.select(this.parentNode).select("text").attr("fill", "#fff");
      })
      .on("mouseleave", function (e) {
        d3.select(this) //
          .transition()
          .duration("200")
          .attr("fill", (d) => (d3.select(this).classed("clickedNode") ? nodeColors(d.data.group) : "#fff"))

          .attr("cursor", "default");
        d3.select(this.parentNode)
          .select("text")
          .attr("fill", (d) => nodeColors(d.data.group));
      })
      .on("click", handleNodeClick);

    circle.exit().remove();

    //since the whole graph gets redrawn, the previous zoom position needs to be remembered and assigned to each node.
    d3.selectAll("svg g").attr("transform", zoomTransform);
    console.log(zoomTransform);

    //
    function handleNodeClick(event, clickedNode) {
      //Set the node fill (currently not working)
      d3.select(this) //
        .attr("class", (d) => (d3.select(this).classed("isCliced") ? "" : "isCliced"));

      // function updateNodeInfo(clickedNode) {
      setNodeInfo((prevNodeInfo) => {
        return { ...prevNodeInfo, title: clickedNode.data.name, description: clickedNode.data.description };
      });

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
