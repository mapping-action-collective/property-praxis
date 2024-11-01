const Router = require("express-promise-router")
const router = new Router()
const queries = require("../utils/queries")

/* This route covers all requests that 
are not part of the primary or detailed 
search groups. */

router.get("/", async (req, res) => {
  try {
    const { type = null, year = null, code = null } = req.query
    let pgData, clientData
    switch (type) {
      case "available-praxis-years":
        pgData = await queries.queryPGDB({
          PGDBQueryType: queries.AVAILABLE_PRAXIS_YEARS,
        })
        clientData = pgData.data
        break
      case "codes-by-speculator":
        pgData = await queries.queryPGDB({
          PGDBQueryType: queries.ZIPCODE_PARCEL_COUNT,
          year,
          code,
        })
        clientData = Object.values(pgData.data[0])
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
