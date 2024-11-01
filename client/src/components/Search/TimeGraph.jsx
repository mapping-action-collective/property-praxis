import React, { useState, useEffect } from "react"
import { APISearchQueryFromRoute } from "../../utils/api"
import {
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
  VictoryTooltip,
} from "victory"
import { DEFAULT_YEAR, MINIMUM_YEAR } from "../../utils/constants"

function TimeGraph({ ownid }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    ;(async () => {
      if (ownid) {
        const route = `/api/detailed-search?type=speculator-by-year&ownid=${ownid}`
        const data = await APISearchQueryFromRoute(route)
        const graph_data = data
          .map(({ year, count }) => ({
            x: +year,
            y: Number(count),
          }))
          .sort((a, b) => a.year - b.year)
        setData(graph_data)
      }
    })()
    return () => null
  }, [ownid])

  return (
    <VictoryChart
      theme={VictoryTheme.material}
      domainPadding={5}
      padding={{ top: 25, bottom: 50, left: 40, right: 10 }}
      domain={{
        x: [+MINIMUM_YEAR, +DEFAULT_YEAR],
        y: [0, Math.max(...(data || [{ y: 10 }]).map(({ y }) => y))],
      }}
    >
      <VictoryAxis tickFormat={(tick) => `${tick}`} />
      <VictoryAxis tickFormat={(tick) => `${tick}`} dependentAxis />
      <VictoryLine
        style={{
          data: { stroke: "#e4002c", strokeWidth: 3 },
          parent: { border: "1px solid #ccc" },
        }}
        data={data}
      />
      <VictoryScatter
        style={{
          data: { fill: "#e4002c", strokeWidth: 35 },
        }}
        size={4}
        data={(data || []).map((datum) => ({ ...datum, label: datum.y }))}
        labelComponent={<VictoryTooltip />}
      />
    </VictoryChart>
  )
}

export default TimeGraph
