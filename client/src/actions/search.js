import { triggerFetchError } from "./redirect"
import {
  APIQueryStringFromSearchParams,
  APISearchQueryFromRoute,
} from "../utils/api"
// import { getImageKey } from "../utils/viewer";
import { flattenPrimaryResults } from "../utils/helper"

export const UPDATE_GENERAL_SEARCH = "UPDATE_GENERAL_SEARCH" // general shortcut
export const UPDATE_SEARCH_PARAMS = "UPDATE_SEARCH_PARAMS"
export const UPDATE_PRIMARY_SEARCH = "UPDATE_PRIMARY_SEARCH"
export const UPDATE_DETAILED_SEARCH = "UPDATE_DETAILED_SEARCH"
export const UPDATE_SEARCH_BAR = "UPDATE_SEARCH_BAR"
export const UPDATE_VIEWER_POSITION = "UPDATE_VIEWER_POSITION"
export const GET_DOWNLOAD_DATA = "GET_DOWNLOAD_DATA"
export const UPDATE_ALL_TOTALS = "UPDATE_ALL_TOTALS"

/* General action to set search state
use this sparingly as the action
type is not explicit */
export function updateGeneralSearch(searchState) {
  return {
    type: UPDATE_GENERAL_SEARCH,
    payload: { ...searchState },
  }
}
export function updateSearchParams(searchParams) {
  return {
    type: UPDATE_SEARCH_PARAMS,
    payload: { ...searchParams },
  }
}
export function updatePrimarySearch(primarySearch) {
  return {
    type: UPDATE_PRIMARY_SEARCH,
    payload: { ...primarySearch },
  }
}
export function updateDetailedSearch(detailedSearch) {
  return {
    type: UPDATE_DETAILED_SEARCH,
    payload: { ...detailedSearch },
  }
}

function getViewerPosition(viewerCoords) {
  return {
    type: UPDATE_VIEWER_POSITION,
    payload: { ...viewerCoords },
  }
}

function updateAllTotals(allTotals) {
  return {
    type: UPDATE_ALL_TOTALS,
    payload: { ...allTotals },
  }
}

export function handlePrimarySearchQuery(
  { searchType, searchTerm, searchCoordinates, searchYear },
  route
) {
  return async (dispatch) => {
    try {
      const json = await APIQueryStringFromSearchParams(
        { searchType, searchTerm, searchCoordinates, searchYear },
        route
      )
      const flattendResults = flattenPrimaryResults(json)
      dispatch(updatePrimarySearch({ results: flattendResults }))
      return flattendResults
    } catch (err) {
      dispatch(triggerFetchError(true))
      console.error(`An error occured for primary search query: ${err}`)
    }
  }
}

export function handlePrimarySearchAll({ searchTerm, searchYear }, route) {
  return async (dispatch) => {
    try {
      const types = ["address", "speculator", "zipcode"]

      const [
        partialAddressResults,
        partialSpeculatorResults,
        partialZipcodeResults,
      ] = await Promise.all(
        types.map(async (searchType) => {
          return await APIQueryStringFromSearchParams(
            { searchType, searchTerm, searchYear },
            route
          )
        })
      )
      const flattendResults = flattenPrimaryResults([
        partialAddressResults,
        partialSpeculatorResults,
        partialZipcodeResults,
      ])

      dispatch(updatePrimarySearch({ results: flattendResults }))
    } catch (err) {
      dispatch(triggerFetchError(true))
      console.error(`An error occured searching all primaries. Message: ${err}`)
    }
  }
}

export function handleDetailedSearchQuery(
  { searchType, searchTerm, searchYear, searchCoordinates = null },
  route
) {
  return async (dispatch) => {
    try {
      const json = await APIQueryStringFromSearchParams(
        { searchType, searchTerm, searchCoordinates, searchYear },
        route
      )
      dispatch(updateDetailedSearch({ results: json }))
      return json
    } catch (err) {
      dispatch(triggerFetchError(true))
      console.error(`An error occured for detailed search. Message: ${err}`)
    }
  }
}

export function handleGetPraxisYearsAction(route) {
  return async (dispatch) => {
    try {
      dispatch(updateDetailedSearch({ recordYears: null }))
      const json = await APISearchQueryFromRoute(route)
      dispatch(updateDetailedSearch({ recordYears: json }))
      return json
    } catch (err) {
      dispatch(triggerFetchError(true))
      console.error(
        `An error occured searching search bar years.  Message: ${err}`
      )
    }
  }
}

export function handleGetViewerPosition(coords) {
  return async (dispatch) => {
    try {
      // const pos = await getImageKey(longitude, latitude);
      dispatch(getViewerPosition(null))
      dispatch(getViewerPosition(coords))
      // return pos;
    } catch (err) {
      // viewer image ui error
      // dispatch something here for error
      dispatch(triggerFetchError(true))
      console.error(
        `An error occured fetching viewer position. Message: ${err}`
      )
    }
  }
}

export function handleAllTotalsQuery(year) {
  return async (dispatch) => {
    try {
      const res = await APISearchQueryFromRoute(
        `/api/general?type=all-totals&year=${year}`
      )

      dispatch(
        updateAllTotals({
          timelineData: res.speculationByYear
            .map((rec) => ({
              ...rec,
              x: +rec.year,
              y: +rec.count,
            }))
            .sort((a, b) => a.year - b.year),
          topSpeculators: res.topSpeculators,
        })
      )
    } catch (err) {
      dispatch(triggerFetchError(true))
      console.error(
        `An error occured searching search bar years.  Message: ${err}`
      )
    }
  }
}
