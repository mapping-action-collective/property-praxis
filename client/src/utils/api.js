import queryString from "query-string"
import store from "../reducers"
import { triggerFetchError } from "../actions/redirect"
import { toggleLoadingIndicatorAction } from "../actions/mapState"

function triggerError(msg) {
  store.dispatch(triggerFetchError(true, msg))
  store.dispatch(toggleLoadingIndicatorAction(false))
  console.error(msg)
}

export async function APIQueryStringFromSearchParams(
  { searchType, searchTerm, searchCoordinates = null, searchYear },
  route
) {
  try {
    if (searchTerm === "" || searchType === null) {
      return []
    }
    let qs
    switch (searchType) {
      case "address":
        qs = `${route}?${queryString.stringify(
          {
            type: searchType,
            place: searchTerm,
            coordinates: searchCoordinates,
            year: searchYear,
          },
          { sort: false, skipNull: true }
        )}`
        break
      case "zipcode":
        qs = `${route}?${queryString.stringify(
          { type: searchType, code: searchTerm, year: searchYear },
          { sort: false, skipNull: true }
        )}`
        break
      case "speculator":
        qs = `${route}?${queryString.stringify(
          { type: searchType, ownid: searchTerm, year: searchYear },
          { sort: false, skipNull: true }
        )}`
        break
      default:
        console.error(
          `Search failed. Unknown API search param type: ${searchType}`
        )
        qs = null
        break
    }

    const response = await fetch(qs)
    return await response.json()
  } catch (err) {
    const msg = `An error occured querying API from params: ${err.message}`
    triggerError(msg)
  }
}

export async function APISearchQueryFromRoute(route) {
  if (route === null) return

  try {
    const respose = await fetch(route)
    const json = await respose.json()
    return json
  } catch (err) {
    console.log("err", err)
    const msg = `An error occurred querying API from route: ${err.message}`
    triggerError(msg)
  }
}

export function isGeoJSONEmpty(geojson) {
  if (geojson && geojson.features.length === 0) {
    return true
  } else {
    return false
  }
}
