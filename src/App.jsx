import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import InfoBox from "./assets/Components/InfoBox";
import Navigation from "./assets/Components/Navigation";
import Zoombar from "./assets/Components/Zoombar";

function D3Chart() {
  let isOnMobile = window.innerWidth < 600;
  let isOnTablet = window.matchMedia(
    "(min-device-width: 601px) and (max-device-width: 1080px) and (-webkit-min-device-pixel-ratio: 1)"
  ).matches;
  let isOnDesktop = !isOnMobile && !isOnTablet;

  let chartRef = useRef(null);

  let [data, setData] = useState([]);

  // Set state values for the data graph
  let root = d3.hierarchy(data);
  let [links, setLinks] = useState(root.links());
  let [nodes, setNodes] = useState(root.descendants());

  let [dataLoaded, setDataLoaded] = useState(false);

  // Fetch the Data
  useEffect(() => {
    fetch(
      "https://gist.githubusercontent.com/patrick-hutchinson/46054204fbf311364b678598e40335a6/raw/fd0dc1c4c1f10b93529b154d0a4b7f9993d87c24/data.json"
    )
      .then((res) => res.json())
      .then((dataArray) => {
        setData(dataArray);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  // Create hierarchy and set links and nodes when data changes
  useEffect(() => {
    setLinks(Array.from(root.links()));
    setNodes(Array.from(root.descendants()));

    if (data.length !== 0) {
      setDataLoaded(true);
    }
  }, [data]);

  useEffect(() => {
    setFilterInfo(nodes);
  }, [nodes]);

  let width = window.innerWidth * 0.8;
  let height = window.innerHeight * 0.95;

  // Set state values for the Zoombar component
  let [zoomAmount, setZoomAmount] = useState(0);

  let [hasBeenZoomed, setHasBeenZoomed] = useState(false);

  let [initialZoom, setInitialZoom] = useState({
    x: isOnDesktop ? 0 : 200,
    y: isOnDesktop ? 0 : 200,
    k: isOnDesktop ? 0.8 : 0.1,
  });

  let [zoomTransform, setZoomTransform] = useState(
    `translate(${initialZoom.x}, ${initialZoom.y}) scale(${initialZoom.k})`
  );

  let zoomRange;
  if (isOnMobile) {
    // Set the zoom range for mobile
    zoomRange = [0.01, 4];
  } else {
    // Set the zoom range for non-mobile (tablet and desktop)
    zoomRange = [0.05, 1];
  }

  // Unset values for the InfoBox component
  let [nodeInfo, setNodeInfo] = useState({
    title: "Δεν έχει επιλεγεί κόμβος!",
    date: "dd/mm/yyyy",
    description: "Περάστε πάνω από ένα Σημείο Δεδομένων για να μάθετε περισσότερα γι' αυτό.",
    sector: "",
    shareholders: "",
    relationships: "",
  });

  let [nodePath, setNodePath] = useState(["Root"]);

  let [filterInfo, setFilterInfo] = useState(nodes);

  let [updateCameFromClickedNode, setUpdateCameFromClickedNode] = useState(false);
  let [groupFilterWasClicked, setGroupFilterWasClicked] = useState(false);

  let groupFilterWasClickedRef = useRef(groupFilterWasClicked);
  useEffect(() => {
    groupFilterWasClickedRef.current = groupFilterWasClicked;
  }, [groupFilterWasClicked]);

  let [activeSectorFilter, setActiveSectorFilter] = useState([]);

  useEffect(() => {
    setActiveSectorFilter(["ΜΜΕ"]);

    let sectorFilters = document.querySelectorAll(".sectorFilter");
    if (sectorFilters.length > 1) {
      sectorFilters.forEach((filter) => filter.innerText.includes("ΜΜΕ") && filter.classList.add("active"));
    }
    // Populate the setActiveGroupFilter with the groups that are present in the data
    // Should be an array of numbers
    if (nodes.length > 0) {
      const groupNodes = nodes.filter((n) => n.depth === 1).map((n, i) => i + 1);
      setActiveGroupFilter(groupNodes);
    }
  }, [dataLoaded]);

  document
    .querySelectorAll(".sectorFilter")
    .forEach((filter) => filter.innerText.includes("ΜΜΕ") && filter.classList.add("active"));

  // Adding relationships (brother, partner...) to nodes
  // Add a relationship object to the node that is the target of the object, so it shows up in the info panel also
  useEffect(() => {
    setNodes((prevNodes) => {
      let updatedNodes = [...prevNodes]; // Create a copy of prevNodes

      updatedNodes.forEach((node) => {
        if (node.data.relationships) {
          node.data.relationships.forEach((relationship) => {
            let isRelatedNode = updatedNodes.find((altNode) => altNode.data.name === relationship.relatedTo);
            if (isRelatedNode) {
              if (!isRelatedNode.data.relationships) {
                isRelatedNode.data.relationships = []; // Initialize relationships array if not already present
              }
              // Add the new relationship to the related node
              isRelatedNode.data.relationships.push({
                relatedTo: node.data.name,
                relation: relationship.relation,
              });
            }
          });
        }
      });

      return updatedNodes;
    });
  }, [dataLoaded]);

  // Create new links based on the relationships between people in the graph
  useEffect(() => {
    let newLinks = [];

    links.forEach((link, linkIndex, linkArray) => {
      if (link.source.data.relationships) {
        link.source.data.relationships.forEach((relationship) => {
          const sourceNode = link.source;
          let targetNode = null;

          linkArray.forEach((altLink) => {
            if (relationship.relatedTo === altLink.source.data.name) {
              targetNode = altLink.source;
            }
          });

          if (sourceNode && targetNode) {
            newLinks.push({ source: sourceNode, target: targetNode });
          }
        });
      }
    });

    if (newLinks.length > 0) {
      setLinks((prevLinks) => [...prevLinks, ...newLinks]);
    }
  }, [dataLoaded]);

  let activeSectorFilterRef = useRef(activeSectorFilter);

  // Update the activeSectorFilter Ref
  useEffect(() => {
    activeSectorFilterRef.current = activeSectorFilter;
  }, [activeSectorFilter]);

  //we need to set to active group filter to the dynamically added nodes from the navigation component, otherwise it stays empty
  let [activeGroupFilter, setActiveGroupFilter] = useState([]);

  // Declare Scales and Values
  const nodeDomain = ["project", "company", "person", "mothercompany", "subcompany", "connector"];
  let nodeSizesArray = [10, 145, 115, 115, 115, 0, 0];
  let nodeSizes = d3
    .scaleOrdinal() //
    .domain(nodeDomain)
    .range(nodeSizesArray);

  let arrowThicknessArray = [2, 2, 6, 5, 5, 3, 3];
  let arrowThickness = d3
    .scaleOrdinal() //
    .domain(nodeDomain)
    .range(arrowThicknessArray);

  let allNodes = root.descendants();
  // Find the minimum and maximum number of descendants
  let [minDescendants, maxDescendants] = d3.extent(allNodes, (node) => node.descendants().length);

  // Create the scale based on the range of descendants
  let startingNodeSizes = [200, 700];
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

  // New Zoom transform function
  function handleZoom(e) {
    if (!isOnDesktop && e.sourceEvent !== null) {
      if (e.sourceEvent.touches.length === 1) {
        return d3.event.sourceEvent.stopPropagation();
      }
    }

    d3.selectAll(".elementEnter").attr("transform", (d) => {
      const translateX = e.transform.applyX(d.x);
      const translateY = e.transform.applyY(d.y);
      const scale = e.transform.k;

      return `translate(${translateX}, ${translateY}) scale(${scale})`;
    });

    let links = d3.selectAll(".link");

    links.attr("x1", (d) => e.transform.applyX(d.source.x));
    links.attr("y1", (d) => e.transform.applyY(d.source.y));
    links.attr("x2", (d) => e.transform.applyX(d.target.x));
    links.attr("y2", (d) => e.transform.applyY(d.target.y));

    links.attr("stroke-width", (d) => arrowThickness(d.target.data.type) * e.transform.k);

    let zoomNoticeCursor = document.querySelector(".zoomNoticeCursor");
    zoomNoticeCursor.classList.remove("visible");

    // Store the current zoom transform in state
    setZoomTransform(e.transform); // Updated line

    // Update the zoom state without directly applying it here
    setZoomAmount(e.transform.k);
    setHasBeenZoomed(true);
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
    const groupDistance = 600;
    let simulation = d3
      .forceSimulation(nodes, (d) => d)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => {
            let sourceNodeIsLarge = d.source.data.type !== "subcompany";
            let targetNodeIsLarge = d.target.data.type !== "subcompany";

            if (d.source.depth === 0 || d.target.depth === 0) {
              return 50; // Closer to the center
            }
            if (sourceNodeIsLarge && targetNodeIsLarge) {
              return 400; // Larger distance for big nodes
            }
            return 150; // Default distance for others
          })
          .strength(0.8) // Strength slightly reduced to keep links flexible
      )
      .force(
        "charge",
        d3.forceManyBody().strength((d) => {
          return -7000;
        })
      )
      .force("center", d3.forceCenter(0, 0))
      .force(
        "collision",
        d3.forceCollide().radius((d) => nodeSizes(d.data.type) + 10) // Add a bit more padding to ensure spacing
      )
      // In order to not overlap, each group should be forced into a x and y direction.
      // Based on the group number, generate a x and y value to move into.
      .force(
        "x",
        d3.forceX().x((d) => {
          if (d.depth === 0) return d.x;
          return (d.data.group - 3) * groupDistance; // Adjusting the distance dynamically based on the group number
        })
      )
      .force(
        "y",
        d3.forceY().y((d) => {
          if (d.depth === 0) return d.y;
          return Math.abs(d.data.group - 3) * groupDistance; // Adjusting the distance dynamically based on the group number
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
      nodes.filter((d) => d.data.on !== undefined),
      (d) => d
    );

    // let arrowheads = svg
    //   .append("defs")
    //   .selectAll("marker")
    //   // Linking the nodes data will create a def element for each element in nodes.
    //   // The refX and fill values will associate to each node, creating an arrowhead that fits for each.
    //   // Since it goes through from start to finish, we can incremement the id number and later match that with the made arrows.
    //   .data(nodes, (d) => d)
    //   // .join("marker")
    //   .enter()
    //   .append("marker")
    //   .attr("id", (d, i) => i)
    //   // Calculation is tailormade to place all arrowheads correctly.
    //   .attr("refX", (d) => nodeSizes(d.data.type) / 32)
    //   .attr("refY", 3)
    //   .attr("markerWidth", 10)
    //   .attr("markerHeight", 10)
    //   .attr("class", "arrowhead")
    //   .attr("orient", "auto-start-reverse")
    //   .attr("fill", (d) => d.data.color)
    //   .append("path")
    //   .attr("d", "M0,0 L0,6 L4,3 z");

    // Create and draw the Links
    let link = svg
      .append("g")
      .selectAll("line")
      .data(links, (d) => d)
      .enter()
      .append("line")
      .classed("link", true)
      .classed("relationLink", (d) =>
        d.source.data.type === "person" && d.target.data.type === "person" ? true : false
      )
      .attr("z-index", 10)
      .attr("position", "relative")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.1)
      .attr("stroke-width", (d) => arrowThickness(d.target.data.type));
    // .attr("stroke-width", "3");

    let elementEnter = nodeElement.enter().append("g").classed("elementEnter", true).call(drag(simulation));
    // elementEnter.attr("transform", (d) => `translate(${d.x},${d.y})`);

    // Create the circles
    let circle = elementEnter
      .append("circle")
      // if the node is not the root node, apply the nodeSizes table. Else, base size on amount of descendants
      .attr("r", (d) => (d.depth !== 1 ? nodeSizes(d.data.type) : descendantsScale(d.descendants.length)))
      .attr("stroke", (d) => (d.data.color === "transparent" ? null : lightenHex(d.data.color)))
      .attr("stroke-width", (d) => (d.data.color === "transparent" ? 0 : 2))
      //if the depth of the node is smaller than three, fill it. Else, white.
      .attr("fill", (d) =>
        d.data.type === "person" || d.data.type === "company" || d.data.type === "mothercompany"
          ? lightenHex(d.data.color, 0.8)
          : "#fff"
      )
      .attr("class", (d) =>
        d.data.type === "person" || d.data.type === "company" || d.data.type === "mothercompany"
          ? "largeNode"
          : "smallNode"
      )
      .attr("id", (d) => d.index)
      .attr("z-index", 1)
      .attr("position", "relative");

    // Add the Text
    let text = elementEnter
      .append("text")
      // .text((d) => d.data.name)
      .attr("dominant-baseline", "central")
      .style("fill", "#fff")

      .each(function (d) {
        let fontsize = 16;
        let maxLength = 20;
        let maxLines = 6;
        let separation = 18;

        // larger nodes get larger text
        if (d.data.type === "company") {
          fontsize = 32;
          maxLength = 16;
          separation = 38;
        }
        if (d.data.type === "person") {
          fontsize = 18;
          maxLength = 16;
          separation = 25;
        }

        if (d.data.type === "mothercompany") {
          fontsize = 16;
          maxLength = 16;
          separation = 22;
        }

        const lines = wordwrap(d.data.name, maxLength).split("\n");

        if (lines.length > maxLines) {
          lines.splice(maxLines, lines.length - maxLines);
          lines.push("...");
        }

        // add the number of children to the text
        if (d.children && d.data.type !== "connector" && d.depth > 2) {
          lines.push(`[${d.children.length}]`);
        }

        for (var i = 0; i < lines.length; i++) {
          d3.select(this)
            .append("tspan")
            .attr("dy", separation)
            .attr("text-anchor", "middle")
            .attr("x", 0)
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
          // d3.select(this.parentElement).select("text").style("opacity", "0.1");
        }
      }
      if (d.depth === 0) {
        //hide the first node's links
        d3.select(this.parentElement).attr("display", "none");
      }
    });
    let lines = d3.selectAll("line");
    let circles = d3.selectAll("circle");

    // Create a map of circles by their data property (e.g., name or id)
    let circleMap = new Map();
    circles.each(function (d) {
      circleMap.set(d.data.name, this); // Assuming d.data.name is a unique identifier
    });

    // Style the color of the text and hide links for specific nodes
    circles.each(function (d) {
      let circle = d3.select(this);
      let parentElement = circle.node().parentElement;

      if (this.classList.contains("smallNode")) {
        let textElement = d3.select(parentElement).select("text");
        if (d.children !== undefined) {
          textElement.style("fill", d.data.color);
        } else {
          textElement.style("fill", "#000");
        }
      }

      if (d.depth === 0) {
        d3.select(parentElement).attr("display", "none");
      }
    });

    // Process lines after circles
    lines.each(function (d) {
      // Hide the first node's links
      if (d.source.depth === 0) {
        d3.select(this).attr("display", "none");
      }

      // Arrow Heads
      let markerUrl;
      let targetCircle = circleMap.get(d.target.data.name);

      if (targetCircle) {
        markerUrl = `url(#${d3.select(targetCircle).attr("id")})`;
      }

      d3.select(this).attr("marker-end", markerUrl);

      // Match the stroke color to the node group
      let nodeColor;
      if (targetCircle) {
        let targetNodeData = d3.select(targetCircle).datum();
        if (targetNodeData.data.type === "connector") {
          nodeColor = d.source.data.color;
        } else {
          nodeColor = targetNodeData.data.color;
        }
      }
      d3.select(this).attr("stroke", nodeColor);
    });

    // UPDATE & INTERACTION
    // Cirlces and Circle Text
    let currentFill;
    let currentStroke;

    function handleMouseEnter(e, d) {
      // Save current fill and stroke attributes
      currentFill = d3.select(this).attr("fill");
      currentStroke = d3.select(this).attr("stroke");

      // Update circle attributes
      d3.select(this)
        .attr("cursor", "pointer")
        .attr("fill", (d) => (d.depth === 1 ? d.data.color : "#fff"))
        .attr("stroke", currentStroke);

      // Update highlight color
      document.documentElement.style.setProperty("--highlightColorHover", d.data.color);

      // Update node path
      setNodePath(d.ancestors());

      // Update text color
      const textElement = d3.select(e.target.parentNode).select("text");
      textElement.style("fill", (d) => {
        switch (d.data.type) {
          case "mothercompany":
            return d.data.color;
          case "company":
            return "#fff";
          default:
            return d.data.color;
        }
      });
    }

    function handleMouseLeave(e, d) {
      const currentElement = d3.select(this);

      currentElement

        .attr("fill", function (d) {
          return currentElement.classed("nodeIsClicked") ? currentElement.attr("fill") : currentFill;
        })
        .classed("nodeIsClicked", false)
        .attr("stroke", currentStroke);

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
    }

    // Apply the event handler to circles
    circles
      .on("mouseenter", handleMouseEnter) //
      .on("mouseleave", handleMouseLeave) //
      .on("click", handleNodeClick);

    // Event Handling
    function handleNodeClick(event, clickedNode) {
      activateNodes(clickedNode.children);
      activateNodes(clickedNode.ancestors());

      d3.select(this).classed("nodeIsClicked", true);

      setNodeInfo((prevNodeInfo) => {
        return {
          ...prevNodeInfo,
          title: clickedNode.data.name,
          date: clickedNode.data.date,
          description: clickedNode.data.description,
          sector: clickedNode.data.sector,
          shareholders: clickedNode.data.shareholders ? clickedNode.data.shareholders : null,
          relationships: clickedNode.data.relationships ? clickedNode.data.relationships : null,
        };
      });

      setUpdateCameFromClickedNode(true);
      setGroupFilterWasClicked(false);

      skipNodeIfConnector(clickedNode);
    }

    let skipNodeIfConnector = (clickedNode) => {
      if (clickedNode.children) {
        clickedNode.children.forEach((child) => {
          if (child.data.type === "connector") {
            activateNodes(child.children); // Activate the connector's children (if any)
          }
        });
      }
    };

    // SMALL TEXT NODES
    d3.selectAll(".smallText") //
      .on("mouseover", function (e, hoveredNode) {
        setNodePath(hoveredNode.ancestors());
      })
      .on("click", function (e, clickedNode) {
        setNodeInfo((prevNodeInfo) => {
          return {
            ...prevNodeInfo,
            title: clickedNode.data.name,
            date: clickedNode.data.date,
            description: clickedNode.data.description,
            sector: clickedNode.data.sector,
            shareholders: clickedNode.data.shareholders ? clickedNode.data.shareholders : null,
            relationships: clickedNode.data.relationships ? clickedNode.data.relationships : null,
          };
        });
      });

    simulation.on("tick", () => {
      // Get the current zoom transform
      let currentZoom = d3.zoomTransform(chartRef.current);

      // Update link positions
      link
        .attr("x1", (d) => currentZoom.applyX(d.source.x))
        .attr("y1", (d) => currentZoom.applyY(d.source.y))
        .attr("x2", (d) => currentZoom.applyX(d.target.x))
        .attr("y2", (d) => currentZoom.applyY(d.target.y));

      // Update node positions and scale the entire `g` element
      elementEnter.attr("transform", (d) => {
        // Apply both translation and scaling to the `g` element
        const translateX = currentZoom.applyX(d.x);
        const translateY = currentZoom.applyY(d.y);
        const scale = currentZoom.k;

        return `translate(${translateX}, ${translateY}) scale(${scale})`;
      });
    });

    // circle.exit().remove();
    simulation.nodes(nodes);
  }, [nodes]);

  // Intro Animation
  window.openingAnimation = openingAnimation;

  function openingAnimation() {
    d3.select(".graphCanvas").transition().delay(850).duration(850).ease(d3.easeCubic).call(zoom.scaleTo, 0.109);
  }

  // Graph Interaction
  // Change the text highlighing color in the menu to that of the currently hovered node
  function hoverFilteredNode(filtername) {
    nodes.forEach(function (node) {
      if (node.data.name === filtername) {
        document.documentElement.style.setProperty("--highlightColorHover", node.data.color);
      }
    });
  }

  // Handle Functionality when clicking a GROUP Filter
  function findFilteredGroup(groupname, groupnumber, groupcolor) {
    setGroupFilterWasClicked(true);
    setUpdateCameFromClickedNode(false);

    // I have DOUBTS about this
    nodes.forEach(function (node) {
      if (node.data.name === groupname) {
        handleNodeFiltering(groupnumber);
        document.documentElement.style.setProperty("--highlightColorClick", node.data.color);
      }
    });
    //

    let filterIsActive = event.target.classList.contains("active");

    // Filter is not active yet
    if (!filterIsActive) {
      // Add Active Class
      event.target.classList.add("active");

      // Add the group number to the active group filter array
      setActiveGroupFilter((prevActiveGroupFilter) => {
        const updatedFilter = [...prevActiveGroupFilter, groupnumber];
        event.target.style.color = groupcolor;
        return updatedFilter;
      });
    } else {
      // Filter is already active, so remove it
      event.target.classList.remove("active");

      setActiveGroupFilter((prevActiveGroupFilter) => {
        // Remove the group number from the filter array
        const updatedFilter = prevActiveGroupFilter.filter((num) => num !== groupnumber);
        return updatedFilter;
      });

      event.target.style.color = "#000"; // reset color to default
    }
  }

  let sectorFilters = document.querySelectorAll(".sectorFilter");

  // Handle Functionality when clicking a SECTOR Filter
  function findFilteredSectorNode(filtername, allSectorFilters) {
    setGroupFilterWasClicked(false);
    setUpdateCameFromClickedNode(false);
    // Disable the active class from the all Filter Item if any other one is clicked
    const allFilter = Array.from(sectorFilters).find((filter) => filter.textContent.includes("Όλα"));

    if (!event.target.innerText.includes("Όλα")) {
      allFilter.classList.remove("active");
    }

    // When clicking the all button, disable all individual filters
    if (event.target.innerText.includes("Όλα")) {
      sectorFilters.forEach((altListItem) => {
        altListItem.classList.remove("active");
      });
    }

    // Toggle the clicked Filter Item and Add/Remove it from the clicked filter array
    // toggleFilter(IDText, allSectorFilters);

    // Toggle the clicked Filter Item
    toggleFilter(filtername, allSectorFilters);
  }

  // HANDLE THE SECTOR FILTER ARRAY
  function toggleFilter(filtername, allSectorFilters) {
    // If Statement Declarations
    let filterIsActive = event.target.classList.contains("active");

    // The clicked Filter is not active yet
    if (!filterIsActive) {
      event.target.classList.add("active");

      let clickedAllFilter = event.target.innerText.includes("Όλα");
      let everyFilterActive = activeSectorFilter.length === allSectorFilters.length;

      // The target is not the "All" filter
      if (!clickedAllFilter) {
        // The "All" was not previously selected (The array is not full)
        if (!everyFilterActive) {
          // Add the Filter to the Array
          setActiveSectorFilter((prevActiveSectorFilter) => {
            return [...prevActiveSectorFilter, filtername];
          });

          // The "All" was previously selected (The array is full)
        } else if (everyFilterActive) {
          // Clear the Array and add the Selected Filter
          setActiveSectorFilter((prevActiveSectorFilter) => {
            return [filtername];
          });
        }
        // all filter is clicked, add all missing filters
      } else {
        allSectorFilters.forEach((allSectorFilter) => {
          if (!activeSectorFilter.includes(allSectorFilter)) {
            setActiveSectorFilter((prevActiveSectorFilter) => {
              return [...prevActiveSectorFilter, allSectorFilter];
            });
          }
        });
      }
    }

    if (filterIsActive) {
      event.target.classList.remove("active");

      // Remove the clicked filter from the array
      if (!clickedAllFilter) {
        setActiveSectorFilter((prevActiveSectorFilter) => {
          return prevActiveSectorFilter.filter((sector) => sector !== filtername);
        });
      } else {
        setActiveSectorFilter("");
      }
    }
  }

  useEffect(() => {
    let groupFilterItems = document.querySelectorAll(".groupFilters > .filterItem");

    groupFilterItems.forEach((groupFilterItem) => {
      // Cache innerText to avoid reflow on every access
      const groupItemText = groupFilterItem.innerText;

      // Track whether the filter should be active
      let shouldBeActive = false;

      // Iterate through the nodes once
      nodes.forEach((node) => {
        // Check only for top-level nodes
        if (node.depth === 1) {
          // Check if the node's group is active and if its name is part of the filter item
          const includesNodeName = groupItemText.includes(node.data.name);

          if (includesNodeName) {
            shouldBeActive = activeGroupFilter.includes(node.data.group);
            // Exit the loop early if found, as this won't change
            if (shouldBeActive) return;
          }
        }
      });

      // Update classes and colors only once after looping
      if (shouldBeActive) {
        groupFilterItem.classList.add("active");
        groupFilterItem.style.color = nodes.find((node) => groupItemText.includes(node.data.name)).data.color;
      } else {
        groupFilterItem.classList.remove("active");
        groupFilterItem.style.color = "";
      }
    });

    handleNodeFiltering();
  }, [activeSectorFilter, activeGroupFilter]);

  // Based on the newest state of the activeSectorFilter and activeGroupFilter, hide all nodes that are not part of the active filter
  function handleNodeFiltering(groupnumber) {
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
        return node.descendants().some((nodeDescendant) => {
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
      if (node.index === groupnumber) {
        node.descendants().forEach((descendantNode) => {
          if (activeSectorFilterRef.current.includes(descendantNode.data.sector)) {
            nodesToEnable.push(descendantNode);
          }
        });
      }
    });

    activateNodes(nodesToEnable);
    deactivateNodes(nodesToDisable);
  }

  // if (sectorFilters.length > 1) {
  //   sectorFilters[1].classList.add("active");
  // }

  // Change the opacity of nodes passed into this function.
  function activateNodes(nodesToActivate) {
    if (!nodesToActivate || nodesToActivate.length === 0) return;

    // Create a lookup map for nodes by index
    const nodeMap = new Map(nodesToActivate.map((node) => [node.index, node]));

    // Update the circle (node) elements
    d3.selectAll("circle").each(function (d) {
      const matchedNode = nodeMap.get(d.index);

      if (matchedNode) {
        const currentCircle = d3.select(this);

        // Set fill and stroke colors
        currentCircle
          .attr("fill", () => {
            const { type, color } = matchedNode.data;
            if (type === "person" || type === "company" || type === "mothercompany") {
              return color !== "transparent" ? color : null;
            } else {
              return "#fff"; // Default color for other types
            }
          })
          .attr("stroke", matchedNode.data.color === "transparent" ? null : matchedNode.data.color);

        // Update the associated text element
        const parentGroup = d3.select(this.parentElement);
        parentGroup
          .select("text")
          .style("fill", matchedNode.data.type !== "subcompany" ? "#fff" : "#000")
          .style("opacity", matchedNode.data.type === "subcompany" ? 1 : null);
      }
    });

    // Update the link (line) elements
    d3.selectAll("line").each(function (d) {
      // Show links for active nodes
      if (nodeMap.has(d.target.index)) {
        d3.select(this).attr("stroke-opacity", 1); // Show the link
      } else {
        d3.select(this).attr("stroke-opacity", 0.2); // Set lower opacity for inactive links
      }
    });

    // Update the arrowhead markers
    d3.selectAll("marker").each(function () {
      const arrowheadID = parseInt(d3.select(this).attr("id"));

      const matchedNode = nodeMap.get(arrowheadID);
      if (matchedNode) {
        // Update the color of the arrowhead
        d3.select(this)
          .select("path")
          .attr("fill", matchedNode.data.color === "transparent" ? null : matchedNode.data.color);
      }
    });
  }

  function deactivateNodes(nodesToActivate) {
    if (!nodesToActivate || nodesToActivate.length === 0) return;

    // Create a lookup map for nodes by index
    const nodeMap = new Map(nodesToActivate.map((node) => [node.index, node]));

    // Update the circle (node) elements
    d3.selectAll("circle").each(function (d) {
      const matchedNode = nodeMap.get(d.index);

      if (matchedNode) {
        const currentCircle = d3.select(this);

        // Set fill and stroke colors with lighter shade
        currentCircle
          .attr("fill", () => {
            const { type, color } = matchedNode.data;
            if (type === "person" || type === "company" || type === "mothercompany") {
              return color !== "transparent" ? lightenHex(color, 0.8) : null;
            } else {
              return "#fff"; // Default color for other types
            }
          })
          .attr("stroke", matchedNode.data.color === "transparent" ? null : lightenHex(matchedNode.data.color, 0.8));

        // Update the associated text element
        const parentGroup = d3.select(this.parentElement);
        parentGroup
          .select("text")
          .style("fill", matchedNode.data.type !== "subcompany" ? "#fff" : "#000")
          .style("opacity", matchedNode.data.type === "subcompany" ? 0.2 : null);
      }
    });

    // Update the link (line) elements
    d3.selectAll("line").each(function (d) {
      // Decrease opacity for links connected to deactivated nodes
      if (nodeMap.has(d.target.index)) {
        d3.select(this).attr("stroke-opacity", 0.1);
      }
    });

    // Update the arrowhead markers
    d3.selectAll("marker").each(function () {
      const arrowheadID = parseInt(d3.select(this).attr("id"));

      const matchedNode = nodeMap.get(arrowheadID);
      if (matchedNode) {
        // Update the color of the arrowhead with lighter shade
        d3.select(this)
          .select("path")
          .attr("fill", matchedNode.data.color === "transparent" ? null : lightenHex(matchedNode.data.color, 0.8));
      }
    });
  }

  function lightenHex(hex, intensity = 0.2) {
    // Ensure the hex code is valid
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
      throw new Error("Invalid hex color code");
    }

    // Remove the '#' if present
    hex = hex.replace("#", "");

    // Convert 3-digit hex to 6-digit hex
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }

    // Convert hex to RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Lighten the color
    r = Math.min(255, Math.floor(r + (255 - r) * intensity));
    g = Math.min(255, Math.floor(g + (255 - g) * intensity));
    b = Math.min(255, Math.floor(b + (255 - b) * intensity));

    // Convert RGB back to hex
    const toHex = (value) => value.toString(16).padStart(2, "0");
    const lightenedHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

    return lightenedHex;
  }

  function handleShowInfoClick() {
    document.querySelector(".infoContainer").classList.remove("hidden");
    document.querySelector(".componentContainer").classList.remove("hiddenInfo");
    document.querySelector(".showInfo").classList.add("hidden");
  }

  function zoomIn() {
    d3.select(".graphCanvas").transition().call(zoom.scaleBy, 1.5);
  }
  function zoomOut() {
    d3.select(".graphCanvas").transition().call(zoom.scaleBy, 0.5);
  }

  let scrubberNumber;
  function handleZoomScrubbing(scrubberAdvance) {
    d3.select(".graphCanvas").call(zoom.scaleTo, scrubberAdvance);
  }

  return (
    <div className="componentContainer">
      <Navigation
        className="navigationContainer"
        filterItems={filterInfo}
        findFilteredGroup={findFilteredGroup}
        // handleFilteredSectorChange={handleFilteredSectorChange}
        findFilteredSectorNode={findFilteredSectorNode}
        hoverFilteredNode={hoverFilteredNode}
        nodePath={nodePath}
        isOnMobile={isOnMobile}
        isOnTablet={isOnTablet}
        isOnDesktop={isOnDesktop}
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
        <div className="zoomButton mobile" onClick={zoomIn}>
          +
        </div>
        <div className="zoomButton mobile" onClick={zoomOut}>
          -
        </div>
      </div>
      <div className="zoomNoticeCursor">Pinch or hold the control/command button to zoom</div>
    </div>
  );
}

export default D3Chart;
