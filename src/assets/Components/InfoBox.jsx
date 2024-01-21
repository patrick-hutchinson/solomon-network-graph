import React from "react";
import * as d3 from "d3";

export default function InfoBox(props) {
  let nodeDescription;
  let nodeDate;

  if (props.nodeInfo.description === "") {
    nodeDescription = { __html: "Προς το παρόν δεν υπάρχουν διαθέσιμες πληροφορίες." };
  } else {
    nodeDescription = { __html: props.nodeInfo.description };
  }

  if (props.nodeInfo.date === "") {
    nodeDate = { __html: "Όχι Ημερομηνία" };
  } else {
    nodeDate = { __html: props.nodeInfo.date };
  }

  return (
    <>
      <div className="infoContainer">
        <div className="closeInfoContainer">[X]</div>
        <h5 className="infoDate" dangerouslySetInnerHTML={nodeDate}></h5>

        <h1 className="infoTitle">{props.nodeInfo.title}</h1>
        <h5 className="infoSector">Sector: {props.nodeInfo.sector}</h5>
        <p className="infoText" dangerouslySetInnerHTML={nodeDescription} />
      </div>
    </>
  );
}
