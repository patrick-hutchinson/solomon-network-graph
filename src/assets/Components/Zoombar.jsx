import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function Zoombar(props) {
  let scrubberAdvance = 0.3;
  if (props.scrubberNumber) {
    scrubberAdvance = props.scrubberNumber;
  }

  const myBarRef = useRef(null);
  const zoomValues = props.zoomRange;
  const scale = d3.scaleLinear().domain(d3.extent(zoomValues)).range([0, 100]);

  // Set Advance of Zoombar based on d3's zoom event.transform.k value
  useEffect(() => {
    myBarRef.current.style.width = scale(props.zoomAmount) + "%";
  }, [props.zoomAmount]);

  // Move the scrubber and determine a new advance value
  function handleScrubberDrag(e) {
    let scrubber = document.querySelector(".progress-scrubber");
    let scrubberWidth = scrubber.getBoundingClientRect().width;
    let progressContainerWidth = document.querySelector(".progress-container").getBoundingClientRect().width;

    let mouseX = e.clientX;

    scrubberAdvance = (mouseX - scrubberWidth / 2) / progressContainerWidth;
  }

  // Event listener function for mousemove event
  function handleMouseMove(e) {
    handleScrubberDrag(e);
    props.handleZoomScrubbing(scrubberAdvance);
  }

  return (
    <div className="progress-container">
      <div className="progressMarks">
        <div className="progress-bar" ref={myBarRef}>
          <div
            className="progress-scrubber"
            onMouseDown={() => {
              window.addEventListener("mousemove", handleMouseMove);
            }}
            onMouseUp={() => {
              window.removeEventListener("mousemove", handleMouseMove);
            }}
          ></div>
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
