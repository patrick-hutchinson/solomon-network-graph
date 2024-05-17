import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function Zoombar(props) {
  let scrubberAdvance = 0.3;
  if (props.scrubberNumber) {
    scrubberAdvance = props.scrubberNumber;
  }

  const myBarRef = useRef(null);
  const zoomValues = props.zoomRange;
  const scale = d3.scaleLinear().range([0, 100]);

  // Set Advance of Zoombar based on d3's zoom event.transform.k value
  useEffect(() => {
    myBarRef.current.style.width = scale(props.zoomAmount) + "%";
  }, [props.zoomAmount, scale]);

  // Move the scrubber and determine a new advance value
  function handleScrubberDrag(e) {
    let scrubber = document.querySelector(".progress-scrubber");
    let scrubberWidth = scrubber.getBoundingClientRect().width;
    let progressContainerWidth = document.querySelector(".progress-container").getBoundingClientRect().width;

    let mouseX = e.clientX;

    scrubberAdvance = (mouseX - scrubberWidth / 2) / progressContainerWidth;
  }

  // Event listener function for mousemove and touchmove events
  function handleMove(e) {
    e.preventDefault(); // Prevent scrolling on touch
    let event = e.type === "mousemove" ? e : e.touches[0];
    handleScrubberDrag(event);
    props.handleZoomScrubbing(scrubberAdvance);
  }

  // Function to add mousemove and mouseup listeners for mouse events
  function handleMouseDown() {
    console.log("clicked the scrubber");
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  // Function to add touchmove and touchend listeners for touch events
  function handleTouchStart(e) {
    console.log("touched the scrubber");
    e.preventDefault(); // Prevent default touch behavior
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleTouchEnd);
  }

  // Function to remove mousemove and mouseup listeners for mouse events
  function handleMouseUp() {
    window.removeEventListener("mousemove", handleMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  // Function to remove touchmove and touchend listeners for touch events
  function handleTouchEnd() {
    window.removeEventListener("touchmove", handleMove);
    window.removeEventListener("touchend", handleTouchEnd);
  }

  return (
    <div className="progress-container">
      <div className="progressMarks">
        <div className="progress-bar" ref={myBarRef}>
          <div className="progress-scrubber" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}></div>
        </div>
        <span>10</span>
        <span>20</span>
        <span>30</span>
        <span>40</span>
        <span>50</span>
        <span>60</span>
        <span>70</span>
        <span>80</span>
        <span>90</span>
        <span>100</span>
      </div>
    </div>
  );
}
