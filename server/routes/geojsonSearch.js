const Router = require("express-promise-router")
const queries = require("../utils/queries")
const { checkEmptyGeoJSON, buildGeoJSONTemplate } = require("../utils/geojson")
const router = new Router()

router.get("/", async (req, res) => {
  try {
    const {
      type,
      ownid = null,
      code = null,
      place = null,
      coordinates = null,
      year = "2023",
    } = req.query

    let pgData, geoJSON, clientData, praxisDataType
    /* eslint-disable no-case-declarations */
    switch (type) {
      case "parcels-by-geocode":
        // return geoJSON dependent on coverage
        const { data } = await queries.queryPGDB({
          place,
          coordinates,
          PGDBQueryType: queries.POINT_CODE,
        })

        let zipcode
        if (data[0]) {
          zipcode = data[0].zipcode
        } else {
          zipcode = null
        }

        pgData = await queries.queryPGDB({
          code: zipcode,
          coordinates,
          year,
          PGDBQueryType: queries.GEOJSON_PARCELS_CODE_DISTANCE,
        })

        const targetAddress = pgData.data
          .map(({ geometry, ...properties }) => ({
            type: "Feature",
            geometry,
            properties,
          }))
          .filter(
            ({ properties: { propaddr } }) =>
              !!place && +place.split(" ")[0] === +propaddr.split(" ")[0]
          )
        let nearbyAddresses = []

        if (targetAddress.length === 0) {
          nearbyAddresses = (
            await queries.queryPGDB({
              code: zipcode,
              year,
              PGDBQueryType: queries.ZIPCODE_PARCEL_COUNT,
            })
          ).data
        }

        if (targetAddress.length === 0 && nearbyAddresses.length === 0) {
          // this is a default empty geojson
          // where there is no features returned
          geoJSON = buildGeoJSONTemplate([])
          praxisDataType = "parcels-by-geocode:empty"
        } else if (targetAddress.length > 0) {
          geoJSON = buildGeoJSONTemplate(targetAddress)
          praxisDataType = "parcels-by-geocode:single-parcel"
        } else if (targetAddress.length === 0 && nearbyAddresses.length > 0) {
          geoJSON = { count: +nearbyAddresses[0].count, code: zipcode }
          praxisDataType = "parcels-by-geocode:multiple-parcels"
        } else {
          geoJSON = buildGeoJSONTemplate([])
          praxisDataType = "parcels-by-geocode:empty"
        }
        clientData = geoJSON
        break

      case "parcels-by-code":
        pgData = await queries.queryPGDB({
          code,
          year,
          PGDBQueryType: queries.GEOJSON_PARCELS_CODE,
        })

        geoJSON = { count: +pgData.data[0].count, code }
        clientData = geoJSON
        praxisDataType = "parcels-by-code"
        break

      case "parcels-by-speculator":
        pgData = await queries.queryPGDB({
          ownid,
          year,
          PGDBQueryType: queries.GEOJSON_PARCELS_OWNID,
        })

        geoJSON = { count: +pgData.data[0].count, ownid }
        clientData = geoJSON
        praxisDataType = "parcels-by-speculator"
        break

      case "parcels-by-code-speculator":
        pgData = await queries.queryPGDB({
          code,
          ownid,
          year,
          PGDBQueryType: queries.GEOJSON_PARCELS_CODE_OWNID,
        })

        geoJSON = pgData.data[0].jsonb_build_object
        clientData = checkEmptyGeoJSON(geoJSON)
        praxisDataType = "parcels-by-code-speculator"
        break

      case "parcels-by-speculator-code":
        pgData = await queries.queryPGDB({
          ownid,
          code,
          year,
          PGDBQueryType: queries.GEOJSON_PARCELS_OWNID_CODE,
        })

        geoJSON = pgData.data[0].jsonb_build_object
        clientData = checkEmptyGeoJSON(geoJSON)
        praxisDataType = "parcels-by-speculator-code"
        break

      case "zipcode-all": // this shoudl be reowrked to hanlde "codes"
        pgData = await queries.queryPGDB({
          PGDBQueryType: queries.GEOJSON_ZIPCODES,
        })

        geoJSON = pgData.data[0].jsonb_build_object
        clientData = checkEmptyGeoJSON(geoJSON)
        praxisDataType = "zipcode-all"
        break

      case "zipcode-intersect": // this should be reowrked to hanlde "codes"
        // TODO: fix speed
        pgData = await queries.queryPGDB({
          PGDBQueryType: queries.GEOJSON_ZIPCODES_PARCELS,
          ownid,
          code,
          coordinates,
          year,
        })

        geoJSON = {
          type: "FeatureCollection",
          features: pgData.data.map(({ feature }) => feature),
        }
        clientData = checkEmptyGeoJSON(geoJSON)
        praxisDataType = "zipcode-intersect"
        break

      default:
        clientData = null
        break
    }
    clientData.praxisDataType = praxisDataType
    res.set("Cache-Control", "public, max-age=86400")
    res.json(clientData)
  } catch (err) {
    const msg = `An error occurred executing parcels geoJSON query. Message: ${err}`
    console.error(msg)
    res.status(500).send(msg)
  }
})

module.exports = router
