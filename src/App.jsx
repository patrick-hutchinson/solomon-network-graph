import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import solomonData from "./data.json";
import InfoBox from "./assets/Components/InfoBox";
import Navigation from "./assets/Components/Navigation";
import Zoombar from "./assets/Components/Zoombar";
import { filter } from "lodash";

function D3Chart() {
  // http://localhost:5173/

  let chartRef = useRef(null);

  // Set state values for the data graph
  let data = solomonData;
  let root = d3.hierarchy(data);
  let [links, setLinks] = React.useState(root.links());
  let [nodes, setNodes] = React.useState(root.descendants());

  let width = window.innerWidth * 0.8;
  let height = window.innerHeight * 0.95;

  // Set state values for the Zoombar component
  let [zoomAmount, setZoomAmount] = React.useState(0);

  let [hasBeenZoomed, setHasBeenZoomed] = React.useState(false);

  let [initialZoom, setInitialZoom] = React.useState({
    x: 200,
    y: 200,
    k: 0.4,
  });

  let [zoomTransform, setZoomTransform] = React.useState(
    `translate(${initialZoom.x}, ${initialZoom.y}) scale(${initialZoom.k})`
  );

  let zoomRange = [0.1, 1.5];

  // Set state values for the InfoBox component
  let [nodeInfo, setNodeInfo] = React.useState({
    title: "Δεν έχει επιλεγεί κόμβος!",
    date: "dd/mm/yyyy",
    description: "Περάστε πάνω από ένα Σημείο Δεδομένων για να μάθετε περισσότερα γι' αυτό.",
    sector: "",
  });

  let [nodePath, setNodePath] = React.useState(["Root"]);

  let [activeSectorFilter, setActiveSectorFilter] = React.useState([]);
  let activeSectorFilterRef = useRef(activeSectorFilter);
  let [allActiveNodes, setAllActiveNodes] = React.useState([]);

  // Declare Scales and Values
  let nodeSizesArray = [10, 135, 95, 75, 75, 0, 0];
  let nodeSizes = d3
    .scaleOrdinal() //
    .domain(Array.from(new Set(nodes.map((d) => d.data.type))))
    .range(nodeSizesArray);

  let nodeColorsArray = ["transparent", "#FF295B", "#DE62D9", "#44B0FF", "#20AE98", "#FEA800"];
  let nodeColors = d3
    .scaleOrdinal() //
    .domain([...new Set(nodes.map((d) => d.data.group))])
    .range(nodeColorsArray);

  function handleZoom(e, newCoordinates) {
    d3.selectAll("svg g").attr("transform", e.transform);
    setZoomTransform(d3.zoomTransform(chartRef.current));

    setZoomAmount(e.transform.k);

    setHasBeenZoomed(true);
  }
  let zoom = d3
    .zoom()
    .on("zoom", handleZoom) //
    .scaleExtent(zoomRange);
  // .translateExtent([
  //   [width * -4, height * -4],
  //   [width * 4, height * 4],
  // ]);

  // let isCommandKeyPressed = false;

  // document.addEventListener("keydown", function (event) {
  //   if (event.key === "Meta" || event.key === "Control") {
  //     // console.log("pressing cmd key!");
  //     isCommandKeyPressed = true;
  //   }
  // });

  // document.addEventListener("keyup", function (event) {
  //   if (event.key === "Meta" || event.key === "Control") {
  //     // console.log("lifting cmd key!");
  //     isCommandKeyPressed = false;
  //   }
  // });

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

  useEffect(() => {
    let allActiveNodes = nodes.filter((node) => node.data.on);

    // Declare Physics Properties of the Graph
    const simulation = d3
      .forceSimulation(allActiveNodes, (d) => d)
      .force(
        "link",
        d3.forceLink(links).distance((d) => {
          if (d.source.depth === 0) {
            return 0;
          } else if (d.source.children) {
            return 300;
          } else if (!d.source.children) {
            return 300;
          }
        })
      )
      .force(
        "charge",
        d3.forceManyBody().strength((d) => {
          if (d.children) {
            return -100 + d.children.length * 100;
          } else if (!d.children) {
            return -500;
          }
        })
      )
      .force("center", d3.forceCenter(width / 2, height / 2).strength(1))
      .force(
        "collision",
        d3.forceCollide().radius((d) => nodeSizes(d.data.type))
      );

    // Element Creation
    // Create the Canvas
    const svg = d3
      .select(chartRef.current) //
      .attr("width", width)
      .attr("height", height)
      .call(zoom)
      .call(
        // If the page has not been used yet, base zoom off of the initialZoom values. If it has, use the updated values.
        zoom.transform,
        hasBeenZoomed ? zoomTransform : d3.zoomIdentity.translate(initialZoom.x, initialZoom.y).scale(initialZoom.k)
      )
      .attr("class", "graphCanvas")
      .on("mouseover", function (e) {
        d3.select(this).attr("cursor", "grab"); //
      });

    // Ensure there is no double rendering of nodes, clear before redrawing
    svg.selectAll("*").remove();

    // Create a container to hold node and text
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
      .attr("refX", (d) => nodeSizes(d.data.type) / 25)
      .attr("refY", 3)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto-start-reverse")
      .attr("fill", (d) => nodeColors(d.data.group))
      .append("path")
      .attr("d", "M0,0 L0,6 L4,3 z");

    // Create and draw the Links
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links, (d) => d)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 1)
      .attr("stroke-width", "3");

    let elementEnter = nodeElement.enter().append("g");

    // Create the circles
    let circle = elementEnter
      .append("circle")
      .attr("r", (d) => nodeSizes(d.data.type))
      .attr("stroke", (d) => nodeColors(d.data.group))
      //if the depth of the node is smaller than three, fill it. Else, white.
      .attr("fill", (d) =>
        d.data.type === "group" ||
        d.data.type === "person" ||
        d.data.type === "company" ||
        d.data.type === "mothercompany"
          ? nodeColors(d.data.group)
          : "#fff"
      )
      .attr("stroke-opacity", (d) => (d.data.on ? 0.6 : 0.1))
      .call(drag(simulation))
      .attr("class", (d) =>
        d.data.type === "group" ||
        d.data.type === "person" ||
        d.data.type === "company" ||
        d.data.type === "mothercompany"
          ? "largeNode"
          : "smallNode"
      );

    // Add the Text
    elementEnter
      .append("foreignObject")
      .attr("width", "180px")
      .attr("height", "40px")
      .append("xhtml:h5")
      .attr("class", "nodeTextElement")
      .call(drag(simulation))
      .html((d) => {
        return `<p>${d.data.name}<br> ${d.children && d.data.type !== "connector" ? `[${d.children.length}]` : ""}</p>`;
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
        if (d.children !== undefined) {
          d3.select(this.parentElement).select("h5").style("color", nodeColors(d.data.group));
        } else {
          d3.select(this.parentElement).select("h5").style("color", "#000");
        }
      }
      if (d.depth === 0) {
        //hide the first node's links
        d3.select(this.parentElement).attr("display", "none");
      }
    });
    //hide the first node's links
    d3.selectAll("line").each(function (d) {
      if (d.source.depth === 0) {
        d3.select(this).attr("display", "none");
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
          }
        });
        return nodeColor;
      });

    // UPDATE & INTERACTION
    // Cirlces
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
          return {
            ...prevNodeInfo,
            title: d.data.name,
            date: d.data.date,
            description: d.data.description,
            sector: d.data.sector,
          };
        });
        setNodePath(findAncestorsManually(d));
      })
      .on("mouseleave", function (e) {
        d3.select(this) //
          .transition()
          .duration("200")

          .attr("fill", (d) =>
            d.data.type === "group" ||
            d.data.type === "person" ||
            d.data.type === "company" ||
            d.data.type === "mothercompany"
              ? nodeColors(d.data.group)
              : "#fff"
          )

          .attr("cursor", "default");
        e.target.parentElement.querySelector("h5").classList.remove("hovered");
      })

      .on("click", handleNodeClick);

    // Apply the current zoomTransform to each node (on each rerender)
    d3.selectAll("svg g").attr("transform", zoomTransform);

    // Event Handling
    function handleNodeClick(event, clickedNode) {
      let nodesToActivate = [];
      //
      nodes.forEach(function (node) {
        //check if any of the clicked node's children is on, meaning that the clicked node is already expanded
        clickedNode.children.forEach(function (clickedNodeChild) {
          if (node.index === clickedNodeChild.index) {
            // Node is already visible
            if (node.data.on === true) {
              // Node is already expanded, close all descendants
              hideDescendantsIfOpen(clickedNode);

              // Node is not yet visible
            } else {
              console.log("activeSectorFilter are", activeSectorFilterRef.current);
              // If no filter is selected, show all nodes
              if (activeSectorFilterRef.current.length == 0) {
                showChildren(clickedNode);

                // If a Filter is selected...
              } else {
                // Check if the clicked node's child is a connecter node,
                // Add the node to the array of nodes to activate, and skip it
                if (clickedNode.children[0].data.type == "connector") {
                  nodesToActivate.push(clickedNode.children[0]);
                  // This here represents the children of the found connector node
                  clickedNode.children[0].children.forEach((skippedNodeChild) => {
                    // Check if the children of the found connector node match one of the current filters
                    if (activeSectorFilterRef.current.includes(skippedNodeChild.data.sector)) {
                      nodesToActivate.push(skippedNodeChild);
                    }
                    activateNodes(nodesToActivate);
                  });
                } else {
                  showChildren(clickedNode);
                }
              }
            }
          }
        });
      });

      //if a node is clicked, remove any clicked class from the filterItemMenu
      document.querySelectorAll(".filterItem").forEach(function (filterItem) {
        filterItem.classList.remove("highlighted");
      });
    }

    function hideDescendantsIfOpen(clickedNode) {
      let descendantNodesArray = [];

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
        // Check for child nodes with data.type === "connector" and open their children
        childNodes.forEach((childNode) => {
          if (childNode.data.type === "connector") {
            showChildren(childNode);
          }
        });
      } else {
        showChildren(clickedNode);
      }
    }

    // SMALL TEXT NODES
    d3.selectAll(".smallText > h5") //
      .on("mouseover", function (e, d) {
        setNodeInfo((prevNodeInfo) => {
          return {
            ...prevNodeInfo,
            title: d.data.name,
            date: d.data.date,
            description: d.data.description,
            sector: d.data.sector,
          };
        });
        // console.log("the nodes ancestors are", findAncestorsManually(d));
        setNodePath(findAncestorsManually(d));
      })
      .on("click", function (e, clickedNode) {
        if (clickedNode.children !== undefined) {
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
        } else {
          console.log("cannot expant a leaf node, you've reached the end!");
        }
      });

    // Set the position attributes of links and nodes each time the simulation ticks.
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        // Shorten the arrow slightly if it is pointing at a lower level node
        .attr("x2", (d) => {
          if (d.target.data.type === "connector") {
            return d.source.x, d.target.x;
          } else if (d.target.data.type === "subcompany") {
            return shortenEndLink(d.source.x, d.target.x);
          } else {
            return shortenLink(d.source.x, d.target.x);
          }
        })

        .attr("y2", (d) => {
          if (d.target.data.type === "connector") {
            return d.source.y, d.target.y;
          } else if (d.target.data.type === "subcompany") {
            return shortenEndLink(d.source.y, d.target.y);
          } else {
            return shortenLink(d.source.y, d.target.y);
          }
        });

      //

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

        foreignObject.setAttribute("width", "150");
        foreignObject.setAttribute("height", "150");
        foreignObject.style.transform = `translate(-${150 / 2}px, ${-25}px)`;
      });
    });

    function shortenLink(sourceCoord, targetCoord, factor = 0.75) {
      return sourceCoord + (targetCoord - sourceCoord) * factor;
    }
    function shortenEndLink(sourceCoord, targetCoord, factor = 0.82) {
      return sourceCoord + (targetCoord - sourceCoord) * factor;
    }

    // circle.exit().remove();
    simulation.nodes(nodes);
  }, [nodes]);

  // Graph Interaction
  // Change the text highlighing color in the menu to that of the currently hovered node
  function hoverFilteredNode(IDText) {
    nodes.forEach(function (node) {
      if (node.data.name === IDText) {
        document.documentElement.style.setProperty("--highlightColorHover", nodeColors(node.data.group));
      }
    });
  }

  // Match filterItems with corresponding nodes
  // (See more in Navigation component)
  function findFilteredNode(IDText) {
    nodes.forEach(function (node) {
      if (node.data.name === IDText) {
        console.log("found a node, its name is ", node);
        findDescendants(node);
        activateAncestors(node);
        setTimeout(() => {
          panToNode(node);
        }, 500);
        document.documentElement.style.setProperty("--highlightColorClick", nodeColors(node.data.group));
      }
    });
  }

  // Filter system initializazion
  useEffect(() => {
    let allListItemElements = document.querySelectorAll(".sectorFilter");

    // Add the acive class to the first element on Start
    if (allListItemElements.length > 0) {
      allListItemElements[0].classList.add("active");
    }
  }, []);

  let allListItemElements = document.querySelectorAll(".sectorFilter");

  // Sector Filtering Click Functionality
  function findFilteredSectorNode(IDText, allSectorFilters) {
    // Disable the active class from the first Filter Item if any other one is clicked
    if (!event.target.innerText.includes("Όλα")) {
      allListItemElements[0].classList.remove("active");
    }

    // When clicking the all button, disable all individual filters
    if (event.target.innerText.includes("Όλα")) {
      allListItemElements.forEach((altListItem) => {
        if (event.target !== altListItem) {
          altListItem.classList.remove("active");
        }
      });
    }

    // Toggle the clicked Filter Item and Add/Remove it from the clicked filter array
    toggleFilter(IDText, allSectorFilters);
  }

  function toggleFilter(IDText, allSectorFilters) {
    let filterIsActive = event.target.classList.contains("active");
    if (!filterIsActive) {
      event.target.classList.add("active");

      // Add the clicked filter to the array
      if (!event.target.innerText.includes("Όλα")) {
        // array is not full, add to it
        if (activeSectorFilter.length < allSectorFilters.length) {
          setActiveSectorFilter((prevActiveSectorFilter) => {
            return [...prevActiveSectorFilter, IDText];
          });
          // array was full, remove all and start fresh
        } else if (activeSectorFilter.length === allSectorFilters.length) {
          setActiveSectorFilter((prevActiveSectorFilter) => {
            return [IDText];
          });
        }
      } else {
        allSectorFilters.forEach((allSectorFilter) => {
          if (!activeSectorFilter.includes(allSectorFilter)) {
            setActiveSectorFilter((prevActiveSectorFilter) => {
              return [...prevActiveSectorFilter, allSectorFilter];
            });
          }
        });
      }
    } else {
      event.target.classList.remove("active");

      // Remove the clicked filter from the array
      if (!event.target.innerText.includes("Όλα")) {
        setActiveSectorFilter((prevActiveSectorFilter) => {
          return prevActiveSectorFilter.filter((sector) => sector !== IDText);
        });
      } else {
        setActiveSectorFilter("");
      }
    }
  }

  // Update the activeSectorFilter Ref
  useEffect(() => {
    activeSectorFilterRef.current = activeSectorFilter;
  }, [activeSectorFilter]);

  // Based on the newest state of the activeSectorFilter, hide all nodes that are not part of the active filter
  function handleNodeFiltering() {
    let nodesToDisable = [];
    let nodesToEnable = [];
    console.log(activeSectorFilterRef.current);

    nodes.forEach((node) => {
      // If Statement declarations
      let nodeIsOn = node.data.on;
      let nodeIsSubcompany = node.data.type === "subcompany";
      let nodeMatchesFilter = activeSectorFilterRef.current.includes(node.data.sector);

      // Find all On Nodes that should stay On
      if (nodeIsSubcompany && nodeMatchesFilter) {
        nodesToEnable.push(node);
      }
      // Find all On Nodes that should be Off
      if (nodeIsOn && (nodeIsSubcompany || node.data.type === "connector") && !nodeMatchesFilter) {
        nodesToDisable.push(node);
      }

      // Find all Nodes that are currently off but match the filter

      //Could potentially add a check that only expands nodes of trees that area already visible
      if (!nodeIsOn && nodeIsSubcompany && nodeMatchesFilter) {
        findAncestorsManually(node).forEach((ancestorNode) => {
          console.log("here's the on ancestor node of the clicked", ancestorNode);
          //this doesn't work because the node data has not updated yet
          if (ancestorNode.depth == 3 && ancestorNode.data.on) {
            console.log("turn it on!");
            nodesToEnable.push(node);
          }
        });
      }
    });
    deactivateNodes(nodesToDisable);

    nodesToEnable.forEach((enabledNode) => activateNodes(findAncestorsManually(enabledNode)));
    activateNodes(nodesToEnable);
  }

  // Use the function within the useEffect
  useEffect(() => {
    handleNodeFiltering();
  }, [activeSectorFilter]);

  //Expand all the sector nodes (the actual ones) when a filter is clicked
  let sectorNodeArray = [];
  function showAllSectors() {
    // console.log("showing all sectors!");
    nodes.forEach(function (node) {
      if (node.data.type === "sector") {
        sectorNodeArray.push(node);
      }
      activateNodes(sectorNodeArray);
    });
  }

  // Apply the zoom transform to the SVG
  function panToNode(filterNode) {
    let filterXPositions = [];
    let filterYPositions = [];

    let descendantAmount = filterNode.descendants().length;

    filterNode.descendants().forEach(function (filterDescendant) {
      console.log("the filterd's transform is", d3.select(filterDescendant).node());
      console.log("filterDescendant", d3.select(filterDescendant).node());
      filterXPositions.push(filterDescendant.x);
      filterYPositions.push(filterDescendant.y);
    });

    let filterXMin = d3.min(filterXPositions);
    let filterXMax = d3.max(filterXPositions);
    let filterYMin = d3.min(filterYPositions);
    let filterYMax = d3.max(filterYPositions);

    let filterXMidPoint = (filterXMin + filterXMax) / 2;
    let filterYMidPoint = (filterYMin + filterYMax) / 2;
    console.log("filterXMidPoint", filterXMidPoint);
    console.log("filterYMidPoint", filterYMidPoint);

    const newZoomCoordinates = {
      x: initialZoom.x + width / 3,
      y: initialZoom.y + height / 3,
      k: 10 / descendantAmount,
    };

    // Create a D3 zoom transform with the new coordinates
    let newZoomTransform = d3.zoomIdentity
      .translate(width / 2 - filterXMidPoint / 3.5, height / 2 - filterYMidPoint / 3.5)
      .scale(0.18);

    console.log("newZoomTransform is", newZoomTransform);

    // Apply the zoom transform with a smooth transition
    d3.select(chartRef.current)
      .transition()
      .duration(750) // Adjust the duration as needed
      .call(zoom.transform, newZoomTransform);
  }

  function findDescendants(filterNode) {
    console.log("running finddescendants");
    let descendantNodesArray = [];
    findDescendantsManually(filterNode).forEach(function (descendantNode) {
      // if (filterNode !== descendantNode) {
      descendantNodesArray.push(descendantNode);
      // }
    });

    activateNodes(descendantNodesArray);
  }

  function activateAncestors(filterNode) {
    let ancestorNodesArray = [];
    findAncestorsManually(filterNode).forEach(function (ancestorNode) {
      ancestorNodesArray.push(ancestorNode);
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

  useEffect(() => {
    document.querySelector(".showInfo").classList.add("hidden");
    document.querySelector(".closeInfoContainer").addEventListener(
      "click",
      () => {
        document.querySelector(".infoContainer").classList.add("hidden");
        document.querySelector(".componentContainer").classList.add("hiddenInfo");
        document.querySelector(".showInfo").classList.remove("hidden");
      },
      []
    );
    document.querySelector(".showInfo").addEventListener("click", () => {
      document.querySelector(".infoContainer").classList.remove("hidden");
      document.querySelector(".componentContainer").classList.remove("hiddenInfo");
      document.querySelector(".showInfo").classList.add("hidden");
    });

    document.querySelectorAll(".dropdownButton").forEach((dropdownButton) => {
      dropdownButton.addEventListener("click", () => {
        if (dropdownButton.classList.contains("sectors")) {
          document.querySelector(".sectorFilters").classList.toggle("visible");
          document.querySelector(".companyFilters").classList.remove("visible");
          dropdownButton.querySelector(".dropdownIcon").classList.toggle("active");
          document.querySelector(".dropdownButton.groups").querySelector(".dropdownIcon").classList.remove("active");
        } else if (dropdownButton.classList.contains("groups")) {
          document.querySelector(".companyFilters").classList.toggle("visible");
          document.querySelector(".sectorFilters").classList.remove("visible");
          dropdownButton.querySelector(".dropdownIcon").classList.toggle("active");
          document.querySelector(".dropdownButton.sectors").querySelector(".dropdownIcon").classList.remove("active");
        }
      });
    });
  }, []);

  function zoomIn() {
    d3.select("svg").transition().call(zoom.scaleBy, 1.33);
  }
  function zoomOut() {
    d3.select("svg").transition().call(zoom.scaleBy, 0.66);
  }

  return (
    <div className="componentContainer">
      <Navigation
        className="navigationContainer"
        filterItems={nodes}
        findFilteredNode={findFilteredNode}
        findFilteredSectorNode={findFilteredSectorNode}
        hoverFilteredNode={hoverFilteredNode}
        showAllSectors={showAllSectors}
        nodePath={nodePath}
      />
      <Zoombar className="zoombar" zoomAmount={zoomAmount} zoomRange={zoomRange} />
      <InfoBox className="" nodeInfo={nodeInfo} />
      <svg ref={chartRef}>{/* <div className="showInfo"></div> */}</svg>
      <div className="showInfo">[Show Info]</div>
      <div className="zoomButtonContainer">
        <span className="zoomNotice">(Press CMD/CTRL + Scroll to zoom)</span>
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
