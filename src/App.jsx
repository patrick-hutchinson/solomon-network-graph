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

  let [dataLoaded, setDataLoaded] = React.useState(false);

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

  // Create hierarchy and set links and nodes when data changes
  React.useEffect(() => {
    // let root = d3.hierarchy(data); // Wrap data in an object with a "children" property
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
    x: 0,
    y: 0,
    k: 0.8,
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
    zoomRange = [0.05, 1];
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

  useEffect(() => {
    setActiveSectorFilter(["ΜΜΕ"]);
  }, [dataLoaded]);

  let activeSectorFilterRef = useRef(activeSectorFilter);

  // Update the activeSectorFilter Ref
  useEffect(() => {
    activeSectorFilterRef.current = activeSectorFilter;
  }, [activeSectorFilter]);

  //we need to set to active group filter to the dynamically added nodes from the navigation component, otherwise it stays empty

  let [activeGroupFilter, setActiveGroupFilter] = React.useState([1, 2, 3, 4, 5]);

  let [clickedGroupFilterNode, setClickedGroupFilterNode] = React.useState();

  // Declare Scales and Values
  let nodeSizesArray = [10, 135, 95, 85, 85, 0, 0];
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
  // *
  // *

  let nodeColorsArray = ["transparent", "#FF295B", "#AF1BF5", "#44B0FF", "#20AE98", "#FEA800"];
  let nodeColors = d3
    .scaleOrdinal() //
    .domain([...new Set(nodes.map((d) => d.data.group))])
    .range(nodeColorsArray);

  // Show a PopUp when trying to zoom without pressing Command
  function showZoomNotice(e) {
    let zoomNoticeCursor = document.querySelector(".zoomNoticeCursor");
    zoomNoticeCursor.classList.add("visible");

    setTimeout(() => {
      zoomNoticeCursor.classList.remove("visible");
    }, 2000);

    zoomNoticeCursor.style.left = e.clientX - zoomNoticeCursor.getBoundingClientRect().width / 2 + "px";
    zoomNoticeCursor.style.top = e.clientY + zoomNoticeCursor.getBoundingClientRect().height / 2 + "px";
  }
  function updateZoomNotice(e) {
    let zoomNoticeCursor = document.querySelector(".zoomNoticeCursor");
    zoomNoticeCursor.style.left = e.clientX - zoomNoticeCursor.getBoundingClientRect().width / 2 + "px";
    zoomNoticeCursor.style.top = e.clientY + zoomNoticeCursor.getBoundingClientRect().height / 2 + "px";
  }

  function handleZoom(e) {
    if (!isOnDesktop && e.sourceEvent !== null) {
      if (e.sourceEvent.touches.length === 1) {
        return d3.event.sourceEvent.stopPropagation();
      }
    }
    let zoomNoticeCursor = document.querySelector(".zoomNoticeCursor");
    zoomNoticeCursor.classList.remove("visible");

    setZoomTransform(d3.zoomTransform(chartRef.current));

    d3.selectAll("svg g").attr("transform", e.transform);

    setZoomAmount(e.transform.k);

    setHasBeenZoomed(true);

    // updateZoomTransform();
  }

  document.addEventListener("keyup", (e) => {
    let zoomNoticeCursor = document.querySelector(".zoomNoticeCursor");
    if (e.keyCode === 224) {
      zoomNoticeCursor.classList.add("blocked");

      setTimeout(() => {
        zoomNoticeCursor.classList.remove("visible");
        zoomNoticeCursor.classList.remove("blocked");
      }, 2000);
    }
  });

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

  function wordwrap(str, width, brk, cut) {
    brk = brk || "\n";
    width = width || 75;
    cut = cut || false;
    if (!str) {
      return str;
    }
    var regex = ".{0," + width + "}(\\s|$)" + (cut ? "|.{" + width + "}|.+$" : "|\\S+?(\\s|$)");
    return str.match(RegExp(regex, "g")).join(brk);
  }

  useEffect(() => {
    const groupDistance = 300;
    let simulation = d3
      .forceSimulation(nodes, (d) => d)
      .force(
        "link",
        d3
          .forceLink(links, (d) => d)
          .id((d) => d.id)
          .distance((d) => {
            let sourceNodeIsRoot = d.source.depth == 1;
            let targetNodeIsLarge = d.target.data.type !== "subcompany";
            let sourceNodeIsLarge = d.source.data.type !== "subcompany";
            let targetNodeIsConnector = d.target.data.type === "connector";
            let sourceNodeIsConnector = d.source.data.type === "connector";

            if (d.source.depth === 0) {
              return -500;
            }
            if (sourceNodeIsRoot) {
              return 10;
            }
            if (d.target.depth === 0 || d.target.depth === 1) {
              return 40;
            }
            if (sourceNodeIsConnector) {
              return 480;
            }
            if (sourceNodeIsLarge && targetNodeIsLarge) {
              return 300;
            }

            if (
              // Spacing for: smaller groups, large nodes
              findDescendantsManually(d.source).length < 40 &&
              targetNodeIsLarge &&
              d.target.data.type !== "connector"
            ) {
              return 200;
            } else if (
              // Spacing for: larger groups, large nodes
              findDescendantsManually(d.source).length > 40 &&
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
            return 7000;
          } else {
            return -7000;
          }
        })
      )
      .force("center", d3.forceCenter(0, 0))
      .force(
        "collision",
        d3
          .forceCollide()
          .radius((d) => (d.depth !== 1 ? nodeSizes(d.data.type) : descendantsScale(findDescendantsManually(d).length)))
      )
      // In order to not overlap, each group should be forced into a x and y direction.
      // Based on the group number, generate a x and y value to move into.
      .force(
        "x",
        d3.forceX().x((d) => {
          if (d.depth === 0) return d.x;
          return (d.data.group - 3) * groupDistance * 2; // Adjusting the distance dynamically based on the group number
        })
      )
      .force(
        "y",
        d3.forceY().y((d) => {
          if (d.depth === 0) return d.y;
          return Math.abs(d.data.group - 3) * groupDistance * 2; // Adjusting the distance dynamically based on the group number
        })
      );

    // Element Creation
    // Create the Canvas
    let svg = d3
      .select(chartRef.current)
      .attr("width", width)
      .attr("height", height)
      .call(zoom)
      .call(
        zoom.transform,
        hasBeenZoomed ? zoomTransform : d3.zoomIdentity.translate(initialZoom.x, initialZoom.y).scale(initialZoom.k)
      )
      .on("wheel", showZoomNotice)
      .on("mousemove", updateZoomNotice)
      .on("contextmenu", function (event) {
        event.preventDefault();
      })
      .attr("class", "graphCanvas")
      .on("mouseover", function (e) {
        d3.select(this).attr("cursor", "grab");
      });

    // Ensure there is no double rendering of nodes, clear before redrawing
    svg.selectAll("*").remove();

    // Create a container to hold node and text
    let nodeElement = svg.selectAll("g").data(
      nodes.filter((d) => d.data.on === true || d.data.on === false || d.data.on === null),
      (d) => d
    );

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
      .attr("id", (d, i) => i)
      // Calculation is tailormade to place all arrowheads correctly.
      .attr("refX", (d) => nodeSizes(d.data.type) / 32)
      .attr("refY", 3)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto-start-reverse")
      .attr("fill", (d) => d.data.color)
      .append("path")
      .attr("d", "M0,0 L0,6 L4,3 z")
      .attr("opacity", 0.1);

    // Create and draw the Links
    let link = svg
      .append("g")
      .selectAll("line")
      .data(links, (d) => d)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.1)
      .attr("stroke-width", (d) => arrowThickness(d.target.data.type));

    let elementEnter = nodeElement.enter().append("g");

    // Create the circles
    let circle = elementEnter
      .append("circle")
      // if the node is not the root node, apply the nodeSizes table. Else, base size on amount of descendants
      .attr("r", (d) => (d.depth !== 1 ? nodeSizes(d.data.type) : descendantsScale(findDescendantsManually(d).length)))

      .attr("stroke", (d) => d.data.color)
      //if the depth of the node is smaller than three, fill it. Else, white.
      .attr("fill", (d) =>
        d.data.type === "person" || d.data.type === "company" || d.data.type === "mothercompany" ? d.data.color : "#fff"
      )
      .attr("stroke-opacity", 0.1)

      .attr("class", (d) =>
        d.data.type === "person" || d.data.type === "company" || d.data.type === "mothercompany"
          ? "largeNode"
          : "smallNode"
      )
      .attr("id", (d) => d.index)

      //Set Opacity to be low by default
      .attr("opacity", 0.1)
      .call(drag(simulation));
    // Add the Text
    let text = elementEnter
      .append("text")
      .call(drag(simulation))
      .attr("dominant-baseline", "central")
      .style("fill", "#fff")

      .each(function (d) {
        let fontsize = 16;
        let maxLength = 20;
        let separation = 18;

        // larger nodes get larger text
        if (d.data.type === "company") {
          fontsize = 32;
          maxLength = 1;
          separation = 38;
        }
        if (d.data.type === "person") {
          fontsize = 18;
          maxLength = 1;
          separation = 25;
        }

        if (d.data.type === "mothercompany") {
          fontsize = 16;
          maxLength = 1;
          separation = 22;
        }

        const lines = wordwrap(d.data.name, maxLength).split("\n");

        // add the number of children to the text
        if (d.children && d.data.type !== "connector" && d.depth > 2) {
          lines.push(`[${d.children.length}]`);
        }

        for (var i = 0; i < lines.length; i++) {
          d3.select(this)
            .append("tspan")
            .attr("dy", separation)
            .attr("text-anchor", "middle")

            .style("font-size", `${fontsize}px`)
            .text(lines[i].trim());

          d3.select(this).attr("transform", "translate(0," + ((separation * lines.length) / 2) * -1 + ")");
        }
      });

    // Give all foreignObject elements that are small Nodes a class for easier selection
    document.querySelectorAll(".smallNode").forEach(function (smallNode) {
      smallNode.parentElement.querySelector("text").classList.add("smallText");
    });

    // Turn on Pointer Events for smaller Text
    document.querySelectorAll(".smallText").forEach(function (smallTextContainer) {
      smallTextContainer.style.pointerEvents = "all";
    });

    // Style the color of the text
    d3.selectAll("circle").each(function (d) {
      if (this.classList.contains("smallNode")) {
        if (d.children !== undefined) {
          d3.select(this.parentElement).select("text").style("fill", d.data.color);
        } else {
          d3.select(this.parentElement).select("text").style("fill", "#000");
          d3.select(this.parentElement).select("text").style("opacity", "0.1");
        }
      }
      // if (d.depth === 0) {
      //   //hide the first node's links
      //   d3.select(this.parentElement).attr("display", "none");
      // }
    });
    // hide the first node's links
    // d3.selectAll("line").each(function (d) {
    //   if (d.source.depth === 0) {
    //     d3.select(this).attr("display", "none");
    //   }
    // });

    // Arrow Heads
    // Correctly assign an url("arrowheadX") tag to position the arrowhead based on the target node's radius
    d3.selectAll("line") //
      .attr("marker-end", (d, i) => {
        let markerUrl;

        d3.selectAll("circle").each(function (f) {
          // Add an arrowtop to the line if it the target is a large enough node
          if (d.target === f) {
            markerUrl = `url(#${i + 1})`;
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
          //we're applying the color of the target node to the line, but the connector has a transparent color.
          //so if the target is a connector, use the color of the source node instead.
          if (d.target === f && d.target.data.type === "connector") {
            nodeColor = d.source.data.color;
          } else if (d.target === f) {
            nodeColor = f.data.color;
          }
        });
        return nodeColor;
      });

    // UPDATE & INTERACTION
    // Cirlces and Circle Text
    d3.selectAll("circle")
      .on("mouseenter", function (e, d) {
        d3.select(this) //
          .transition()
          .duration("200")
          .attr("fill", (d) => (d.depth === 1 ? d.data.color : "#fff"))
          .attr("cursor", "pointer");

        document.documentElement.style.setProperty("--highlightColorHover", d.data.color);

        setNodePath(findAncestorsManually(d));

        const textElement = d3.select(e.target.parentNode).select("text");

        textElement.style("fill", (d) => {
          if (d.data.type === "mothercompany") {
            return d.data.color;
          } else if (d.data.type === "company") {
            return "#fff";
          } else {
            return d.data.color;
          }
        });
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
              ? d.data.color
              : "#fff"
          )

          .attr("cursor", "default");
        // e.target.parentElement.querySelector("text").classList.remove("hovered");

        const textElement = d3.select(e.target.parentNode).select("text");

        textElement.style("fill", (d) => {
          if (d.data.type === "mothercompany") {
            return "#fff";
          } else if (d.data.type === "company" || d.data.type === "person") {
            return "#fff";
          } else {
            return "#000";
          }
        });
      })

      .on("click", handleNodeClick);

    d3.selectAll("svg g").attr("transform", zoomTransform);

    // Event Handling
    function handleNodeClick(event, clickedNode) {
      console.log("clicked a node!");
      activateNodes(clickedNode.children);
      activateNodes(findAncestorsManually(clickedNode));

      // console.log(findAncestorsManually(clickedNode));

      setNodeInfo((prevNodeInfo) => {
        return {
          ...prevNodeInfo,
          title: clickedNode.data.name,
          date: clickedNode.data.date,
          description: clickedNode.data.description,
          sector: clickedNode.data.sector,
          shareholders: clickedNode.data.shareholders ? clickedNode.data.shareholders : "null",
        };
      });

      setUpdateCameFromClickedNode(true);
      setGroupFilterWasClicked(false);
      let nodesToActivate = [];
      //
      nodes.forEach(function (node) {
        // If Statement Declarations
        let nodeWillBeExpanded = node.data.on === false;
        let nodeWillBeClosed = node.data.on === true;

        // check if any of the clicked node's children is on, meaning that the clicked node is already expanded

        if (node.children && node.children[0].data.type === "connector") {
          skipConnectorAndAddChildren();
        }

        // If a node is clicked and expanded, add it to the activeGroupFilter
        updateActiveGroupFilter();

        function updateActiveGroupFilter() {
          if (clickedNode.children) {
            clickedNode.children.forEach(function (clickedNodeChild) {
              if (clickedNodeChild.index === node.index) {
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

                    // Add a statement here: If there is no other node with a depth of 3 of the same group open
                    // if the group of the clickednode contains on nodes at depth 3 that are not the child of the clicked node

                    // Essentially, only if both of the lavel 2 red nodes dont have active chilrdren
                    console.log("allBranchesAreClosed:", allBranchesAreClosed(clickedNode));
                    if (allBranchesAreClosed(clickedNode)) {
                      setActiveGroupFilter((prevActiveGroupFilter) => {
                        let updatedFilter = prevActiveGroupFilter.filter((group) => group !== clickedNode.data.group);
                        return updatedFilter;
                      });
                    }
                    console.log("activeGroupFilter", activeGroupFilter);
                  }
                }
              }
            });
          }
        }
      });
      function allBranchesAreClosed(clickedNode) {
        return nodes.some((node) => {
          return (
            node.data.group === clickedNode.data.group &&
            node.depth === 3 &&
            // node.data.on === false &&
            !clickedNode.children.includes(node)
          );
        });
      }

      function skipConnectorAndAddChildren() {
        if (clickedNode.children) {
          if (clickedNode.children[0].data.type == "connector") {
            // This here represents the children of the found connector node
            nodesToActivate.push(clickedNode.children[0]);
            clickedNode.children[0].children.forEach((skippedNodeChild) => {
              nodesToActivate.push(skippedNodeChild);
            });
            activateNodes(nodesToActivate);
          }
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
    d3.selectAll(".smallText") //
      .on("mouseover", function (e, d) {
        setNodePath(findAncestorsManually(d));
      })
      .on("click", function (e, clickedNode) {
        if (clickedNode.children !== undefined) {
          nodes.forEach(function (node) {
            if (node.index === clickedNode.children[0].index) {
              // if (node.data.on === true) {
              //close all descendants
              hideDescendantsIfOpen(clickedNode);
            } else {
              //show all children
              showChildren(clickedNode);
            }
          });
        } else {
          console.log("cannot expant a leaf node, you've reached the end!");
        }

        setNodeInfo((prevNodeInfo) => {
          return {
            ...prevNodeInfo,
            title: clickedNode.data.name,
            date: clickedNode.data.date,
            description: clickedNode.data.description,
            sector: clickedNode.data.sector,
            shareholders: clickedNode.data.shareholders ? clickedNode.data.shareholders : "null",
          };
        });
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

      elementEnter.selectAll("tspan").attr("x", (d) => d.x);

      document.querySelectorAll("text").forEach(function (text) {
        let circle = text.parentElement.querySelector("circle");

        if (circle.getAttribute("cx") !== null || circle.getAttribute("cy") !== null) {
          text.setAttribute("x", circle.getAttribute("cx"));
          text.setAttribute("y", circle.getAttribute("cy"));
        }
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

  if (isFirstLoad) {
    openingAnimation();
  }

  // Intro Animation

  function openingAnimation() {
    d3.select(".graphCanvas").transition().delay(850).duration(850).ease(d3.easeCubic).call(zoom.scaleTo, 0.1);
  }

  // Graph Interaction
  // Change the text highlighing color in the menu to that of the currently hovered node
  function hoverFilteredNode(IDText) {
    nodes.forEach(function (node) {
      if (node.data.name === IDText) {
        document.documentElement.style.setProperty("--highlightColorHover", node.data.color);
      }
    });
  }

  // Handle Functionality when clicking a GROUP Filter
  function findFilteredGroup(IDText) {
    setGroupFilterWasClicked(true);
    setUpdateCameFromClickedNode(false);
    nodes.forEach(function (node) {
      if (node.data.name === IDText) {
        handleNodeFiltering(node.index);
        setClickedGroupFilterNode(node.data.group);
        document.documentElement.style.setProperty("--highlightColorClick", node.data.color);
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
          event.target.style.color = matchingNode.data.color;
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
  if (isFirstLoad) {
    if (sectorFilters.length > 1) {
      sectorFilters[1].classList.add("active");
    }
  }

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

  // HANDLE THE SECTOR FILTER ARRAS
  function toggleFilter(IDText, allSectorFilters) {
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
            groupFilterItem.style.color = node.data.color;
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
      let groupIsAllowed = activeGroupFilter.includes(node.data.group);
      let nodeIsSubcompany = node.data.type === "subcompany";
      let nodeIsConnector = node.data.type === "connector";
      let nodeIsMotherCompany = node.data.type === "mothercompany";
      let nodeMatchesSectorFilter = activeSectorFilterRef.current.includes(node.data.sector);

      function nodeDescendantsIncludesActiveSectorNode() {
        return findDescendantsManually(node).some((nodeDescendant) => {
          return activeSectorFilterRef.current.includes(nodeDescendant.data.sector);
        });
      }

      // Disabling Nodes
      if (
        // Statement One
        (!groupIsAllowed && node.depth > 2) ||
        // Statement Two
        (node.depth > 3 &&
          nodeIsMotherCompany &&
          !nodeMatchesSectorFilter &&
          !nodeDescendantsIncludesActiveSectorNode()) ||
        //Statement Three
        (nodeIsSubcompany && !nodeMatchesSectorFilter && !nodeDescendantsIncludesActiveSectorNode()) ||
        // Statement Four
        (nodeIsConnector && !nodeDescendantsIncludesActiveSectorNode()) ||
        (node.depth > 2 && !nodeMatchesSectorFilter && !nodeDescendantsIncludesActiveSectorNode())
      ) {
        nodesToDisable.push(node);
      }
      // Enabling Nodes
      if ((nodeMatchesSectorFilter && !updateCameFromClickedNode && !groupFilterWasClicked) || groupIsAllowed) {
        nodesToEnable.push(node);
      }

      // Group filtering
      if (node.index === groupNodeIndex) {
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

  // Change the on opacity of nodes passed into this function.
  function activateNodes(connectedNodes) {
    let circle = d3.selectAll("circle");

    circle.each(function (circle) {
      if (connectedNodes !== undefined) {
        if (connectedNodes.some((node) => node.index === circle.index)) {
          d3.select(this).attr("opacity", 1);
          d3.select(this).attr("stroke-opacity", 1);
          d3.select(this.parentElement).select("text").style("opacity", 1);
        }
      }
    });

    let links = d3.selectAll("line");
    links.each(function (link) {
      if (connectedNodes) {
        if (connectedNodes.some((node) => node.index === link.target.index)) {
          d3.select(this).attr("stroke-opacity", 1);
        }
      }
    });

    let arrowheads = d3.selectAll("marker");

    arrowheads.each(function (arrowhead) {
      let arrowheadID = d3.select(this).attr("id");
      if (connectedNodes) {
        if (connectedNodes.some((node) => node.index === parseInt(arrowheadID))) {
          console.log("arrowhead marthces");
          d3.select(this).select("path").attr("opacity", 1);
        }
      }
    });

    // arrowheads.each(function(arrowhead){

    // })

    // If the link has the target node that is the connecter node, change its opacity
  }

  function deactivateNodes(connectedNodes) {
    let circle = d3.selectAll("circle");

    circle.each(function (circle) {
      if (connectedNodes.some((node) => node.index === circle.index)) {
        d3.select(this).attr("opacity", 0.1);
        d3.select(this).attr("stroke-opacity", 0.1);
        d3.select(this.parentElement).select("text").style("opacity", 0.1);
      }
    });

    let links = d3.selectAll("line");
    links.each(function (link) {
      if (connectedNodes.some((node) => node.index === link.target.index)) {
        d3.select(this).attr("stroke-opacity", 0.1);
      }
    });
    let arrowheads = d3.selectAll("marker");
    arrowheads.each(function (arrowhead) {
      let arrowheadID = d3.select(this).attr("id");
      if (connectedNodes.some((node) => node.index === parseInt(arrowheadID))) {
        console.log("arrowhead marthces");
        d3.select(this).select("path").attr("opacity", 0.1);
      }
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
  function handleCompWheel() {
    if (isFirstLoad === true) {
      setIsFirstLoad(false);
    }
  }
  function handleCompMouseMove() {
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

  let scrubberNumber;
  function handleZoomScrubbing(scrubberAdvance) {
    d3.select(".graphCanvas").call(zoom.scaleTo, scrubberAdvance);
  }

  return (
    <div
      className="componentContainer"
      onClick={handleCompClick}
      onWheel={handleCompWheel}
      onMouseMove={handleCompMouseMove}
    >
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
      <Zoombar
        className="zoombar"
        zoomAmount={zoomAmount}
        zoomRange={zoomRange}
        handleZoomScrubbing={handleZoomScrubbing}
        scrubberNumber={scrubberNumber}
      />
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
