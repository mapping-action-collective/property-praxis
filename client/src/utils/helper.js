import queryString from "query-string"

//logic to render mobile properly
export function setDocHeightOnWindow() {
  function setDocHeight() {
    document.documentElement.style.setProperty(
      "--vh",
      `${window.innerHeight / 100}px`
    )
  }
  window.addEventListener("resize", function () {
    setDocHeight()
  })
  window.addEventListener("orientationchange", function () {
    setDocHeight()
  })

  setDocHeight()
}

export function capitalizeFirstLetter(string) {
  if ((string === null) | (string === undefined)) return null
  const lowerString = string.toLowerCase()
  const strArray = lowerString.split(" ")
  const capitalizedStrArray = strArray.map((val) => {
    return val.charAt(0).toUpperCase() + val.slice(1)
  })

  return capitalizedStrArray.join(" ")
}

export function createAddressString({ propno, propdir, propstr }) {
  const addressString = `${propno.toString().trim()} ${
    propdir !== "0" && propdir !== null && propdir !== "null"
      ? propdir.trim()
      : ""
  } ${propstr}`

  return capitalizeFirstLetter(addressString).replace(/ {2}/g, " ")
}

export function parseMBAddressString(addressString) {
  const strAddress = addressString.split(",")
  return strAddress[0].trim()
}

export function createFilterFromParams(params) {
  let layerFilter = []

  if (params.ownid) {
    layerFilter = [...layerFilter, ["==", "own_id", params.ownid.toUpperCase()]]
  }
  if (params.code) {
    layerFilter = [...layerFilter, ["==", "zipcode_sj", params.code]]
  }
  if (layerFilter.length > 0) {
    return ["all", ...layerFilter]
  } else {
    return ["none"]
  }
}

export function createLayerFilter(arr) {
  let layerFilter = []

  const fullFilter = arr.map((item) => {
    if (item === "10-20") {
      return [...layerFilter, ...[["==", "own_group", 1]]]
    }
    if (item === "100") {
      return [...layerFilter, ...[["==", "own_group", 2]]]
    }
    if (item === "200") {
      return [...layerFilter, ...[["==", "own_group", 3]]]
    }
    if (item === "500") {
      return [...layerFilter, ...[["==", "own_group", 4]]]
    }
    if (item === "1000") {
      return [...layerFilter, ...[["==", "own_group", 5]]]
    }
    if (item === "1500") {
      return [...layerFilter, ...[["==", "own_group", 6]]]
    }
    if (item === "2000") {
      return [...layerFilter, ...[["==", "own_group", 7]]]
    }
    return null
  })

  return ["none", ...fullFilter.flat(1)]
}

export function createDateString() {
  return new Date().toDateString().replace(/ /g, "_")
}

export function addUnderscoreToString(val) {
  return val.replace(/ /g, "_")
}

export function getYearString() {
  return new Date().getFullYear()
}

export function sanitizeSearchResult({ result, year }) {
  // result return sanitized result object
  const keys = Object.keys(result)
  if (keys.includes("propzip")) {
    const zipcodeQuery = {
      type: "zipcode",
      code: result.propzip,
      coordinates: null,
      year,
    }
    return zipcodeQuery
  } else if (keys.includes("own_id")) {
    const speculatorQuery = {
      type: "speculator",
      ownid: capitalizeFirstLetter(result.own_id),
      coordinates: null,
      year,
    }
    return speculatorQuery
  } else if (keys.includes("place_name")) {
    const [longitude, latitude] = result.geometry.coordinates
    const encodedCoords = encodeURI(JSON.stringify({ longitude, latitude }))
    const addressQuery = {
      type: "address",
      place: result.place_name,
      coordinates: encodedCoords,
      year,
    }

    return addressQuery
  } else {
    console.error(
      `Known key does not exist in object: ${JSON.stringify(result)}`
    )
  }
}

export function createQueryStringFromSearch({
  type,
  search,
  coordinates,
  year,
}) {
  let parsedSearch
  if (type === "address") {
    parsedSearch = parseMBAddressString(search)
  } else {
    parsedSearch = search
  }

  const query = `/map?${queryString.stringify(
    { type, search: parsedSearch, coordinates, year },
    { sort: false, skipNull: true }
  )}`

  return query
}

export function createQueryStringFromParams(
  { type, ownid = null, code = null, place = null, coordinates = null, year },
  route
) {
  let qs
  switch (type) {
    case "address":
      qs = `${route}?${queryString.stringify(
        { type, place, coordinates, year },
        { sort: false, skipNull: true }
      )}`
      break
    case "zipcode":
      qs = `${route}?${queryString.stringify(
        { type, code, year, ownid },
        { sort: false, skipNull: true }
      )}`
      break
    case "speculator":
      qs = `${route}?${queryString.stringify(
        { type, ownid, code, year },
        { sort: false, skipNull: true }
      )}`
      break
    default:
      qs = null
      console.error(`Unkown API search type: ${type}`)
      break
  }

  return qs
}

export function createResultFromParams({ type, code, ownid, place }) {
  let searchResult
  switch (type) {
    case "address":
      searchResult = place
      break
    case "zipcode":
      searchResult = code
      break
    case "speculator":
      searchResult = ownid
      break
    default:
      searchResult = null
      console.error(`Unkown type to create search params: ${type}`)
      break
  }
  return searchResult
}

export function flattenPrimaryResults(primaryResults) {
  return primaryResults.reduce((acc, val) => acc.concat(val), [])
}

// Hacking this a bit to handle different response types
export function getDetailsFromGeoJSON(geojson) {
  if (geojson?.type === "FeatureCollection" && geojson?.features?.length > 0) {
    const details = geojson.features.map((feature) => {
      const { centroid, properties } = feature
      return { centroid, properties }
    })
    return {
      details,
      detailsZip: geojson.zipcode || details[0].properties.propzip,
      detailsCount: geojson.count || details.length,
      detailsType: geojson.praxisDataType,
    }
  } else if (
    geojson?.praxisDataType === "parcels-by-geocode:multiple-parcels"
  ) {
    return {
      details: [],
      detailsZip: geojson.code,
      detailsCount: +geojson.count,
      detailsType: geojson.praxisDataType,
    }
  } else if (geojson?.praxisDataType) {
    return {
      details: [],
      detailsZip: geojson.code || null,
      detailsCount: geojson.count,
      detailsType: geojson.praxisDataType,
    }
  } else {
    return {
      details: null,
      detailsZip: null,
      detailsCount: null,
      detailsType: null,
    }
  }
}

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function availablePraxisYears(praxisYears, currentYear) {
  if (praxisYears && currentYear) {
    return praxisYears.filter((year) => {
      if (year === "null" || year === null || year === currentYear) {
        return false
      } else {
        return true
      }
    })
  } else {
    return null
  }
}

export function parseCentroidString(centroid, encode = false) {
  if (centroid !== "POINT EMPTY") {
    const [longitude, latitude] = centroid
      .split(" ")
      .map((item) => item.replace(/[POINT(, )]/gi, ""))
    if (encode) {
      return JSON.stringify({
        longitude: Number(longitude),
        latitude: Number(latitude),
      })
    } else {
      return { longitude: Number(longitude), latitude: Number(latitude) }
    }
  } else {
    return null
  }
}

export function paginator(arr, pageNumber, itemsPerPage) {
  pageNumber = Number(pageNumber)
  itemsPerPage = Number(itemsPerPage)
  pageNumber = pageNumber < 1 || isNaN(pageNumber) ? 1 : pageNumber
  itemsPerPage = itemsPerPage < 1 || isNaN(itemsPerPage) ? 1 : itemsPerPage

  let start = (pageNumber - 1) * itemsPerPage
  let end = start + itemsPerPage
  let loopCount = 0
  let result = {
    pageData: [],
    end: false,
  }

  for (loopCount = start; loopCount < end; loopCount++) {
    arr[loopCount] && result.pageData.push(arr[loopCount])
  }

  if ((loopCount === arr.length) | (loopCount > arr.length)) {
    result.end = true
  }
  return result
}
