import React, { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { withRouter } from "../../utils/router"
import { CSSTransition } from "react-transition-group"
import queryString from "query-string"
import {
  handleAllTotalsQuery,
  updateDetailedSearch,
} from "../../actions/search"
import { getDetailsFromGeoJSON } from "../../utils/helper"
import DetailedSearchResults from "./DetailedSearchResults"
import { DEFAULT_YEAR } from "../../utils/constants"

function useQueryParams(props) {
  const { searchQuery } = props

  const [queryParams, setQueryParams] = useState(null)
  useEffect(() => {
    const params = queryString.parse(searchQuery)
    setQueryParams(params)
    return () => null
  }, [searchQuery])

  return queryParams
}

function DetailedResultsContainer() {
  const { ppraxis } = useSelector((state) => state.mapData)
  const { drawerIsOpen, resultsType } = useSelector(
    (state) => state.searchState.detailedSearch
  )
  const { totalSpeculators } = useSelector(
    (state) => state.searchState.allTotals
  )
  const { details, detailsCount, detailsZip, detailsType } =
    getDetailsFromGeoJSON(ppraxis)
  const dispatch = useDispatch()

  const queryParams = useQueryParams({ searchQuery: window.location.search })
  useEffect(() => {
    if (!resultsType && !totalSpeculators) {
      dispatch(handleAllTotalsQuery(queryParams?.year || DEFAULT_YEAR))
    } else {
      dispatch(
        updateDetailedSearch({
          results: details,
          resultsZip: detailsZip,
          resultsCount: detailsCount,
          resultsType: detailsType,
        })
      )
    }
  }, [JSON.stringify(details), detailsZip, detailsCount, detailsType])

  if (resultsType || totalSpeculators) {
    return (
      <CSSTransition
        in={drawerIsOpen} //set false on load
        appear={true}
        timeout={400}
        classNames="results-drawer"
        onEntered={() =>
          dispatch(
            updateDetailedSearch({
              contentIsVisible: true,
            })
          )
        }
        onExit={() =>
          dispatch(
            updateDetailedSearch({
              contentIsVisible: false,
            })
          )
        }
      >
        <DetailedSearchResults
          detailsType={!resultsType ? null : detailsType}
          queryParams={queryParams}
        />
      </CSSTransition>
    )
  }
  return null
}

export default withRouter(DetailedResultsContainer)
