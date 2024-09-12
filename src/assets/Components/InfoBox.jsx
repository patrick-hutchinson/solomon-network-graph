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
  } else {
    descrContainsShareholders = false;
  }

  if (props.nodeInfo.description === "") {
    nodeDescription = { __html: "" };
  } else {
    nodeDescription = { __html: props.nodeInfo.description };
  }

  if (props.nodeInfo.date === "") {
    nodeDate = { __html: "Όχι Ημερομηνία" };
  } else {
    nodeDate = { __html: props.nodeInfo.date };
  }

  function handleClick() {
    document.querySelector(".infoContainer").classList.add("hidden");
    document.querySelector(".componentContainer").classList.add("hiddenInfo");
    document.querySelector(".showInfo").classList.remove("hidden");
  }

  return (
    <>
      <div className="infoContainer">
        <div className="closeInfoContainer" onClick={handleClick}>
          X
        </div>
        <h5 className="infoDate" dangerouslySetInnerHTML={nodeDate}></h5>
        <h1 className="infoTitle">{props.nodeInfo.title}</h1>
        <h5 className="infoSector">
          {props.nodeInfo.sector ? "Sector:" : ""} {props.nodeInfo.sector}
        </h5>
        <p className="relatedTo">
          {props.nodeInfo.relationships
            ? props.nodeInfo.relationships.map((relationship, index) => (
                <span key={index}>
                  <span className="relatedToArrow">… </span>
                  {props.nodeInfo.title + " is the " + relationship.relation + " of " + relationship.relatedTo}
                  <br />
                </span>
              ))
            : null}
        </p>

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
