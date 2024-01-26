import React from "react";

export default function Navigation(props) {
  // Might have to use a copy of the filterItems here

  let companyFilterItemArray = [];
  let sectorFilterItemsArray = [];

  let isOnMobile = window.innerWidth < 600;

  let isOnTablet = window.matchMedia(
    "(min-device-width: 601px) and (max-device-width: 1080px) and (-webkit-min-device-pixel-ratio: 1)"
  ).matches;

  let isOnDesktop = !isOnMobile && !isOnTablet;

  // Add the Path Navigation
  let nodePathItems = props.nodePath
    //skip the connectors
    .filter((nodePathItem) => nodePathItem.data && nodePathItem.data.name && nodePathItem.data.name.trim() !== "") // Check if data and data.name are defined
    .filter((nodePathItem) => props.nodePath.length > 1 && nodePathItem.depth !== 0)
    .map((nodePathItem) => (
      <li className="filterItem" key={nodePathItem.data.name}>
        {nodePathItem.data.name} /
      </li>
    ));

  // Add "ΔΙΚΤΙΟ /" as the first item
  nodePathItems.unshift(
    <li className="filterItem" key="root">
      ΔΙΚΤΙΟ /
    </li>
  );

  // Reverse the order of items (excluding "ΔΙΚΤΙΟ /")
  nodePathItems = [nodePathItems[0], ...nodePathItems.slice(1).reverse()];

  // Add all "Sectors" as Filter Items
  // Add an "all" node to begin with
  sectorFilterItemsArray.push("Όλα");
  props.filterItems.forEach(function (filterItem) {
    // Add all sectors names to the sectorFilterItemsArray, avoiding duplicates, null and undefined
    if (
      !sectorFilterItemsArray.includes(filterItem.data.sector) &&
      filterItem.data.sector !== "null" &&
      filterItem.data.sector !== undefined
    ) {
      sectorFilterItemsArray.push(filterItem.data.sector);
    }
  });
  let sectorFilterItems = sectorFilterItemsArray.map((item, index) => (
    <li
      className="sectorFilter"
      key={item}
      onClick={() => {
        props.findFilteredSectorNode(item, sectorFilterItemsArray);
      }}
    >
      {item
        .split(" ")
        .map((word) => (word.toUpperCase() === "MME" ? word : word.charAt(0) + word.slice(1).toLowerCase()))
        .join(" ")}{" "}
      {index !== sectorFilterItemsArray.length - 1 && isOnDesktop && <span className="dividerLine">|</span>}
    </li>
  ));

  // Add all "Companies" as Filter Items
  props.filterItems.forEach(function (filterItem) {
    if (filterItem.data.type === "company") {
      companyFilterItemArray.push(filterItem.data.name);
    }
  });
  let companyFilterItems = companyFilterItemArray.map((item, index) => (
    <li
      className="filterItem"
      key={item}
      onClick={() => props.findFilteredNode(item)}
      onMouseEnter={() => props.hoverFilteredNode(item)}
    >
      {item} {index !== companyFilterItemArray.length - 1 && isOnDesktop && <span className="dividerLine">|</span>}
    </li>
  ));

  //
  // Highlight current filter item on hover
  let filterMenuItems = document.querySelectorAll(".filterItem");

  filterMenuItems.forEach(function (filterItem, filterItemIndex, filterItemArray) {
    filterItem.addEventListener("mouseenter", function () {
      filterItem.classList.add("hovered");
    });
    filterItem.addEventListener("mouseleave", function () {
      filterItem.classList.remove("hovered");
    });
  });

  return (
    <div className="navigationContainer">
      <ul className="nodePath">{nodePathItems}</ul>
      {isOnMobile ||
        (isOnTablet && (
          <h4 className="dropdownButton sectors">
            ΦΙΛΤΡΑ
            <svg className="dropdownIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
              <path d="M24 22h-24l12-20z" />
            </svg>
          </h4>
        ))}
      <ul className="sectorFilters">{sectorFilterItems}</ul>
      {isOnMobile ||
        (isOnTablet && (
          <h4 className="dropdownButton groups">
            ΟΜΙΛΟI
            <svg className="dropdownIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
              <path d="M24 22h-24l12-20z" />
            </svg>
          </h4>
        ))}
      <ul className="companyFilters">{companyFilterItems}</ul>
    </div>
  );
}
