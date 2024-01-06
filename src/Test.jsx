import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import solomonData from './data.json';
import InfoBox from './assets/Components/InfoBox';
import Navigation from './assets/Components/Navigation';
import Zoombar from './assets/Components/Zoombar';

function D3Chart() {
    // http://localhost:5173/

    // TODO: Make this stateful?
    const width = 867;
    const height = 700;

    let chartRef = useRef(null);

    // Set state values for the data graph
    let [data, setData] = useState(solomonData);
    let [root, setRoot] = useState(d3.hierarchy(data));
    let [links, setLinks] = useState(root.links());
    let [nodes, setNodes] = useState(root.descendants());

    // D3 References should not be stateful, as the graphs should not be rerendered on every state change.
    const simulation = useRef(null);
    const svg = useRef(null);
    const chart = useRef(null);

    // Set state values for the Zoombar component
    let [zoomAmount, setZoomAmount] = React.useState(0);
    //currently not working
    let initialZoom = { k: 0.35, x: 200, y: -50 };
    let [zoomTransform, setZoomTransform] = React.useState(initialZoom);
    let [zoomValues, setZoomValues] = React.useState([0, 0]);

    // Set state values for the InfoBox component
    let [nodeInfo, setNodeInfo] = React.useState({
        title: 'No Node Selected!',
        date: 'dd/mm/yyyy',
        description: 'Click a Datapoint to learn more about it.',
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
        .range(['black', '#AF1BF5', 'orange', 'gold', 'blue', 'green', 'pink', 'red', 'grey']);

    // Match filterItems with corresponding nodes
    // (See more in Navigation component)
    function findFilteredNode(IDText) {
        let filteredDescendants;
        let filteredAncestors;
        nodes.forEach(function (node) {
            if (node.data.name === IDText) {
                document.documentElement.style.setProperty('--highlightColorClick', nodeColors(node.data.group));

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
                document.documentElement.style.setProperty('--highlightColorHover', nodeColors(node.data.group));
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
                    return { ...obj, on: 'on' };
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

    function renderChart({ activeNodes, activeLinks }) {
        simulation.current = d3
            .forceSimulation()
            .force('charge', d3.forceManyBody().strength(-1000))
            .force(
                'link',
                d3
                    .forceLink()
                    .id((d) => d.id)
                    .distance(200)
            )
            .force('x', d3.forceX())
            .force('y', d3.forceY());

        let newZoomValues = [0.25, 1];
        setZoomValues(newZoomValues);
        let zoom = d3.zoom().on('zoom', handleZoom).scaleExtent(newZoomValues);

        // Create the Canvas
        svg.current = d3
            .select(chartRef.current)
            .attr('width', width)
            .attr('height', height)
            .call(zoom)
            .attr('class', 'graphCanvas')
            .on('mouseover', function (e) {
                d3.select(this).attr('cursor', 'grab');
            });

        // We should use a function to render the nodes and links, so we can call it again when the nodes change.
        // TODO: Move this to a functions renderNode and renderLink
        let link = svg.current
            .append('g')
            .selectAll('line')
            .data(activeLinks, (d) => d)
            .enter()
            .append('line')
            .attr('stroke', '#999');

        let node = svg.current
            .append('g')
            .selectAll('circle')
            .data(activeNodes, (d) => d)
            .enter()
            .append('circle')
            .attr('r', (d) => nodeSizes(d.data.type))
            .call(drag(simulation))
            .on('click', handleNodeClick);

        //since the whole graph gets redrawn, the previous zoom position needs to be remembered and assigned to each node.
        d3.selectAll('svg g').attr('transform', zoomTransform);

        simulation.current.on('tick', () => {
            node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);

            link.attr('x1', (d) => d.source.x)
                .attr('y1', (d) => d.source.y)
                .attr('x2', (d) => d.target.x)
                .attr('y2', (d) => d.target.y);
        });

        simulation.current.nodes(nodes);

        // Allow fot updating nodes and links
        // as per https://observablehq.com/@d3/modifying-a-force-directed-graph?collection=@d3/d3-force
        return Object.assign(svg.current.node(), {
            update({ nodes, links }) {

                // The idea is to:
                // 1. Stop the simulation
                // 2. Update the nodes and links, using the old nodes and links as a starting point (so we can keep the old positions)
                // 3. Restart the simulation
                // 4. Render new nodes and links

                // Stop the simulation
                simulation.current.stop();

                // Map the old nodes and links to new nodes and links
                const old = new Map(node.data().map((d) => [d.index, d]));
                const newNodes = nodes.map((d) => Object.assign(old.get(d.index) || {}, d));
                const newLinks = links.map((d) => Object.assign({}, d));

                console.log('current nodes', node.data());
                console.log('mapped nodes', old);
                console.log('new mapped  nodes', newNodes);

                // Update and restart the simulation.
                simulation.current.nodes(newNodes);
                simulation.current.force('link').links(newLinks);
                simulation.current.restart();

                // Update the rendered nodes and links
                node = node
                    .data(newNodes, (d) => d.index)
                    .join((enter) =>
                        enter
                            .append('circle')
                            .attr('r', (d) => nodeSizes(d.data.type))
                            .call(drag(simulation))
                            .on('click', handleNodeClick)
                    );

                link = link.data(newLinks, (d) => `${d.source.indexd}\t${d.target.index}`).join((enter) => enter.append('line').attr('stroke', '#999'));
            },
        });
    }

    // const renderNode = (node) => {
    //     return node
    //         .append('g')
    //         .append('circle')
    //         .attr('r', (d) => nodeSizes(d.data.type))
    //         .attr('stroke', (d) => nodeColors(d.data.group))
    //         .attr('fill', '#fff')
    //         .attr('stroke-opacity', (d) => (d.data.on ? 0.6 : 0.1))
    //         .call(drag(simulation))
    //         .on('click', handleNodeClick);
    // };

    // const renderLink = (link) => {
    //     return link.append('line').attr('class', 'link').attr('stroke', '#999').attr('stroke-opacity', 0.6).attr('stroke-width', '1.5');
    // };

    function handleNodeClick(event, clickedNode) {
        //Set the node fill (currently not working)
        d3.select(this) //
            .attr('class', (d) => (d3.select(this).classed('isCliced') ? '' : 'isCliced'));

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

        document.querySelectorAll('.filterItem').forEach(function (filterItem) {
            filterItem.classList.remove('clicked');
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
            console.log('cannot expand leaf node!');
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

    // Zooming functionality
    function handleZoom(e) {
        setZoomTransform(e.transform);
        d3.selectAll('svg g').attr('transform', e.transform);

        setZoomAmount(e.transform.k);
    }

    const drag = (simulation) => {
        function dragstarted(event) {
            if (!event.active) simulation.current.alphaTarget(0.2).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.current.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3
            .drag()
            .on('start', (event, d) => dragstarted(event, d))
            .on('drag', (event, d) => dragged(event, d))
            .on('end', (event, d) => dragended(event, d));
    };

    function getSelectedNodesAndLinks() {
        // Create a new array of links and nodes, consisting only of nodes (and connecting links) where on:true.
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

        return { nodes: activeNodeArray, links: activeLinkArray };
    }

    useEffect(() => {
        // Initialize the graph
        chart.current = renderChart({ activeNodes: nodes, activeLinks: links });
    }, []);

    useEffect(() => {
        // Data changed. Should we update the graph, or should we update the nodes first which then triggers an update?
    }, [data]);

    useEffect(() => {
        // Update the graph
        chart.current.update(getSelectedNodesAndLinks());
    }, [nodes]);

    return (
        <div className="componentContainer">
            <Navigation className="navigationContainer" filterItems={nodes} findFilteredNode={findFilteredNode} hoverFilteredNode={hoverFilteredNode} />
            <Zoombar className="zoombar" zoomAmount={zoomAmount} zoomRange={zoomValues} />
            <InfoBox className="" nodeInfo={nodeInfo} />
            <svg ref={chartRef}></svg>
        </div>
    );
}

export default D3Chart;
