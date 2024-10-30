import queryString from "query-string"

export function URLParamsToSearchParams(searchQuery) {
  const {
    type: searchType = null,
    code = null,
    ownid = null,
    place = null,
    coordinates: searchCoordinates = null,
    year: searchYear = null,
  } = queryString.parse(searchQuery)

  let searchTerm

  // this assumes that there can only be one search term
  switch (searchType) {
    case "zipcode":
      searchTerm = code
      break
    case "speculator":
      searchTerm = ownid
      break
    case "address":
      searchTerm = place
      break
  }

  return {
    searchType,
    searchTerm,
    searchCoordinates,
    searchYear,
  }
}

export function URLParamsToAPIQueryString(searchQuery, layer) {
  const {
    type = null,
    ownid = null,
    code = null,
    place = null,
    year = null,
    coordinates = null,
  } = queryString.parse(searchQuery)

  const route = "/api/geojson"
  let qs

  if (layer === "parcels") {
    switch (type) {
      case "zipcode":
        if (code && ownid && year) {
          qs = `${route}?${queryString.stringify(
            { type: "parcels-by-code-speculator", ownid, code, year },
            { sort: false, skipNull: true }
          )}`
          break
        } else if (code && year) {
          qs = `${route}?${queryString.stringify(
            { type: "parcels-by-code", code, year },
            { sort: false, skipNull: true }
          )}`
          break
        } else {
          qs = null
          break
        }
      case "speculator":
        if (ownid && code && year) {
          qs = `${route}?${queryString.stringify(
            { type: "parcels-by-speculator-code", ownid, code, year },
            { sort: false, skipNull: true }
          )}`
          break
        } else if (ownid && year) {
          qs = `${route}?${queryString.stringify(
            { type: "parcels-by-speculator", ownid, year },
            { sort: false, skipNull: true }
          )}`
          break
        } else {
          qs = null
          break
        }

      case "address":
        if (place && coordinates && year) {
          qs = `${route}?${queryString.stringify(
            { type: "parcels-by-geocode", place, coordinates, year },
            { sort: false, skipNull: true }
          )}`
          break
        } else {
          qs = null
          break
        }
      default:
        qs = null
        break
    }
  } else if (layer === "zipcode") {
    switch (type) {
      case "zipcode":
        if (code && ownid && year) {
          qs = `${route}?${queryString.stringify(
            { type: "zipcode-intersect", ownid, year },
            { sort: false, skipNull: true }
          )}`

          break
        } else if (code && year) {
          qs = `${route}?${queryString.stringify(
            { type: "zipcode-intersect", code, year },
            { sort: false, skipNull: true }
          )}`

          break
        } else {
          qs = null
          break
        }
      case "speculator":
        if (ownid && code && year) {
          qs = `${route}?${queryString.stringify(
            { type: "zipcode-intersect", ownid, code, year },
            { sort: false, skipNull: true }
          )}`

          break
        } else if (ownid && year) {
          qs = `${route}?${queryString.stringify(
            { type: "zipcode-intersect", ownid, year },
            { sort: false, skipNull: true }
          )}`

          break
        } else {
          qs = null
          break
        }

      case "address":
        if (place && coordinates && year) {
          qs = `${route}?${queryString.stringify(
            { type: "zipcode-intersect", place, coordinates, year },
            { sort: false, skipNull: true }
          )}`

          break
        } else {
          qs = null
          break
        }
      default:
        qs = null
        break
    }
  }
  return qs
}
