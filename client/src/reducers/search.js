import {
  UPDATE_VIEWER_POSITION,
  UPDATE_GENERAL_SEARCH,
  UPDATE_SEARCH_PARAMS,
  UPDATE_PRIMARY_SEARCH,
  UPDATE_DETAILED_SEARCH,
  UPDATE_SEARCH_BAR,
} from "../actions/search"
import { DEFAULT_YEAR } from "../utils/constants"

const initialSearchState = {
  searchBar: {
    searchYears: null,
  },
  searchParams: {
    searchType: "all",
    searchYear: DEFAULT_YEAR,
    searchTerm: "",
    searchCoordinates: null,
  },
  primarySearch: { results: null, index: -1, isOpen: false, isActive: false },
  detailedSearch: {
    results: null,
    drawerIsOpen: false,
    contentIsVisible: false,
    resultsZip: null,
    resultsCount: null,
    resultsType: null,
    recordYears: null,
  },
  downloadData: null,
  viewerCoords: {
    lat: null,
    lng: null,
    bearing: null,
  },
}

export default function searchState(state = initialSearchState, action) {
  switch (action.type) {
    case UPDATE_VIEWER_POSITION:
      return {
        ...state,
        viewerCoords: { ...state.viewerCoords, ...action.payload },
      }
    case UPDATE_GENERAL_SEARCH:
      return { ...state, ...action.payload }
    case UPDATE_SEARCH_BAR:
      return { ...state, searchBar: { ...state.searchBar, ...action.payload } }
    case UPDATE_SEARCH_PARAMS:
      return {
        ...state,
        searchParams: {
          ...state.searchParams,
          ...action.payload,
          searchYear:
            action.payload.searchYear ||
            state.searchParams.searchYear ||
            DEFAULT_YEAR,
        },
      }
    case UPDATE_PRIMARY_SEARCH:
      return {
        ...state,
        primarySearch: { ...state.primarySearch, ...action.payload },
      }
    case UPDATE_DETAILED_SEARCH:
      return {
        ...state,
        detailedSearch: { ...state.detailedSearch, ...action.payload },
      }
    default:
      return state
  }
}

// viewer: {
//   bearing: null,
//   key: null,
//   viewerMarker: null,
// },
