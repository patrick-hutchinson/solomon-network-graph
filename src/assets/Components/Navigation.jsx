import React from "react";

export default function Navigation(props) {
  // Might have to use a copy of the filterItems here
  let [filterItems, setFilterItems] = React.useState(props.filterItems);

  let personFilterItemArray = [];
  let companyFilterItemArray = [];

  // Fills the ul tag with all "person"s contained in data.json
  filterItems.forEach(function (filterItem) {
    if (filterItem.data.type === "person") {
      personFilterItemArray.push(filterItem.data.name);
    }
  });
  let personFilterItems = personFilterItemArray.map((item) => (
    <li
      className="filterItem"
      key={item}
      onClick={() => props.findFilteredNode(item)}
      onMouseEnter={() => props.hoverFilteredNode(item)}
    >
      {item} /
    </li>
  ));

  // Add companies in a separate row
  filterItems.forEach(function (filterItem) {
    if (filterItem.data.type === "company") {
      companyFilterItemArray.push(filterItem.data.name);
    }
  });

  let companyFilterItems = companyFilterItemArray.map((item) => (
    <li
      className="filterItem"
      key={item}
      onClick={() => props.findFilteredNode(item)}
      onMouseEnter={() => props.hoverFilteredNode(item)}
    >
      {item} |
    </li>
  ));

  // Highlight current filter item on hover
  let filterMenuItems = document.querySelectorAll(".filterItem");

  filterMenuItems.forEach(function (filterItem, filterItemIndex, filterItemArray) {
    filterItem.addEventListener("click", function () {
      if (filterItem === event.target) {
        filterItem.classList.add("clicked");
      }
      filterItemArray.forEach(function (altFilter) {
        if (altFilter !== event.target) {
          altFilter.classList.remove("clicked");
        }
      });
    });
    filterItem.addEventListener("mouseenter", function () {
      filterItem.classList.add("hovered");
    });
    filterItem.addEventListener("mouseleave", function () {
      filterItem.classList.remove("hovered");
    });
  });

  return (
    <div className="navigationContainer">
      <ul className="personFilters">{personFilterItems}</ul>
      <ul className="companyFilters">{companyFilterItems}</ul>
    </div>
  );
}
