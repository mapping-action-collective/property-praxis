// import {
//   parcelStop1,
//   parcelStop2,
//   parcelStop3,
//   parcelStop4,
//   parcelStop5,
//   parcelStop6,
//   parcelStop7,
// } from "../../utils/colors"

//this is where specific mapstyles will go for layers.

// const stops = [
//   [1, parcelStop1],
//   [2, parcelStop2],
//   [3, parcelStop3],
//   [4, parcelStop4],
//   [5, parcelStop5],
//   [6, parcelStop6],
//   [7, parcelStop7],
// ]

// const stops = [
//   [1, "#f6d2a9;"],
//   [2, "#f5b78e"],
//   [3, "#f19c7c"],
//   [4, "#ea8171"],
//   [5, "#dd686c"],
//   [6, "#ca5268"],
//   [7, "#b13f64"],
// ];

export const parcelLayer = {
  id: "parcel-polygon",
  "source-layer": "parcels",
  type: "fill",
  minzoom: 13,
  buffer: 0,
  tolerance: 0.9,
}

export const parcelHighlightLayer = {
  id: "highlight-parcel-polygon",
  type: "fill",
  "source-layer": "parcels",
  // minzoom: 13,
  buffer: 0,
  tolerance: 0.9,
  paint: {
    "fill-color": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      "rgba(0,0,0,0.4)",
      "rgba(0,0,0,0)",
    ],
    "fill-outline-color": "rgba(0,0,0,1)",
  },
}

export const parcelCentroid = {
  id: "parcel-centroid",
  type: "circle",
  "source-layer": "parcels",
  maxzoom: 13,
  buffer: 0,
  tolerance: 0.9,
}

// export const parcelCentroidHighlightLayer = {
//   id: "highlight-parcel-centroid",
//   type: "fill",
//   maxzoom: 13,
//   buffer: 0,
//   tolerance: 0.9,
// };

export const zipsLayer = {
  id: "zips",
  type: "line",
  paint: {
    "line-width": 3,
    "line-dasharray": [3, 3],
    "line-color": "white",
  },
}

export const zipsLabel = {
  id: "zips-label",
  type: "symbol",
  layout: {
    "text-field": ["get", "zipcode"],
    "text-anchor": "center",
    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
    "text-justify": "auto",
  },
  paint: {
    "text-halo-color": "white",
    "text-halo-width": 1,
  },
}
