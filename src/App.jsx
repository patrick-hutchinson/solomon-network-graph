import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import InfoBox from "./assets/Components/InfoBox";
import Navigation from "./assets/Components/Navigation";
import Zoombar from "./assets/Components/Zoombar";

function D3Chart() {
  // http://localhost:5173/

  let chartRef = useRef(null);

  let [isCommandKeyPressed, setIsCommandKeyPressed] = React.useState(false);

  let [data, setData] = React.useState([]); // Initialize with an array
  // Set state values for the data graph
  let root = d3.hierarchy(data);
  let [links, setLinks] = React.useState(root.links());
  let [nodes, setNodes] = React.useState(root.descendants());

  // Fetch the Data
  React.useEffect(() => {
    fetch("https://raw.githubusercontent.com/patrick-hutchinson/solomon-network-graph/main/src/data.json")
      .then((res) => res.json())
      .then((dataArray) => {
        setData(dataArray);
        console.log("data fetched, data is", dataArray);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  // Create hierarchy and set links and nodes when data changes
  React.useEffect(() => {
    const root = d3.hierarchy(data); // Wrap data in an object with a "children" property
    setLinks(root.links());
    setNodes(root.descendants());
  }, [data]);

  React.useEffect(() => {
    setFilterInfo(nodes);
  }, [nodes]);

  let width = window.innerWidth * 0.8;
  let height = window.innerHeight * 0.95;

  let [isFirstLoad, setIsFirstLoad] = React.useState(true);

  // Set state values for the Zoombar component
  let [zoomAmount, setZoomAmount] = React.useState(0);

  let [hasBeenZoomed, setHasBeenZoomed] = React.useState(false);

  let [initialZoom, setInitialZoom] = React.useState({
    x: 0,
    y: 500,
    k: 0.7,
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
    shareholders: "",
  });

  let [nodePath, setNodePath] = React.useState(["Root"]);

  let [filterInfo, setFilterInfo] = React.useState(nodes);

  let isOnMobile = window.innerWidth < 600;

  let isOnTablet = window.matchMedia(
    "(min-device-width: 601px) and (max-device-width: 1080px) and (-webkit-min-device-pixel-ratio: 1)"
  ).matches;

  let isOnDesktop = !isOnMobile && !isOnTablet;

  // For the Filtering System, it is necessary to track if the graph is being updated because of the Filtering-System or
  // a click of a node. If a node is clicked, the graph should only expand its children—If top group filter is clicked,
  // it should expand all.
  let [updateCameFromClickedNode, setUpdateCameFromClickedNode] = React.useState(false);

  let [activeSectorFilter, setActiveSectorFilter] = React.useState([
    "Όλα",
    "MME",
    "ΕΝΕΡΓΕΙΑ",
    "ΑΘΛΗΤΙΣΜΟΣ",
    "ΝΑΥΤΙΛΙΑ",
    "ΑΡΓΟΝΑΥΤΗΣ",
    "REAL ESTATE",
    "ΕΜΠΟΡΙΟ",
    "ΣΥΜΜΕΤΟΧΩΝ",
    "ΞΕΝΟΔΟΧΕΙΑ",
    "ΥΠΗΡΕΣΙΕΣ",
    "ΚΑΤΑΣΚΕΥΕΣ",
    "MME",
    "ΧΡΗΜΑΤΟΠΙΣΤΩΤΙΚΑ",
  ]);
  let activeSectorFilterRef = useRef(activeSectorFilter);

  let [activeGroupFilter, setActiveGroupFilter] = React.useState([]);
  let activeGroupFilterRef = useRef(activeGroupFilter);
  // let [allActiveNodes, setAllActiveNodes] = React.useState([]);

  // Declare Scales and Values
  let nodeSizesArray = [10, 135, 95, 75, 75, 0, 0];
  let nodeSizes = d3
    .scaleOrdinal() //
    .domain(Array.from(new Set(nodes.map((d) => d.data.type))))
    .range(nodeSizesArray);

  const allNodes = root.descendants();
  // Find the minimum and maximum number of descendants
  const [minDescendants, maxDescendants] = d3.extent(allNodes, (node) => node.descendants().length);

  // Create the scale based on the range of descendants
  let startingNodeSizes = [100, 500];
  const descendantsScale = d3.scaleLinear().domain([minDescendants, maxDescendants]).range(startingNodeSizes);

  let nodeColorsArray = ["transparent", "#FF295B", "#DE62D9", "#44B0FF", "#20AE98", "#FEA800"];
  let nodeColors = d3
    .scaleOrdinal() //
    .domain([...new Set(nodes.map((d) => d.data.group))])
    .range(nodeColorsArray);

  function cmdKeyFilter(event) {
    // console.log("the cmd key is not pressed");
    return event.ctrlKey || event.metaKey; // Check for ctrlKey or cmdKey
  }
  // This function handles Zooming and is blocked if commandKey is not pressed.
  // Zoom and Pan if the Command key is pressed
  function handleZoom(e) {
    console.log("Zooming w/ command, allowing zoom and pan");
    d3.selectAll("svg g").attr("transform", e.transform);
    setZoomTransform(d3.zoomTransform(chartRef.current));

    setZoomAmount(e.transform.k);

    setHasBeenZoomed(true);
  }
  function handlePan(e) {
    console.log("Zooming w/o command, only allowing pan");
  }

  function handlePan(e) {
    console.log("command key is not pressed, handling pan");
    // Logic for panning
  }
  let zoom = d3.zoom().on("zoom", handleZoom).scaleExtent(zoomRange);
  let pan = d3.zoom().on("zoom", handlePan).scaleExtent(zoomRange);

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

    // ALL FORCES APPLIED AT START, MORE STATIC, MORE STABLE
    const simulation = d3
      .forceSimulation(nodes, (d) => d)
      .force(
        "link",
        d3
          .forceLink(links)
          .distance((d) => {
            let targetNodeIsLarge = d.target.data.type !== "subcompany";
            let sourceNodeIsLarge = d.source.data.type !== "subcompany";
            let targetNodeIsConnector = d.target.data.type === "connector";
            let sourceNodeIsConnector = d.source.data.type === "connector";

            // 5 is pink
            // 4 is yellow
            // 3 is blue
            // 2 is green
            // 1 is red

            if (d.source.depth === 0) {
              return 0;
            } else if (sourceNodeIsLarge && targetNodeIsConnector) {
              return 40;
            } else if (d.source.data.type === "connector" && targetNodeIsLarge) {
              return 380;
            } else if (d.source.data.group === 5 && d.source.data.type === "sector" && targetNodeIsLarge) {
              return 300;
            } else if (d.source.data.group === 5 && sourceNodeIsLarge && d.target.data.type === "sector") {
              return 300;
            } else if (d.source.data.group === 2 && d.source.data.type === "sector" && targetNodeIsLarge) {
              return 500;
            } else if (d.source.data.group === 1 && sourceNodeIsLarge && d.target.data.type === "sector") {
              return 300;
            } else if (d.source.data.group === 1 && d.source.data.type === "sector" && targetNodeIsLarge) {
              return 300;
            } else if (d.source.data.group === 1 && d.source.data.type === "sector" && targetNodeIsLarge) {
              return 300;
            } else if (d.source.data.group === 3 && sourceNodeIsLarge && targetNodeIsLarge) {
              return 300;
            } else if (
              // Spacing for: smaller groups, large nodes
              (d.target.data.group === 5 || d.target.data.group === 2 || d.target.data.group === 3) &&
              targetNodeIsLarge &&
              d.target.data.type !== "connector"
            ) {
              return 200;
            } else if (
              // Spacing for: larger groups, large nodes
              (d.target.data.group === 1 || d.target.data.group === 4) &&
              d.target.data.type !== "subcompany" &&
              d.target.data.type !== "connector"
            ) {
              return 100;
            } else {
              console.log("endnode");
              return 300;
            }
          })
          .strength(0.8)
      )
      .force(
        "charge",
        d3.forceManyBody().strength((d) => {
          if (d.depth === 0) {
            return 0;
          } else if (d.data.group === 5 && d.data.type !== "subcompany") {
            return -200;
          } else if (d.depth === 1 || d.depth === 2) {
            return -1000;
          } else if (
            (d.data.group === 5 || d.data.group === 2 || d.data.group === 3) &&
            d.data.type !== "subcompany" &&
            d.data.type !== "connector"
          ) {
            return -200;
          } else {
            return -100;
          }
        })
      )
      // .force("center", d3.forceCenter(width / 2, height / 2).strength(1))
      .force(
        "collision",
        d3
          .forceCollide()
          .radius((d) => (d.depth !== 1 ? nodeSizes(d.data.type) : descendantsScale(findDescendantsManually(d).length)))
      );

    // You might also want to customize other forces or add more forces based on your specific needs.

    // Element Creation
    // Create the Canvas
    const svg = d3
      .select(chartRef.current) //
      .attr("width", width)
      .attr("height", height)

      .call(function (selection) {
        if (isOnDesktop) {
          selection.call(
            zoom.filter(function (event) {
              return cmdKeyFilter(event);
            })
          );
        } else {
          selection.call(zoom);
        }
      })

      .call(
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
      // if the node is not the group node, apply the nodeSizes table. Else, base size on amount of descendants
      .attr("r", (d) => (d.depth !== 1 ? nodeSizes(d.data.type) : descendantsScale(findDescendantsManually(d).length)))

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
    // hide the first node's links
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
            shareholders: d.data.shareholders ? d.data.shareholders : "null",
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
      setUpdateCameFromClickedNode(true);
      let nodesToActivate = [];
      //
      nodes.forEach(function (node) {
        // If Statement Declarations
        let nodeWillBeExpanded = node.data.on === false;
        let nodeWillBeClosed = node.data.on === true;

        let sectorFilterisActive = activeSectorFilterRef.current.length !== 0;
        //check if any of the clicked node's children is on, meaning that the clicked node is already expanded
        if (clickedNode.children) {
          clickedNode.children.forEach(function (clickedNodeChild) {
            if (node.index === clickedNodeChild.index) {
              if (nodeWillBeClosed) {
                hideDescendantsIfOpen(clickedNode);
              } else if (nodeWillBeExpanded) {
                skipConnecerAndAddChildren();
              }
            }
          });
        } else {
          console.log("Cannot expand leaf node, you've reached the end!");
        }

        // If a node is clicked and expanded, add it to the activeGroupFilter
        updateActiveGroupFilter();

        function updateActiveGroupFilter() {
          clickedNode.children.forEach(function (clickedNodeChild) {
            if (node.index === clickedNodeChild.index) {
              //Only handlegroupFilter is the node is one of the 2 lower levels
              if (clickedNode.depth < 3) {
                if (nodeWillBeExpanded) {
                  setActiveGroupFilter((prevActiveGroupFilter) => {
                    const updatedFilter = [...new Set(prevActiveGroupFilter)];

                    if (!updatedFilter.includes(clickedNode.data.group)) {
                      updatedFilter.push(clickedNode.data.group);
                    }

                    return updatedFilter;
                  });
                } else if (nodeWillBeClosed) {
                  console.log("Deactivating the filter for the clicked node!");
                  setActiveGroupFilter((prevActiveGroupFilter) => {
                    const updatedFilter = prevActiveGroupFilter.filter((group) => group !== clickedNode.data.group);
                    return updatedFilter;
                  });
                }
              }
            }
          });
        }
      });

      function skipConnecerAndAddChildren() {
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
            shareholders: d.data.shareholders ? d.data.shareholders : "null",
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

  // Handle Functionality when clicking a GROUP Filter
  function findFilteredNode(IDText) {
    setUpdateCameFromClickedNode(false);
    nodes.forEach(function (node) {
      if (node.data.name === IDText) {
        findDescendants(node);
        activateAncestors(node);
        setTimeout(() => {
          panToNode(node);
        }, 500);
        document.documentElement.style.setProperty("--highlightColorClick", nodeColors(node.data.group));
      }
    });

    let filterIsActive = event.target.classList.contains("active");
    if (!filterIsActive) {
      event.target.classList.add("active");
      // Code for when the filter is active

      // add the group number of the filter node to the active group array
      setActiveGroupFilter((prevActiveGroupFilter) => {
        const updatedFilter = [...prevActiveGroupFilter];

        const matchingNode = nodes.find((node) => node.data.name === IDText);
        if (matchingNode) {
          updatedFilter.push(matchingNode.data.group);
          event.target.style.color = nodeColors(matchingNode.data.group);
        }

        return updatedFilter;
      });
    } else {
      event.target.classList.remove("active");
      setActiveGroupFilter((prevActiveGroupFilter) => {
        const updatedFilter = [...prevActiveGroupFilter];

        const matchingNode = nodes.find((node) => node.data.name === IDText);
        if (matchingNode) {
          setActiveGroupFilter((prevActiveGroupFilter) => {
            const updatedFilter = [...prevActiveGroupFilter];

            // Check if the groupNumber already exists in the array
            const groupNumberExists = updatedFilter.includes(matchingNode.data.group);

            // If it exists, filter it out; otherwise, add it to the array
            const filteredFilter = groupNumberExists
              ? updatedFilter.filter((groupNumber) => groupNumber !== matchingNode.data.group)
              : updatedFilter.concat(matchingNode.data.group);

            return filteredFilter;
          });
        }

        return updatedFilter;
      });

      event.target.style.color = "#000";
    }
  }

  let allListItemElements = document.querySelectorAll(".sectorFilter");

  // Handle Functionality when clicking a SECTOR Filter
  function findFilteredSectorNode(IDText, allSectorFilters) {
    setUpdateCameFromClickedNode(false);
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
    console.log("allSectorFilters is", allSectorFilters);
    if (isFirstLoad) {
      allSectorFilters.forEach((allSectorFilter) => {
        setActiveSectorFilter((prevActiveSectorFilter) => {
          return [...prevActiveSectorFilter, allSectorFilter];
        });
      });
    }

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

  // Filter system initializazion
  useEffect(() => {
    let allListItemElements = document.querySelectorAll(".sectorFilter");

    // Add the acive class to the first element on Start
    if (allListItemElements.length > 0) {
      allListItemElements[0].classList.add("active");
    }
  }, []);

  useEffect(() => {
    // In this function, based on activeGroupFilter:
    // Give the filter the active class if its groupnumber is contained in the array
    // Give the filter the correct color if its groupnumber is contained in the array
    nodes.forEach((node) => {
      const isTopLevel = node.depth === 1;
      const filterItems = document.querySelectorAll(".companyFilters > .filterItem");

      filterItems.forEach((groupFilterItem) => {
        const includesNodeName = groupFilterItem.innerText.includes(node.data.name);

        if (isTopLevel && activeGroupFilter.includes(node.data.group)) {
          if (includesNodeName) {
            console.log("that worked!");
            groupFilterItem.classList.add("active");
            addNodeColor();
          }
        } else if (isTopLevel && !activeGroupFilter.includes(node.data.group)) {
          if (includesNodeName) {
            console.log("that worked!");
            groupFilterItem.classList.remove("active");
            addNodeColor();
          }
        }

        function addNodeColor() {
          if (groupFilterItem.classList.contains("active")) {
            groupFilterItem.style.color = nodeColors(node.data.group);
          } else {
            groupFilterItem.style.color = "";
          }
        }
      });
    });

    handleNodeFiltering();

    console.log("active group filters are", activeGroupFilter);
    // toggleGroupFilterColors();
  }, [activeSectorFilter, activeGroupFilter]);

  // Based on the newest state of the activeSectorFilter, hide all nodes that are not part of the active filter
  function handleNodeFiltering() {
    console.log("filtering some nodes!");
    let nodesToDisable = [];
    let nodesToEnable = [];

    nodes.forEach((node) => {
      // The sector filter could only apply to nodes that are currently activated by the group filter.
      // Add the Statement into the if Statement if desired;

      let groupIsAllowed = activeGroupFilter.includes(node.data.group);
      // If Statement declarations
      let nodeIsOn = node.data.on;
      let nodeIsSubcompany = node.data.type === "subcompany";
      let nodeIsConnector = node.data.type === "connector";
      let nodeMatchesFilter = activeSectorFilterRef.current.includes(node.data.sector);

      // Check if there is a Connectornode which contains a child that should be on according to the sectorfilter Array
      let connectorLacksOnChild =
        nodeIsConnector &&
        !node.children.some((childNode) => {
          // Check if the sector of the child node is included in the activeSectorFilter
          // or if the type of the child node is "subcompany"
          return activeSectorFilterRef.current.includes(childNode.data.sector);
        });

      if ((!groupIsAllowed && node.depth > 2) || (nodeIsSubcompany && !nodeMatchesFilter) || connectorLacksOnChild) {
        nodesToDisable.push(node);
      }
      if (!nodeIsOn && nodeMatchesFilter && nodeIsSubcompany && !updateCameFromClickedNode) {
        if (groupIsAllowed) {
          findAncestorsManually(node).forEach((ancestorNode) => {
            nodesToEnable.push(node);
          });
        }
      }
    });

    nodesToEnable.forEach((enabledNode) => activateNodes(findAncestorsManually(enabledNode)));
    activateNodes(nodesToEnable);
    deactivateNodes(nodesToDisable);
  }

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

    let descendantAmount;

    if (filterNode.descendants() && filterNode.descendants().length > 0) {
      descendantAmount = filterNode.descendants().length;
    }

    filterNode.descendants().forEach(function (filterDescendant) {
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
      .translate(width / 2 - filterXMidPoint / 4, height / 2 - filterYMidPoint / 5)
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
    document.addEventListener("keydown", function (event) {
      if (event.key === "Meta" || event.key === "Control") {
        console.log("pressing cmd key!");
        setIsCommandKeyPressed(true);
      }
    });

    document.addEventListener("keyup", function (event) {
      if (event.key === "Meta" || event.key === "Control") {
        console.log("lifting cmd key!");
        setIsCommandKeyPressed(false);
      }
    });
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

    window.addEventListener("click", function () {
      if (isFirstLoad === true) {
        setIsFirstLoad(false);
      }
    });
  }, []);

  function zoomIn() {
    d3.select(".graphCanvas").transition().call(zoom.scaleBy, 1.33);
  }
  function zoomOut() {
    d3.select(".graphCanvas").transition().call(zoom.scaleBy, 0.66);
  }

  return (
    <div className="componentContainer">
      <Navigation
        className="navigationContainer"
        filterItems={filterInfo}
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
          +
        </div>
        <div className="zoomButton" onClick={zoomOut}>
          -
        </div>
      </div>
    </div>
  );
}

export default D3Chart;
