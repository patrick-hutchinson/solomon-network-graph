import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function Zoombar(props) {
  //
  const myBarRef = useRef(null);
  useEffect(() => {
    const zoomValues = props.zoomRange;

    // Create a linear scale function, scaling from the zoomrange to 0-100
    const scale = d3.scaleLinear().domain(d3.extent(zoomValues)).range([0, 100]);

    myBarRef.current.style.width = scale(props.zoomAmount) + "%";
  }, [props.zoomAmount]);

  return (
    <div className="progress-container">
      <div className="progressMarks">
        <div className="progress-bar" ref={myBarRef}></div>
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
