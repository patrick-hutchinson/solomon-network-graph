import React from "react";
import * as d3 from "d3";

export default function InfoBox(props) {
  let nodeDescription;
  let nodeDate;

  let shareholderDivs = null;

  let descrContainsShareholders = false;
  let containsSector = false;

  if (Array.isArray(props.nodeInfo.shareholders)) {
    descrContainsShareholders = true;
    shareholderDivs = props.nodeInfo.shareholders.map((shareholderItem) => (
      <div key={shareholderItem.shareholder}>
        <br />
        <h4 className="shareholder">{shareholderItem.shareholder}:</h4>
        <h4 className="percentage"> {shareholderItem.percentage}</h4>
      </div>
    ));

    console.log(shareholderDivs);
  } else {
    descrContainsShareholders = false;
  }

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
        <h5 className="infoSector">
          {props.nodeInfo.sector ? "Sector:" : ""} {props.nodeInfo.sector}
        </h5>
        <p className="infoText" dangerouslySetInnerHTML={nodeDescription} />
        <br />
        <div className="shareholderContainer">
          <h4 className="shareholderTitle">{descrContainsShareholders ? "ΜΕΤΟΧΟΙ" : ""}</h4>
          <div className="shareholders">{shareholderDivs}</div>
        </div>
      </div>
    </>
  );
}
