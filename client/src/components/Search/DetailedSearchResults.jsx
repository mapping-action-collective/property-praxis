import React, { useState, useEffect, cloneElement } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useMediaQuery } from "react-responsive"
import { Link } from "react-router-dom"
import {
  handleGetPraxisYearsAction,
  updateDetailedSearch,
} from "../../actions/search"
import { setHighlightFeaturesAction } from "../../actions/currentFeature"
import {
  capitalizeFirstLetter,
  createQueryStringFromParams,
  parseMBAddressString,
  parseCentroidString,
  currencyFormatter,
  availablePraxisYears,
  paginator,
} from "../../utils/helper"
// import MapViewer from "./MapViewer";
import MapViewerV4 from "./MapViewerV4"
import TimeGraph from "./TimeGraph"
import infoIcon from "../../assets/img/info-icon.png"
import { APISearchQueryFromRoute } from "../../utils/api"
import mapMarkerRose from "../../assets/img/map_marker_rose.svg"
import mapMarkerPolygonRose from "../../assets/img/map_marker_polygon_rose.svg"
import questionMarkRose from "../../assets/img/question_mark_rose.svg"

// helper functions
const reducer = (accumulator, currentValue) =>
  Number(accumulator) + Number(currentValue)

// special function to help calculate percentage ownership
const calulateSumTotals = (data, arrLength = 10) => {
  const sumCount = data
    .slice(0, arrLength)
    .map((record) => record.count)
    .reduce(reducer)
  const sumPer = data
    .slice(0, arrLength)
    .map((record) => record.per)
    .reduce(reducer)
  return { sumCount, sumPer }
}

// custom hooks
function useSpeculationByCode(results, { code, year }) {
  const [data, setData] = useState(null)
  const [topCount, setTopCount] = useState(null)
  const [topPer, setTopPer] = useState(null)

  useEffect(() => {
    ;(async () => {
      if (code) {
        const route = `/api/detailed-search?type=speculation-by-code&code=${code}&year=${year}`
        const data = await APISearchQueryFromRoute(route)

        //get feature ids based on speculator name
        await data.map((item) => {
          const ids = results
            .map((record) => {
              if (record.properties.own_id === item.own_id) {
                return record.properties.prop_id
              } else {
                return null
              }
            })
            .filter((id) => id !== null)
          item.featureIds = ids
        })
        setData(data)

        const { sumCount, sumPer } = calulateSumTotals(data)
        setTopCount(sumCount)
        setTopPer(sumPer)
      }
    })()
    return () => null
  }, [code, year])
  return { data, topCount, topPer }
}

function useCodesBySpeculator({ ownid, year }) {
  const [speculatorData, setSpeculatorData] = useState(null)
  const [propCount, setPropCount] = useState(null)
  const [zipsBySpeculator, setZipsBySpeculator] = useState(null)

  const calulateSpeculatorTotals = (data) => {
    const propCount = data.map((record) => record.count).reduce(reducer)
    const speculatorZips = data.map((record) => record.propzip)
    return { propCount, speculatorZips }
  }

  useEffect(() => {
    ;(async () => {
      const route = `/api/detailed-search?type=codes-by-speculator&ownid=${ownid}&year=${year}`
      const data = await APISearchQueryFromRoute(route)
      setSpeculatorData(data)

      const { propCount, speculatorZips } = calulateSpeculatorTotals(data)
      setPropCount(propCount)
      setZipsBySpeculator(speculatorZips)
    })()
    return () => null
  }, [ownid, year])

  return { speculatorData, propCount, zipsBySpeculator }
}

/*Specific Link components to pass to  paginator component*/
function SpeculatorLink({ record, queryParams }) {
  const { code, year } = queryParams
  const dispatch = useDispatch()

  const highlightFeatures = (ids) => {
    dispatch(setHighlightFeaturesAction(ids))
  }
  const removeHighlightFeatures = () => {
    dispatch(setHighlightFeaturesAction([""]))
  }

  return (
    <div className="zipcode-item">
      <div>
        <Link
          onMouseOver={() => highlightFeatures(record.featureIds)}
          onMouseOut={() => removeHighlightFeatures()}
          onClick={() => removeHighlightFeatures()}
          to={createQueryStringFromParams(
            {
              type: "zipcode",
              code,
              ownid: record.own_id,
              coordinates: null,
              year,
            },
            "/map"
          )}
        >
          <span
            title={`Search ${capitalizeFirstLetter(
              record.own_id
            )}'s properties in ${code}.`}
          >
            <img src={infoIcon} alt="More Information"></img>
            {capitalizeFirstLetter(record.own_id)}
          </span>
        </Link>
      </div>
      <div>
        <div>{`${record.count}  properties`}</div>
        <div>{`${Math.round(record.per)}% ownership`}</div>
      </div>
    </div>
  )
}

function ZipcodeLink({ record, index, queryParams }) {
  const { ownid, year } = queryParams
  const dispatch = useDispatch()
  const highlightFeatures = (ids) => {
    dispatch(setHighlightFeaturesAction(ids))
  }
  const removeHighlightFeatures = () => {
    dispatch(setHighlightFeaturesAction([""]))
  }

  return (
    <div className="speculator-item" key={`${record.own_id}-${index}`}>
      <div>
        <Link
          onMouseOver={() => highlightFeatures(record.featureIds)}
          onMouseOut={() => removeHighlightFeatures()}
          onClick={() => removeHighlightFeatures()}
          to={createQueryStringFromParams(
            {
              type: "speculator",
              code: record.propzip,
              ownid,
              coordinates: null,
              year,
            },
            "/map"
          )}
        >
          <span
            title={`Seach ${capitalizeFirstLetter(ownid)}'s properties in ${
              record.propzip
            }`}
          >
            <img src={infoIcon} alt="More Information"></img>
            {capitalizeFirstLetter(record.propzip)}
          </span>
        </Link>
      </div>
      <div>
        <div>{`${record.count}  properties`}</div>
      </div>
    </div>
  )
}

function AddressLink({ index, record, queryParams }) {
  const { code, year } = queryParams
  const { centroid } = record
  const { propaddr, prop_id } = record.properties

  const dispatch = useDispatch()
  const highlightFeatures = (id) => {
    dispatch(setHighlightFeaturesAction(id))
  }
  const removeHighlightFeatures = () => {
    dispatch(setHighlightFeaturesAction([""]))
  }

  return (
    <div className="address-item" key={index}>
      <Link
        onMouseOver={() => highlightFeatures([prop_id])}
        onMouseOut={() => removeHighlightFeatures()}
        onClick={() => removeHighlightFeatures()}
        to={createQueryStringFromParams(
          {
            type: "address",
            place: `${propaddr}, ${code}`,
            coordinates: parseCentroidString(centroid, true),
            year,
          },
          "/map"
        )}
      >
        <span title={`Search details for ${capitalizeFirstLetter(propaddr)}.`}>
          <img src={infoIcon} alt="More Information"></img>
          {capitalizeFirstLetter(propaddr)}
        </span>
      </Link>
    </div>
  )
}

/* Dumb paginator component - this component assumes that 
data list will be short (less than 100) */
function DumbPaginator({ data, itemsPerPage = 10, queryParams, children }) {
  const [pageNo, setPage] = useState(1)
  const { pageData, end } = paginator(data, pageNo, itemsPerPage) //using paginate function

  if (pageData) {
    return (
      <div className="detailed-speculator">
        {pageData.map((record, index) => {
          return (
            <React.Fragment key={index}>
              {cloneElement(children, { record, index, queryParams })}
            </React.Fragment>
          )
        })}
        {data.length > itemsPerPage ? (
          <div className="page-controller">
            <div
              title="previous page"
              style={pageNo === 1 ? { visibility: "hidden" } : null}
              onClick={() => {
                setPage((prevPage) => prevPage - 1)
              }}
            >
              &#x276E;
            </div>

            <div>{`${pageNo} of ${Math.ceil(data.length / itemsPerPage)}`}</div>
            <div
              title="next page"
              style={end ? { visibility: "hidden" } : null}
              onClick={() => {
                setPage((prevPage) => prevPage + 1)
              }}
            >
              &#x276F;
            </div>
          </div>
        ) : null}
      </div>
    )
  }
  return null
}

/*Detailed result components need to know what the ppraxis 
  data properties, ids, and data return type (details type) are. 
  They also use internal state in most cases. */
function ContentSwitch({ detailsType, queryParams }) {
  const { results, resultsCount, resultsType } = useSelector(
    (state) => state.searchState.detailedSearch
  )

  // TODO: Don't worry as much about single vs multiple
  if (results && resultsCount > 0 && resultsType) {
    switch (detailsType) {
      case "parcels-by-geocode:single-parcel":
        return <SingleParcel result={results[0]} queryParams={queryParams} />

      case "parcels-by-geocode:multiple-parcels":
        return <MultipleParcels results={[]} queryParams={queryParams} />

      case "parcels-by-speculator":
        return <SpeculatorParcels results={results} queryParams={queryParams} />

      case "parcels-by-code":
        return <CodeParcels results={results} queryParams={queryParams} />

      case "parcels-by-code-speculator":
        return (
          <CodeSpeculatorParcels
            results={resultsType}
            queryParams={queryParams}
          />
        )

      case "parcels-by-speculator-code":
        return (
          <SpeculatorCodeParcels
            results={resultsType}
            queryParams={queryParams}
          />
        )

      default:
        return null
    }
  } else if (detailsType === "parcels-by-geocode:multiple-parcels") {
    return <MultipleParcels results={[]} queryParams={queryParams} />
  } else if (results && results.length === 0) {
    return <NoResults />
  } else {
    return <div>ERROR</div>
  }
}

function NoResults() {
  const { searchState } = useSelector((state) => state)
  const { drawerIsOpen } = searchState.detailedSearch

  return (
    <div className="results-inner">
      <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
        <div className="detailed-title">
          <img src={mapMarkerRose} alt="A map marker icon" />
          <span>No Results for this Search</span>
        </div>
        <div className="detailed-properties">
          <p>
            We were unable to locate any records for this search. Our records
            cover the City of Detroit.
          </p>
        </div>
      </div>
    </div>
  )
}

function CodeParcels(props) {
  const { code, year } = props.queryParams
  const { searchState } = useSelector((state) => state)
  const { drawerIsOpen, results } = searchState.detailedSearch
  const {
    data: zipData,
    topCount,
    topPer,
  } = useSpeculationByCode(results, {
    code,
    year,
  })

  if (zipData) {
    return (
      <div className="results-inner scroller">
        <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
          <div className="detailed-title">
            <img src={mapMarkerPolygonRose} alt="A map marker icon" />
            <span>Details for {code}</span>
          </div>
          <div className="detailed-properties">
            <p>
              There were a total of
              <span>{` ${zipData[0].total} properties `}</span> owned by
              <span>{` ${zipData.length} speculators `}</span>
              in <span>{code} </span> for the year
              <span>{` ${year}`}</span>. The top 10 speculators owned
              <span>{` ${topCount} `}</span>or
              <span>{` ${Math.round(topPer)}% `}</span>
              of the speculative properties we have on record for this zip code.
            </p>
          </div>
          <div className="detailed-title">
            <img src={questionMarkRose} alt="A question mark icon" />
            <span>Top 10 Speculators</span>
          </div>
          <div className="detailed-zipcode">
            {zipData.slice(0, 10).map((record, index) => {
              return (
                <SpeculatorLink
                  key={`${record.own_id}-${index}`}
                  record={record}
                  queryParams={props.queryParams}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  return null
}

function SpeculatorParcels(props) {
  const { ownid, year } = props.queryParams

  const { drawerIsOpen } = useSelector(
    (state) => state.searchState.detailedSearch
  )

  const { speculatorData, propCount, zipsBySpeculator } = useCodesBySpeculator({
    ownid,
    year,
  })

  if (speculatorData && zipsBySpeculator) {
    return (
      <div className="results-inner scroller">
        <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
          <div className="detailed-title">
            <img src={mapMarkerRose} alt="A map marker icon" />
            <span>{ownid}</span>
          </div>
          <div className="detailed-properties">
            <p>
              Speculator
              <span>{` ${capitalizeFirstLetter(ownid)} `}</span> owned
              <span>{` ${propCount} properties `}</span>
              in <span>{` ${zipsBySpeculator.length} Detroit zipcodes `}</span>
              in the year <span>{` ${year}. `}</span>
            </p>
          </div>
          <TimeGraph ownid={ownid} />
          <div className="detailed-title">
            <img src={questionMarkRose} alt="A question mark icon" />
            <span>Properties by Zip Code for this Speculator</span>
          </div>
          <DumbPaginator
            data={speculatorData}
            length={speculatorData.length}
            queryParams={props.queryParams}
          >
            <ZipcodeLink />
          </DumbPaginator>
        </div>
      </div>
    )
  }
  return null
}

function MultipleParcels(props) {
  const { place, year } = props.queryParams
  const { searchState } = useSelector((state) => state)
  const {
    drawerIsOpen,
    resultsCount,
    resultsZip = props.queryParams?.code,
  } = searchState.detailedSearch
  const code = resultsZip
  const dispatch = useDispatch()

  const {
    data: speculatorData,
    topCount,
    topPer,
  } = useSpeculationByCode([], {
    code,
    year,
  })

  if (speculatorData) {
    return (
      <div className="results-inner scroller">
        {/* <MapViewer searchState={searchState} dispatch={dispatch} /> */}
        <MapViewerV4 searchState={searchState} dispatch={dispatch} />
        {/* <MapViewerV4
          accessToken={"MLY|4790260297730810|2c2446b85cd5a589a6e1cd43aa3b3525"}
          imageId={"498763468214164"}
          style={{ width: "100%", height: "300px" }}
        /> */}
        <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
          <div className="detailed-title">
            <img src={mapMarkerRose} alt="A map marker icon" />
            <span>{parseMBAddressString(place)}</span>
          </div>
          <div className="detailed-properties">
            <p>
              We could not find a speculation record for
              <span>{` ${parseMBAddressString(place)} `}</span> in
              <span>{` ${year}. `}</span> In zip code
              <span>{` ${code}`}</span> we have identified
              <span>{` ${resultsCount} `}</span>
              other properties owned by{" "}
              <span>{`${speculatorData.length} `}</span>
              speculators. Of these speculators, the top ten owned
              <span>{` ${topCount} `}</span>or
              <span>{` ${Math.round(topPer)}% `}</span>of the speculative
              properties we have on record for this zip code.
            </p>
          </div>
          <div className="detailed-title">
            <img src={questionMarkRose} alt="A question mark icon" />
            <span> Top 10 Speculators in {`${resultsZip}`}</span>
          </div>

          <div className="detailed-zipcode">
            {speculatorData.slice(0, 10).map((record) => {
              return (
                <div className="zipcode-item" key={record.own_id}>
                  <div>
                    <Link
                      to={createQueryStringFromParams(
                        {
                          type: "zipcode",
                          code: resultsZip,
                          ownid: record.own_id,
                          coordinates: null,
                          year,
                        },
                        "/map"
                      )}
                    >
                      <span>{capitalizeFirstLetter(record.own_id)}</span>
                    </Link>
                  </div>
                  <div>
                    <div>{`${record.count}  properties`}</div>
                    <div>{`${Math.round(record.per)}% ownership`}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  return null
}

function SingleParcel(props) {
  const { searchState } = useSelector((state) => state)
  // const { drawerIsOpen, recordYears, viewer } = searchState.detailedSearch
  const { drawerIsOpen, recordYears } = searchState.detailedSearch
  const { searchTerm, searchYear, searchCoordinates } = searchState.searchParams
  const dispatch = useDispatch()

  const {
    own_id,
    resyrbuilt,
    saledate,
    saleprice,
    totsqft,
    propzip,
    propaddr,
    count,
    parcelno,
    parprop_id, // this is the PK for geoms in DB
  } = props.result.properties

  // other years to search for this address
  const praxisRecordYears = availablePraxisYears(recordYears, searchYear)

  useEffect(() => {
    if (parprop_id) {
      const route = `/api/detailed-search?type=detailed-record-years&parpropid=${parprop_id}&year=${searchYear}`
      dispatch(handleGetPraxisYearsAction(route))
    }
    return () => null
  }, [dispatch, searchCoordinates])

  return (
    <div className="results-inner scroller">
      {/* <MapViewer searchState={searchState} dispatch={dispatch} /> */}
      <MapViewerV4 searchState={searchState} dispatch={dispatch} />
      {/* <MapViewerV4
        accessToken={"MLY|4790260297730810|2c2446b85cd5a589a6e1cd43aa3b3525"}
        imageId={"498763468214164"}
        style={{ width: "100%", height: "300px" }}
      /> */}
      <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
        <div className="detailed-title">
          <img src={mapMarkerRose} alt="A map marker icon" />
          <span>{searchTerm}</span>
        </div>
        <div className="detailed-properties">
          <div>
            <span>Speculator</span>
            <span>{capitalizeFirstLetter(own_id)}</span>
          </div>
          {propzip === 0 || propzip === null ? null : (
            <div>
              <span>Zip Code</span>
              <span>{propzip}</span>
            </div>
          )}
          {resyrbuilt === 0 || resyrbuilt === null ? null : (
            <div>
              <span>Year Built</span> <span>{resyrbuilt}</span>
            </div>
          )}

          {saledate === 0 || saledate === null ? null : (
            <div>
              <span>Last Sale Date </span>
              <span>{saledate.split("T")[0]}</span>
            </div>
          )}

          {saleprice === null ? null : (
            <div>
              <span>Last Sale Price</span>
              <span>{currencyFormatter.format(saleprice)}</span>
            </div>
          )}
          {totsqft === null ? null : (
            <div>
              <span>Area</span>
              <span>{`${totsqft.toLocaleString()} sq. ft.`}</span>{" "}
            </div>
          )}
          {parcelno === null ? null : (
            <div>
              <span>Parcel Number</span>
              <span>{parcelno}</span>{" "}
            </div>
          )}
        </div>
        <div className="detailed-title">
          <img src={questionMarkRose} alt="A question mark icon" />
          <span> About the Property</span>
        </div>
        <div className="detailed-properties">
          <p>
            In <span>{searchYear}</span>,{" "}
            <span>{capitalizeFirstLetter(propaddr)}</span> was located in
            Detroit zip code <span>{propzip}</span>, and was one of{" "}
            <span>{count}</span> properties owned by speculator{" "}
            <span>{capitalizeFirstLetter(own_id)}</span>. Additional years of
            speculation for this property ocurred in{" "}
            <span>
              {praxisRecordYears ? praxisRecordYears.join(", ") : null}
            </span>
            .
          </p>
          <Link
            to={createQueryStringFromParams(
              {
                type: "zipcode",
                code: propzip,
                coordinates: null,
                year: searchYear,
              },
              "/map"
            )}
          >
            <span title={`Search additional properties in ${propzip}.`}>
              <img src={infoIcon} alt="More Information"></img>
              {`Properties in ${propzip}`}
            </span>
          </Link>
          <Link
            to={createQueryStringFromParams(
              {
                type: "speculator",
                ownid: own_id,
                coordinates: null,
                year: searchYear,
              },
              "/map"
            )}
          >
            <span
              title={`Search all properties owned by ${capitalizeFirstLetter(
                own_id
              )}.`}
            >
              <img src={infoIcon} alt="More Information"></img>
              {`Properties owned by ${capitalizeFirstLetter(own_id)}`}
            </span>
          </Link>
          {praxisRecordYears
            ? praxisRecordYears.map((year, index) => {
                return (
                  <Link
                    key={`${year}-${index}`}
                    to={createQueryStringFromParams(
                      {
                        type: "address",
                        place: searchTerm,
                        coordinates: searchCoordinates,
                        year,
                      },
                      "/map"
                    )}
                  >
                    <span title={`Search this property's record for ${year}.`}>
                      <img src={infoIcon} alt="More Information"></img>
                      {` ${year} property record`}
                    </span>
                  </Link>
                )
              })
            : null}
        </div>
      </div>
    </div>
  )
}

function CodeSpeculatorParcels(props) {
  const { ownid, year, code } = props.queryParams
  const { drawerIsOpen, results } = useSelector(
    (state) => state.searchState.detailedSearch
  )
  const { speculatorData, zipsBySpeculator } = useCodesBySpeculator({
    code,
    ownid,
    year,
  })

  if (speculatorData && zipsBySpeculator) {
    return (
      <div className="results-inner scroller">
        <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
          <div className="detailed-title">
            <img src={mapMarkerRose} alt="A map marker icon" />
            <div>{`Properties in ${code} owned by ${ownid}`}</div>
          </div>
          <div className="detailed-properties">
            <p>
              Speculator
              <span>{` ${capitalizeFirstLetter(ownid)} `}</span> owned
              <span>{` ${results.length} properties `}</span>
              in Detroit zip code<span>{` ${code} `}</span>
              in the year <span>{` ${year}. `}</span>
            </p>
            <DumbPaginator
              data={results}
              length={results.length}
              queryParams={props.queryParams}
            >
              <AddressLink />
            </DumbPaginator>
          </div>
          <div className="detailed-title">
            <img src={questionMarkRose} alt="A question mark icon" />
            <span>{`Additional Properties by Zip Code for ${ownid}`}</span>
          </div>
          <div className="detailed-speculator">
            {speculatorData.map((record, index) => {
              return (
                <div
                  className="speculator-item"
                  key={`${record.own_id}-${index}`}
                >
                  <div>
                    <Link
                      to={createQueryStringFromParams(
                        {
                          type: "speculator",
                          code: record.propzip,
                          ownid,
                          coordinates: null,
                          year,
                        },
                        "/map"
                      )}
                    >
                      <span
                        title={`Search ${capitalizeFirstLetter(
                          ownid
                        )}'s properties in ${record.propzip}.`}
                      >
                        <img src={infoIcon} alt="More Information"></img>
                        {capitalizeFirstLetter(record.propzip)}
                      </span>
                    </Link>
                  </div>
                  <div>
                    <div>{`${record.count}  properties`}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  return null
}

function SpeculatorCodeParcels(props) {
  const { ownid, year, code } = props.queryParams
  const { drawerIsOpen, results } = useSelector(
    (state) => state.searchState.detailedSearch
  )
  const { speculatorData, zipsBySpeculator } = useCodesBySpeculator({
    code,
    ownid,
    year,
  })

  if (speculatorData && zipsBySpeculator) {
    return (
      <div className="results-inner scroller">
        <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
          <div className="detailed-title">
            <img src={mapMarkerRose} alt="A map marker icon" />
            <div>{`Properties in ${code} owned by ${ownid}`}</div>
          </div>
          <div className="detailed-properties">
            <p>
              Speculator
              <span>{` ${capitalizeFirstLetter(ownid)} `}</span> owned
              <span>{` ${results.length} properties `}</span>
              in Detroit zip code<span>{` ${code} `}</span>
              in the year <span>{` ${year}. `}</span>
            </p>
            <DumbPaginator
              data={results}
              length={results.length}
              queryParams={props.queryParams}
            >
              <AddressLink />
            </DumbPaginator>
          </div>
          <div className="detailed-title">
            <img src={questionMarkRose} alt="A question mark icon" />
            <span>{`Additional Properties by Zip Code for ${ownid}`}</span>
          </div>
          <DumbPaginator
            data={speculatorData}
            length={speculatorData.length}
            queryParams={props.queryParams}
          >
            <ZipcodeLink />
          </DumbPaginator>
        </div>
      </div>
    )
  }
  return null
}

function DetailedSearchResults({ detailsType, queryParams }) {
  const { drawerIsOpen, contentIsVisible, results, resultsType } = useSelector(
    (state) => state.searchState.detailedSearch
  )
  const dispatch = useDispatch()

  const isMobile = useMediaQuery({ query: "(max-width: 600px)" })

  useEffect(() => {
    if (results && resultsType) {
      dispatch(updateDetailedSearch({ drawerIsOpen: true }))
    }
    return () => null
  }, [results, resultsType, dispatch])

  const toggleDetailedResultsDrawer = () => {
    dispatch(updateDetailedSearch({ drawerIsOpen: !drawerIsOpen }))
  }

  return (
    <section className="result-drawer-static">
      <div
        className={
          drawerIsOpen
            ? "results-hamburger-button drawer-open"
            : "results-hamburger-button drawer-closed"
        }
        onClick={() => toggleDetailedResultsDrawer()}
      >
        {drawerIsOpen & !isMobile ? (
          <span>&#x276E;</span>
        ) : !drawerIsOpen & !isMobile ? (
          <span>&#x276F;</span>
        ) : drawerIsOpen & isMobile ? (
          <span className="angle-rotate">&#x276F;</span>
        ) : !drawerIsOpen & isMobile ? (
          <span className="angle-rotate">&#x276E;</span>
        ) : null}
      </div>
      {contentIsVisible && (
        <ContentSwitch detailsType={detailsType} queryParams={queryParams} />
      )}
    </section>
  )
}

export default DetailedSearchResults
