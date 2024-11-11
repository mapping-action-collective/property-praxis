const Router = require("express-promise-router")
const SQL = require("sql-template-strings")
const router = new Router()
const queries = require("../utils/queries")
const db = require("../db")

/* This route covers all requests that 
are not part of the primary or detailed 
search groups. */

async function queryAllTotals(year) {
  const { rows: speculationByYear } = await db.query(SQL`
    SELECT
      year,
      SUM(count) AS count,
      (COUNT(*) FILTER (WHERE own_id IS NOT NULL)) AS speculator_count
    FROM owner_count
    GROUP BY year
    ORDER BY year ASC
  `)

  const { rows: topSpeculators } = await db.query(SQL`
  SELECT 
    p.own_id,
    COUNT(*) AS count,
    COUNT(*) AS total,
    (COUNT(*) * 100.0 / total.total_parcel_count) AS per
  FROM 
    parcels p
  JOIN (
    SELECT 
      year,
      COUNT(*) AS total_parcel_count
    FROM 
      parcels
    WHERE 
      year = ${year}
    GROUP BY 
      year
  ) total ON p.year = total.year
  WHERE 
    p.year = ${year}
  GROUP BY 
    p.own_id, p.year, total.total_parcel_count
  ORDER BY 
    total DESC
  LIMIT 10;
  `)
  return {
    speculationByYear,
    topSpeculators,
  }
}

router.get("/", async (req, res) => {
  try {
    const { type = null, year = null, code = null } = req.query
    let pgData, clientData
    switch (type) {
      case "codes-by-speculator":
        pgData = await queries.queryPGDB({
          PGDBQueryType: queries.ZIPCODE_PARCEL_COUNT,
          year,
          code,
        })
        clientData = Object.values(pgData.data[0])
        break
      case "all-totals":
        clientData = await queryAllTotals(year)
        break
      default:
        clientData = null
        break
    }
    res.set("Cache-Control", "public, max-age=86400")
    res.json(clientData)
  } catch (err) {
    const msg = `An error occurred executing search search query. Message: ${err}`
    console.error(msg)
    res.status(500).send(msg)
  }
})

module.exports = router
