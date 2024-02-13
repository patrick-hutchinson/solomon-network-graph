import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import InfoBox from "./assets/Components/InfoBox";
import Navigation from "./assets/Components/Navigation";
import Zoombar from "./assets/Components/Zoombar";

function D3Chart() {
  // http://localhost:5173/

  let isOnMobile = window.innerWidth < 600;
  let isOnTablet = window.matchMedia(
    "(min-device-width: 601px) and (max-device-width: 1080px) and (-webkit-min-device-pixel-ratio: 1)"
  ).matches;
  let isOnDesktop = !isOnMobile && !isOnTablet;

  let chartRef = useRef(null);

  let [data, setData] = React.useState([]); // Initialize with an array
  // Set state values for the data graph
  let root = d3.hierarchy(data);
  let [links, setLinks] = React.useState(root.links());
  let [nodes, setNodes] = React.useState(root.descendants());

  let nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Fetch the Data
  React.useEffect(() => {
    fetch("https://raw.githubusercontent.com/patrick-hutchinson/solomon-network-graph/main/src/data.json")
      .then((res) => res.json())
      .then((dataArray) => {
        setData(dataArray);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  let [dataLoaded, setDataLoaded] = React.useState(false);

  // Create hierarchy and set links and nodes when data changes
  React.useEffect(() => {
    let root = d3.hierarchy(data); // Wrap data in an object with a "children" property
    setLinks(root.links());
    setNodes(root.descendants());

    if (data.length !== 0) {
      setDataLoaded(true);
    }
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
    x: 500,
    y: 300,
    k: 0.6,
  });

  let [zoomTransform, setZoomTransform] = React.useState(
    `translate(${initialZoom.x}, ${initialZoom.y}) scale(${initialZoom.k})`
  );

  let zoomRange;
  if (isOnMobile) {
    // Set the zoom range for mobile
    zoomRange = [0.05, 4];
  } else {
    // Set the zoom range for non-mobile (tablet and desktop)
    zoomRange = [0.1, 4];
  }

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

  let [updateCameFromClickedNode, setUpdateCameFromClickedNode] = React.useState(false);
  let [groupFilterWasClicked, setGroupFilterWasClicked] = React.useState(false);

  let groupFilterWasClickedRef = useRef(groupFilterWasClicked);
  useEffect(() => {
    groupFilterWasClickedRef.current = groupFilterWasClicked;
  }, [groupFilterWasClicked]);

  let [activeSectorFilter, setActiveSectorFilter] = React.useState([]);
  React.useEffect(() => {
    setActiveSectorFilter(() => {
      const uniqueSectors = new Set();

      uniqueSectors.add("Όλα");

      nodes.forEach((filterItem) => {
        if (filterItem.data.sector !== undefined) {
          uniqueSectors.add(filterItem.data.sector);
        }
      });

      // Convert the Set back to an array
      const uniqueSectorsArray = Array.from(uniqueSectors);

      return uniqueSectorsArray;
    });
  }, [dataLoaded]);

  let activeSectorFilterRef = useRef(activeSectorFilter);

  // Update the activeSectorFilter Ref
  useEffect(() => {
    activeSectorFilterRef.current = activeSectorFilter;
  }, [activeSectorFilter]);

  //we need to set to active group filter to the dynamically added nodes from the navigation component, otherwise it stays empty

  let [activeGroupFilter, setActiveGroupFilter] = React.useState([]);

  let [clickedGroupFilterNode, setClickedGroupFilterNode] = React.useState();

  // Declare Scales and Values
  let subcompanySize = 105;
  let sectorSize = 105;
  let nodeSizesArray = [10, 135, 115, sectorSize, subcompanySize, 0, 0];
  let nodeSizes = d3
    .scaleOrdinal() //
    .domain(Array.from(new Set(nodes.map((d) => d.data.type))))
    .range(nodeSizesArray);

  let arrowThicknessArray = [2, 2, 6, 5, 5, 3, 3];
  let arrowThickness = d3
    .scaleOrdinal() //
    .domain(Array.from(new Set(nodes.map((d) => d.data.type))))
    .range(arrowThicknessArray);

  let allNodes = root.descendants();
  // Find the minimum and maximum number of descendants
  let [minDescendants, maxDescendants] = d3.extent(allNodes, (node) => node.descendants().length);

  // Create the scale based on the range of descendants
  let startingNodeSizes = [100, 500];
  let descendantsScale = d3.scaleLinear().domain([minDescendants, maxDescendants]).range(startingNodeSizes);

  let nodeColorsArray = ["transparent", "#FF295B", "#AF1BF5", "#44B0FF", "#20AE98", "#FEA800"];
  let nodeColors = d3
    .scaleOrdinal() //
    .domain([...new Set(nodes.map((d) => d.data.group))])
    .range(nodeColorsArray);

  // Show a PopUp when trying to zoom without pressing Command

  function showZoomNotice(e) {
    let zoomNoticeCursor = document.querySelector(".zoomNoticeCursor");

    zoomNoticeCursor.classList.add("visible");

    zoomNoticeCursor.style.left = e.clientX - zoomNoticeCursor.getBoundingClientRect().width / 2 + "px";
    zoomNoticeCursor.style.top = e.clientY + zoomNoticeCursor.getBoundingClientRect().height / 2 + "px";

    setTimeout(() => {
      zoomNoticeCursor.classList.remove("visible");
    }, 2000);
  }
  function updateZoomNotice(e) {
    let zoomNoticeCursor = document.querySelector(".zoomNoticeCursor");
    zoomNoticeCursor.style.left = e.clientX - zoomNoticeCursor.getBoundingClientRect().width / 2 + "px";
    zoomNoticeCursor.style.top = e.clientY + zoomNoticeCursor.getBoundingClientRect().height / 2 + "px";
  }

  function handleZoom(e) {
    //only allow panning with two or more fingers
    if (!isOnDesktop && e.sourceEvent !== null) {
      if (e.sourceEvent.touches.length === 1) {
        return d3.event.sourceEvent.stopPropagation();
      }
    }

    d3.selectAll("svg g").attr("transform", e.transform);
    setZoomTransform(d3.zoomTransform(chartRef.current));

    setZoomAmount(e.transform.k);

    setHasBeenZoomed(true);
  }

  function commandFilter(event) {
    return (
      (event.type !== "wheel" && event.type !== "dblclick") ||
      (event.type === "wheel" && (event.ctrlKey || event.metaKey))
    );
  }

  let zoom = d3.zoom().filter(commandFilter).on("zoom", handleZoom).scaleExtent(zoomRange);

  let drag = (simulation) => {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
  };

  useEffect(() => {
    let allActiveNodes = nodes.filter((node) => node.data.on);
    let allActiveLinks = links.filter((link) => link.source.data.on);

    let simulation = d3
      .forceSimulation(allActiveNodes, (d) => d)
      .force(
        "link",
        d3
          .forceLink(allActiveLinks)
          .id((d) => d.id)
          .distance((d) => {
            let group1 = d.source.data.group === 1;
            let group2 = d.source.data.group === 2;
            let group3 = d.source.data.group === 3;
            let group4 = d.source.data.group === 4;
            let group5 = d.source.data.group === 5;
            let sourceNodeIsRoot = d.source.depth == 1;
            let targetNodeIsLarge = d.target.data.type !== "subcompany";
            let sourceNodeIsLarge = d.source.data.type !== "subcompany";
            let targetNodeIsConnector = d.target.data.type === "connector";
            let sourceNodeIsConnector = d.source.data.type === "connector";
            let sourceNodeIsSector = d.source.data.type === "sector";
            let targetNodeIsSector = d.target.data.type === "sector";

            // 1 is red
            // 2 is green
            // 3 is blue
            // 4 is yellow
            // 5 is pink

            if (d.target.depth === 0) {
              return 40;
            }
            if (d.target.depth === 1) {
              return 40;
            }
            if (sourceNodeIsLarge && targetNodeIsConnector) {
              return 40;
            }
            if (sourceNodeIsConnector && targetNodeIsLarge) {
              return 380;
            }
            // Group One
            if (group1 && sourceNodeIsRoot) {
              return 400;
            } else if (group1 && sourceNodeIsLarge && targetNodeIsSector) {
              return 200;
            } else if (group1 && sourceNodeIsSector && targetNodeIsLarge) {
              return 200;
            }
            // Group Two
            if (group2 && sourceNodeIsRoot) {
              return 400;
            } else if (group2 && sourceNodeIsSector && targetNodeIsLarge) {
              return 500;
            } else if (group2 && sourceNodeIsLarge && targetNodeIsLarge) {
              return 300;
            }
            if (group3 && sourceNodeIsRoot) {
              return 400;
            } else if (group3 && sourceNodeIsLarge && targetNodeIsLarge) {
              return 300;
            }
            if (group4 && sourceNodeIsRoot) {
              return 300;
            } else if (group4 && sourceNodeIsLarge && targetNodeIsLarge) {
              return 300;
            } else if (group4 && sourceNodeIsConnector && targetNodeIsLarge) {
              return -100;
            }
            if (group5 && sourceNodeIsRoot) {
              return 300;
            }
            if (group5 && sourceNodeIsSector && targetNodeIsLarge) {
              return 300;
            } else if (group5 && sourceNodeIsLarge && targetNodeIsSector) {
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
              return 300;
            }
          })
          .strength(1)
      )
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .force(
        "charge",
        d3.forceManyBody().strength((d) => {
          if (d.depth === 0) {
            return 10;
          } else {
            return -8250;
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

    // Element Creation
    // Create the Canvas
    let svg = d3
      .select(chartRef.current) //
      .attr("width", width)
      .attr("height", height)
      .call(zoom)

      .call(
        zoom.transform,
        hasBeenZoomed ? zoomTransform : d3.zoomIdentity.translate(initialZoom.x, initialZoom.y).scale(initialZoom.k)
      )
      .on("wheel", showZoomNotice)
      .on("mousemove", updateZoomNotice)
      // .on("contextmenu", function (event) {
      //   event.preventDefault();
      // })

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

    let arrowheads = svg
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
      .attr("refX", (d) => nodeSizes(d.data.type) / 32)
      .attr("refY", 3)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto-start-reverse")
      .attr("fill", (d) => nodeColors(d.data.group))
      .append("path")
      .attr("d", "M0,0 L0,6 L4,3 z");

    // Create and draw the Links
    let link = svg
      .append("g")
      .selectAll("line")
      .data(links, (d) => d)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 1)
      .attr("stroke-width", (d) => arrowThickness(d.target.data.type));

    let elementEnter = nodeElement.enter().append("g");

    // Create the circles
    let circle = elementEnter
      .append("circle")
      // if the node is not the group node, apply the nodeSizes table. Else, base size on amount of descendants
      .attr("r", (d) => (d.depth !== 1 ? nodeSizes(d.data.type) : descendantsScale(findDescendantsManually(d).length)))

      .attr("stroke", (d) => nodeColors(d.data.group))
      //if the depth of the node is smaller than three, fill it. Else, white.
      .attr("fill", (d) =>
        d.data.type === "person" || d.data.type === "company" || d.data.type === "mothercompany"
          ? nodeColors(d.data.group)
          : "#fff"
      )
      .attr("stroke-opacity", (d) => (d.data.on ? 0.6 : 0.1))

      .attr("class", (d) =>
        d.data.type === "person" || d.data.type === "company" || d.data.type === "mothercompany"
          ? "largeNode"
          : "smallNode"
      )
      .call(drag(simulation));

    // Add the Text
    elementEnter
      .append("foreignObject")
      .attr("width", (d) => {
        nodeSizes(d);
      })
      .attr("height", (d) => {
        nodeSizes(d);
      })
      .attr("height", "180px")
      .attr("width", "180px")
      .append("xhtml:h5")
      .attr("class", "nodeTextElement")
      .call(drag(simulation))
      .html((d) => {
        return `<p>${d.data.name}<br> ${
          d.children && d.data.type !== "connector" && d.depth !== 1 ? `[${d.children.length}]` : ""
        }</p>`;
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
          .attr("fill", (d) => (d.depth === 1 ? nodeColors(d.data.group) : "#fff"))
          .attr("cursor", "pointer");

        document.documentElement.style.setProperty("--highlightColorHover", nodeColors(d.data.group));
        // Change the text color contained in the node
        d.depth > 1 ? e.target.parentElement.querySelector("h5").classList.add("hovered") : null;

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
      setGroupFilterWasClicked(false);
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
              if (nodeWillBeClosed && clickedNode.depth > 1) {
                hideDescendantsIfOpen(clickedNode);
              } else if (nodeWillBeExpanded && clickedNode.depth > 1) {
                skipConnectorAndAddChildren();
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
              // Only handlegroupFilter if the node is one of the 2 lower levels
              if (clickedNode.depth < 3 && clickedNode.depth !== 1) {
                if (nodeWillBeExpanded) {
                  setActiveGroupFilter((prevActiveGroupFilter) => {
                    let updatedFilter = [...new Set(prevActiveGroupFilter)];

                    if (!updatedFilter.includes(clickedNode.data.group)) {
                      updatedFilter.push(clickedNode.data.group);
                    }

                    return updatedFilter;
                  });
                } else if (nodeWillBeClosed) {
                  console.log("Deactivating the filter for the clicked node!");
                  setActiveGroupFilter((prevActiveGroupFilter) => {
                    let updatedFilter = prevActiveGroupFilter.filter((group) => group !== clickedNode.data.group);
                    return updatedFilter;
                  });
                }
              }
            }
          });
        }
      });

      function skipConnectorAndAddChildren() {
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
        .attr("x1", (d) => {
          if (d.source.data.type === "subcompany") {
            return shortenLinkBeginning(d.source.x, d.target.x);
          } else if (d.source.data.type === "connector") {
            return fullLengthLink(d.source.x, d.target.x);
          } else {
            return shortenLinkDefault(d.source.x, d.target.x);
          }
        })
        .attr("y1", (d) => {
          if (d.source.data.type === "subcompany") {
            return shortenLinkBeginning(d.source.y, d.target.y);
          } else if (d.source.data.type === "connector") {
            return fullLengthLink(d.source.y, d.target.y);
          } else {
            return shortenLinkDefault(d.source.y, d.target.y);
          }
        })
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
      // circle.call(drag(simulation));

      elementEnter
        .select("text")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y);

      document.querySelectorAll("foreignObject").forEach(function (foreignObject) {
        let circle = foreignObject.parentElement.querySelector("circle");

        if (circle.getAttribute("cx") !== null || circle.getAttribute("cy") !== null) {
          foreignObject.setAttribute("x", circle.getAttribute("cx"));
          foreignObject.setAttribute("y", circle.getAttribute("cy"));
        }

        let positionVariable;
        if (foreignObject.textContent.length > 1) {
          positionVariable = foreignObject.textContent.length;
        } else {
          positionVariable = 0;
        }
        foreignObject.style.transform = `translate(${-90}px, ${-40 - positionVariable * 1.1}px)`;
      });
    });

    function shortenLink(sourceCoord, targetCoord, factor = 0.75) {
      return sourceCoord + (targetCoord - sourceCoord) * factor;
    }
    function shortenEndLink(sourceCoord, targetCoord, factor = 0.82) {
      return sourceCoord + (targetCoord - sourceCoord) * factor;
    }

    function shortenLinkBeginning(sourceCoord, targetCoord, factor = 0.2) {
      return sourceCoord + (targetCoord - sourceCoord) * factor;
    }
    function shortenLinkDefault(sourceCoord, targetCoord, factor = 0.25) {
      return sourceCoord + (targetCoord - sourceCoord) * factor;
    }
    function fullLengthLink(sourceCoord, targetCoord, factor = 0) {
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
  function findFilteredGroup(IDText) {
    setGroupFilterWasClicked(true);
    setUpdateCameFromClickedNode(false);
    nodes.forEach(function (node) {
      if (node.data.name === IDText) {
        // Pass the information into the handleNodeFiltering function
        handleNodeFiltering(node.index);
        setClickedGroupFilterNode(node.data.group);
        setTimeout(() => {
          panToNode(node);
        }, 500);
        document.documentElement.style.setProperty("--highlightColorClick", nodeColors(node.data.group));
      }
    });

    let filterIsActive = event.target.classList.contains("active");

    if (!filterIsActive) {
      // Filter is not active Yet
      // Add Active Class
      event.target.classList.add("active");
      // add the group number of the filter node to the active group array
      setActiveGroupFilter((prevActiveGroupFilter) => {
        let updatedFilter = [...prevActiveGroupFilter];

        let matchingNode = nodes.find((node) => node.data.name === IDText);
        if (matchingNode) {
          updatedFilter.push(matchingNode.data.group);
          event.target.style.color = nodeColors(matchingNode.data.group);
        }

        return updatedFilter;
      });
      //Filter is already active
    } else {
      event.target.classList.remove("active");

      const updateFilter = (filter, group) => {
        const groupExists = filter.includes(group);
        return groupExists ? filter.filter((num) => num !== group) : [...filter, group];
      };

      setActiveGroupFilter((prevActiveGroupFilter) => {
        let updatedFilter = [...prevActiveGroupFilter];

        let matchingNode = nodes.find((node) => node.data.name === IDText);
        if (matchingNode) {
          updatedFilter = updateFilter(updatedFilter, matchingNode.data.group);
        }

        return updatedFilter;
      });

      event.target.style.color = "#000";
    }
  }

  let sectorFilters = document.querySelectorAll(".sectorFilter");

  // Handle Functionality when clicking a SECTOR Filter
  function findFilteredSectorNode(IDText, all) {
    setGroupFilterWasClicked(false);
    setUpdateCameFromClickedNode(false);
    // Disable the active class from the first Filter Item if any other one is clicked
    if (!event.target.innerText.includes("Όλα")) {
      sectorFilters[0].classList.remove("active");
    }

    // When clicking the all button, disable all individual filters
    if (event.target.innerText.includes("Όλα")) {
      sectorFilters.forEach((altListItem) => {
        if (event.target !== altListItem) {
          altListItem.classList.remove("active");
        }
      });
    }

    // Toggle the clicked Filter Item and Add/Remove it from the clicked filter array
    toggleFilter(IDText, all);
  }

  function toggleFilter(IDText, allSectorFilters) {
    if (isFirstLoad) {
      allSectorFilters.forEach((allSectorFilter) => {
        setActiveSectorFilter((prevActiveSectorFilter) => {
          return [...prevActiveSectorFilter, allSectorFilter];
        });
      });
    }

    // If Statement Declarations
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

  // Filter system initializazion
  useEffect(() => {
    let sectorFilters = document.querySelectorAll(".sectorFilter");

    // Add the active class to the first element on Start, here the "all" Filter
    if (sectorFilters.length > 0) {
      sectorFilters[0].classList.add("active");
    }
  }, []);

  useEffect(() => {
    // In this function, based on activeGroupFilter:
    // Give the filter the active class if its groupnumber is contained in the array
    // Give the filter the correct color if its groupnumber is contained in the array
    nodes.forEach((node) => {
      // If Statement Declarations
      let isTopLevel = node.depth === 1;

      let groupFilterItems = document.querySelectorAll(".groupFilters > .filterItem");

      groupFilterItems.forEach((groupFilterItem) => {
        let includesNodeName = groupFilterItem.innerText.includes(node.data.name);

        if (isTopLevel && activeGroupFilter.includes(node.data.group)) {
          if (includesNodeName) {
            groupFilterItem.classList.add("active");
            updateNodeColor();
          }
        } else if (isTopLevel && !activeGroupFilter.includes(node.data.group)) {
          if (includesNodeName) {
            groupFilterItem.classList.remove("active");
            updateNodeColor();
          }
        }

        function updateNodeColor() {
          if (groupFilterItem.classList.contains("active")) {
            groupFilterItem.style.color = nodeColors(node.data.group);
          } else {
            groupFilterItem.style.color = "";
          }
        }
      });
    });

    handleNodeFiltering();
  }, [activeSectorFilter, activeGroupFilter]);

  // Based on the newest state of the activeSectorFilter and activeGroupFilter, hide all nodes that are not part of the active filter
  function handleNodeFiltering(groupNodeIndex) {
    let nodesToDisable = [];
    let nodesToEnable = [];

    nodes.forEach((node) => {
      // If Statement declarations
      let nodeIsOn = node.data.on;
      let nodeIsOff = !nodeIsOn;
      let groupIsAllowed = activeGroupFilter.includes(node.data.group);
      let nodeIsSubcompany = node.data.type === "subcompany";
      let nodeIsSector = node.data.type === "sector";
      let nodeIsConnector = node.data.type === "connector";
      let nodeIsMotherCompany = node.data.type === "mothercompany";
      let nodeMatchesSectorFilter = activeSectorFilterRef.current.includes(node.data.sector);
      let nodeMatchesSector = activeSectorFilterRef.current.includes(node.data.name);

      function nodeDescendantsIncludesActiveSectorNode() {
        return findDescendantsManually(node).some((nodeDescendant) => {
          return activeSectorFilterRef.current.includes(nodeDescendant.data.sector);
        });
      }

      // Disabling Nodes
      if (
        nodeIsOn &&
        // Statement One
        ((!groupIsAllowed && node.depth > 2) ||
          // Statement Two
          (node.depth > 2 &&
            nodeIsMotherCompany &&
            !nodeMatchesSectorFilter &&
            !nodeDescendantsIncludesActiveSectorNode()) ||
          //Statement Three
          (nodeIsSubcompany && !nodeMatchesSectorFilter && !nodeDescendantsIncludesActiveSectorNode()) ||
          // Statement Four
          (nodeIsConnector && !nodeDescendantsIncludesActiveSectorNode()) ||
          // Statement Five
          (nodeIsSector && !nodeMatchesSector && !nodeDescendantsIncludesActiveSectorNode()))
      ) {
        nodesToDisable.push(node);
      }
      // Enabling Nodes
      if (
        nodeIsOff &&
        nodeMatchesSectorFilter &&
        nodeIsSubcompany &&
        !updateCameFromClickedNode &&
        !groupFilterWasClicked &&
        groupIsAllowed
      ) {
        nodesToEnable.push(node);
      }

      // Group filtering
      if (node.index === groupNodeIndex) {
        // activateDescendants(node);
        // activateAncestors(node);
        // if (groupIsAllowed && nodeMatchesSectorFilter) {
        // nodesToEnable.push(node);
        // }

        findDescendantsManually(node).forEach((descendantNode) => {
          if (activeSectorFilterRef.current.includes(descendantNode.data.sector)) {
            nodesToEnable.push(descendantNode);
          }
        });
      }
    });

    nodesToEnable.forEach((enabledNode) => activateNodes(findAncestorsManually(enabledNode)));
    activateNodes(nodesToEnable);
    deactivateNodes(nodesToDisable);
  }

  //Expand all the sector nodes (the actual ones) when a filter is clicked
  let sectorNodeArray = [];
  function showAllSectors() {
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

    // Create a D3 zoom transform with the new coordinates
    let newZoomTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.15);

    // Apply the zoom transform with a smooth transition
    d3.select(chartRef.current)
      .transition()
      .duration(750) // Adjust the duration as needed
      .call(zoom.transform, newZoomTransform);
  }

  function activateDescendants(filterNode) {
    let descendantNodesArray = [];
    findDescendantsManually(filterNode).forEach(function (descendantNode) {
      descendantNodesArray.push(descendantNode);
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
        let isConnectedNode = connectedNodes.some((connectedNode) => connectedNode.index === node.index);

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
        let isConnectedNode = connectedNodes.some((connectedNode) => connectedNode.index === node.index);

        return isConnectedNode ? { ...node, data: { ...node.data, on: false } } : node;
      });
      updateLinks(updatedNodes);
      return updatedNodes;
    });
  }

  function updateLinks(updatedNodes) {
    setLinks((prevLinks) => {
      return prevLinks.map((link) => {
        let findUpdatedNode = (node) => updatedNodes.find((updatedNode) => updatedNode.index === node.index);

        let updatedTargetNode = findUpdatedNode(link.target);
        let updatedSourceNode = findUpdatedNode(link.source);

        return {
          ...link,
          target: updatedTargetNode || link.target,
          source: updatedSourceNode || link.source,
        };
      });
    });
  }

  function handleShowInfoClick() {
    document.querySelector(".infoContainer").classList.remove("hidden");
    document.querySelector(".componentContainer").classList.remove("hiddenInfo");
    document.querySelector(".showInfo").classList.add("hidden");
  }

  function handleCompClick() {
    if (isFirstLoad === true) {
      setIsFirstLoad(false);
    }
  }

  function zoomIn() {
    d3.select(".graphCanvas").transition().call(zoom.scaleBy, 1.33);
  }
  function zoomOut() {
    d3.select(".graphCanvas").transition().call(zoom.scaleBy, 0.66);
  }

  return (
    <div className="componentContainer" onClick={handleCompClick}>
      <Navigation
        className="navigationContainer"
        filterItems={filterInfo}
        findFilteredGroup={findFilteredGroup}
        // handleFilteredSectorChange={handleFilteredSectorChange}
        findFilteredSectorNode={findFilteredSectorNode}
        hoverFilteredNode={hoverFilteredNode}
        showAllSectors={showAllSectors}
        nodePath={nodePath}
      />
      <Zoombar className="zoombar" zoomAmount={zoomAmount} zoomRange={zoomRange} />
      <InfoBox className="" nodeInfo={nodeInfo} />
      <svg ref={chartRef}></svg>
      <div className="showInfo hidden" onClick={handleShowInfoClick}>
        Show Info
      </div>
      <div className="zoomButtonContainer">
        {/* <span className="zoomNotice">(Press CMD/CTRL + Scroll to zoom)</span> */}
        <div className="zoomButton" onClick={zoomIn}>
          +
        </div>
        <div className="zoomButton" onClick={zoomOut}>
          -
        </div>
      </div>
      <div className="zoomNoticeCursor">Pinch or hold the control/command button to zoom</div>
    </div>
  );
}

export default D3Chart;
