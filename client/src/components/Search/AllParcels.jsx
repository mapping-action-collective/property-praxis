import React from "react"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import {
  capitalizeFirstLetter,
  createQueryStringFromParams,
} from "../../utils/helper"
import {
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
  VictoryTooltip,
} from "victory"
import { DEFAULT_YEAR, MINIMUM_YEAR } from "../../utils/constants"
import questionMarkRose from "../../assets/img/question_mark_rose.svg"
import mapMarkerRose from "../../assets/img/map_marker_rose.svg"
import infoIcon from "../../assets/img/info-icon.png"

function AllParcels(props) {
  const year = props.queryParams?.year || DEFAULT_YEAR
  const { timelineData, totalSpeculators, totalParcels, topSpeculators } =
    useSelector((state) => state.searchState.allTotals)
  const { drawerIsOpen } = useSelector(
    (state) => state.searchState.detailedSearch
  )

  return (
    totalSpeculators && (
      <div className="results-inner scroller">
        <div style={drawerIsOpen ? { display: "block" } : { display: "none" }}>
          <div className="detailed-title">
            <img src={mapMarkerRose} alt="A map marker icon" />
            <span>All Speculators {year}</span>
          </div>
          <div className="detailed-properties">
            <p>
              <span>{totalSpeculators}</span> speculators owned {totalParcels}{" "}
              properties in Detroit in the year <span>{` ${year}. `}</span>
            </p>
          </div>
          <VictoryChart
            theme={VictoryTheme.material}
            domainPadding={5}
            padding={{ top: 25, bottom: 50, left: 60, right: 10 }}
            domain={{
              x: [+MINIMUM_YEAR, +DEFAULT_YEAR],
              y: [
                0,
                Math.max(...(timelineData || [{ y: 10 }]).map(({ y }) => y)),
              ],
            }}
          >
            <VictoryAxis tickFormat={(tick) => `${tick}`} />
            <VictoryAxis tickFormat={(tick) => `${tick}`} dependentAxis />
            <VictoryLine
              style={{
                data: { stroke: "#e4002c", strokeWidth: 3 },
                parent: { border: "1px solid #ccc" },
              }}
              data={timelineData}
            />
            <VictoryScatter
              style={{
                data: { fill: "#e4002c", strokeWidth: 35 },
              }}
              size={4}
              data={(timelineData || []).map((datum) => ({
                ...datum,
                label: datum.y,
              }))}
              labelComponent={<VictoryTooltip />}
            />
          </VictoryChart>
          <div className="detailed-title">
            <img src={questionMarkRose} alt="A question mark icon" />
            <span>Top 10 Speculators</span>
          </div>
          <div className="detailed-zipcode">
            {topSpeculators.slice(0, 10).map((record, index) => {
              return (
                <div className="speculator-item" key={record.own_id}>
                  <div>
                    <Link
                      to={createQueryStringFromParams(
                        {
                          type: "speculator",
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
                        )}'s properties`}
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
            })}
          </div>
        </div>
      </div>
    )
  )
}

export default AllParcels
