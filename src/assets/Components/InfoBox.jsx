import React from "react";
import * as d3 from "d3";

// We are not receiving props yet, so this wont work
export default function InfoBox(props) {
  let nodeDescription;
  if (props.nodeInfo.description === "") {
    nodeDescription = { __html: "No information currently available." };
  } else {
    nodeDescription = { __html: props.nodeInfo.description };
  }

  return (
    <>
      <div className="infoContainer">
        <h1 className="infoTitle">{props.nodeInfo.title}</h1>
        <h4>{props.nodeInfo.date}</h4>
        <p dangerouslySetInnerHTML={nodeDescription} />
      </div>
    </>
  );
}
