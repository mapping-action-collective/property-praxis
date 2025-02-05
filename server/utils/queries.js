const db = require("../db") //index.js
const fetch = require("node-fetch")
const keys = require("../config/keys")
const SQL = require("sql-template-strings")

/*PG DB query types*/
const PRIMARY_ZIPCODE = "PRIMARY_ZIPCODE"
const PRIMARY_SPECULATOR = "PRIMARY_SPECULATOR"
const GEOJSON_ZIPCODES = "GEOJSON_ZIPCODES"
const GEOJSON_ZIPCODES_PARCELS = "GEOJSON_ZIPCODES_PARCELS"
const GEOJSON_PARCELS_CODE = "GEOJSON_PARCELS_CODE"
const GEOJSON_PARCELS_CODE_OWNID = "GEOJSON_PARCELS_CODE_OWNID"
const GEOJSON_PARCELS_OWNID = "GEOJSON_PARCELS_OWNID"
const GEOJSON_PARCELS_OWNID_CODE = "GEOJSON_PARCELS_OWNID_CODE"
const GEOJSON_PARCELS_CODE_DISTANCE = "GEOJSON_PARCELS_CODE_DISTANCE"
const DETAILED_RECORD_YEARS = "DETAILED_RECORD_YEARS" // years for a praxis record
const SPECULATORS_BY_CODE = "SPECULATORS_BY_CODE"
const CODES_BY_SPECULATOR = "CODES_BY_SPECULATOR"
const POINT_CODE = "POINT_CODE" // get the zipcode for a specific point
const SPECULATION_BY_CODE = "SPECULATION_BY_CODE"
const SPECULATOR_BY_YEAR = "SPECULATOR_BY_YEAR" //graph data
const ZIPCODE_PARCEL_COUNT = "ZIPCODE_PARCEL_COUNT"

/*Mapbox API query types*/
const GEOCODE = "GEOCODE" // works for primary address as well
const REVERSE_GEOCODE = "REVERSE_GEOCODE"

/*All the queries for the db are managed in here.*/
async function queryPGDB({
  PGDBQueryType = null,
  code = null,
  ownid = null,
  coordinates = null,
  parcelno = null,
  year = null,
}) {
  try {
    let query, longitude, latitude

    if (coordinates) {
      const parsedCoordinates = JSON.parse(decodeURI(coordinates))
      longitude = parsedCoordinates.longitude
      latitude = parsedCoordinates.latitude
    }

    const zipMatch = `%${code}%`
    const ownIdMatch = `%${decodeURI(ownid)}%`.toUpperCase()

    /* eslint-disable no-case-declarations */
    switch (PGDBQueryType) {
      case PRIMARY_ZIPCODE:
        query = SQL`
          SELECT DISTINCT p.propzip AS propzip,
          AVG(p.count) AS avg_count
          FROM parcels AS p
          WHERE p.propzip = ${code}
          AND p.year = ${year}
          GROUP BY p.propzip
          ORDER BY avg_count DESC
          LIMIT 5;`
        break

      case PRIMARY_SPECULATOR:
        query = SQL`SELECT * FROM owner_count
          WHERE own_id LIKE ${ownIdMatch}
          AND year = ${year}
          AND count > 9
          ORDER BY count DESC
          LIMIT 5;`
        break
      // add WHERE to query for all the intersecting zips/parcels
      case GEOJSON_ZIPCODES:
        query = SQL`SELECT jsonb_build_object(
            'type',     'FeatureCollection',
            'features', jsonb_agg(feature)
          )
          FROM (
            SELECT jsonb_build_object(
              'type',       'Feature',
              'geometry',   ST_AsGeoJSON(geometry, 6)::json,
              'properties', to_jsonb(inputs)
            ) AS feature
            FROM (
              SELECT * FROM zips_geom
            ) inputs
          ) features;`
        break

      case GEOJSON_ZIPCODES_PARCELS:
        query = SQL`
          SELECT jsonb_build_object(
            'type',       'Feature',
            'geometry',   ST_AsGeoJSON(geometry, 6)::json,
            'properties', to_jsonb(inputs) - 'geometry'
          ) AS feature
          FROM (
            SELECT DISTINCT z.zipcode AS zipcode, z.geometry AS geometry
            FROM parcels AS p
            INNER JOIN zips_geom AS z ON p.propzip = z.zipcode
            WHERE p.year = ${year}`
        if (code) {
          query.append(SQL` AND p.propzip = ${code}`)
        }
        if (ownid) {
          query.append(SQL` AND p.own_id LIKE ${ownIdMatch}`)
        }
        if (coordinates) {
          query.append(SQL` AND 
            ST_Within(
              ST_SetSRID(
                ST_MakePoint(${longitude}, ${latitude}),
              4326),
            z.geometry)`)
        }

        query.append(SQL`) inputs;`)
        break

      case GEOJSON_PARCELS_CODE:
        query = SQL`SELECT COUNT(*) FROM parcels WHERE year = ${year} AND propzip = ${code};`
        break

      case GEOJSON_PARCELS_OWNID:
        query = SQL`SELECT COUNT(*) FROM parcels WHERE year = ${year} AND own_id LIKE ${ownIdMatch};`
        break

      case GEOJSON_PARCELS_CODE_OWNID:
        query = SQL`SELECT jsonb_build_object(
              'type',     'FeatureCollection',
              'features', jsonb_agg(feature)
            )
            FROM (
              SELECT jsonb_build_object(
                'type',       'Feature',
                'geometry',   ST_AsGeoJSON(centroid, 6)::json,
                'properties', to_jsonb(inputs),
                'centroid',   ST_AsText(centroid)
              ) AS feature
              FROM (
                SELECT * FROM parcels
                WHERE year = ${year}
                AND propzip = ${code}
                AND own_id LIKE ${ownIdMatch}
              ) inputs
            ) features;`
        break

      // TODO: Clean up feature collections that aren't used for geom anymore
      case GEOJSON_PARCELS_OWNID_CODE:
        query = SQL`SELECT jsonb_build_object(
              'type',     'FeatureCollection',
              'features', jsonb_agg(feature)
            )
            FROM (
              SELECT jsonb_build_object(
                'type',       'Feature',
                'geometry',   ST_AsGeoJSON(centroid, 6)::json,
                'properties', to_jsonb(inputs),
                'centroid',   ST_AsText(centroid)
              ) AS feature
              FROM (
                SELECT * FROM parcels
                WHERE year = ${year}
                AND own_id LIKE ${ownIdMatch}
                AND propzip LIKE ${zipMatch}
              ) inputs
            ) features;`
        break

      case GEOJSON_PARCELS_CODE_DISTANCE:
        query = SQL`
          SELECT
            feature_id,
            saledate,
            saleprice,
            totsqft,
            totacres,
            resyrbuilt,
            year,
            propaddr,
            own_id,
            taxpayer,
            count,
            own_group,
            parcelno,
            propno,
            propdir,
            propzip,
            ST_AsText(centroid) AS centroid,
            ST_AsGeoJSON(geom, 6)::json AS geometry,
            ST_Distance(
              ST_SetSRID(
                ST_MakePoint(${longitude}, ${latitude}),
              4326)::geography,
            geom::geography) AS distance,
            ST_Contains(
              geom,
              ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
            ) AS inside
          FROM parcels
          WHERE year = ${year}
          AND propzip LIKE ${zipMatch}
          ORDER BY parcels.geom <-> ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
          LIMIT 1;`
        break

      case ZIPCODE_PARCEL_COUNT:
        query = SQL`SELECT COUNT(*) FROM parcels WHERE year = ${year} AND propzip LIKE ${zipMatch};`
        break

      case POINT_CODE:
        query = SQL`SELECT * 
          FROM zips_geom AS z
          WHERE 
          ST_Within(
            ST_SetSRID(
              ST_MakePoint(${longitude}, ${latitude}),
            4326),
          z.geometry)`
        break

      // search for available geometry cols
      case DETAILED_RECORD_YEARS:
        query = SQL`SELECT
          DISTINCT year
          FROM parcels
          WHERE parcelno = ${parcelno}`
        break

      case SPECULATORS_BY_CODE:
        query = SQL`SELECT DISTINCT p.own_id, COUNT(*) AS count
        FROM parcels AS p
        WHERE p.propzip = ${code} AND p.year = ${year}
        GROUP BY p.own_id
        ORDER BY count DESC
        LIMIT 5`
        break

      case CODES_BY_SPECULATOR:
        query = SQL`
          SELECT DISTINCT p.propzip AS propzip,
          STRING_AGG(DISTINCT p.own_id, ',') AS own_id,
          COUNT(*) AS count
          FROM parcels AS p
          WHERE p.own_id LIKE ${ownIdMatch}
          AND p.year = ${year}
          GROUP BY p.propzip, p.own_id
          ORDER BY count DESC;
        `
        break

      case SPECULATION_BY_CODE:
        /*Query to  get the rate of speculation in a zipcode.*/
        query = SQL`SELECT
          p.own_id,
          COUNT(*) AS count,
          COUNT(*) AS total,
          ROUND(100.0 * COUNT(*) / spec.total_zip_count, 2) AS per
        FROM parcels p
        INNER JOIN (
          SELECT propzip, COUNT(*) AS total_zip_count
          FROM parcels
          WHERE year = ${year}
          GROUP BY propzip
        ) spec ON p.propzip = spec.propzip
        WHERE
          p.year = ${year}
          AND p.propzip = ${code}
        GROUP BY p.own_id, spec.total_zip_count
        ORDER BY total DESC
        LIMIT 10;`
        break

      case SPECULATOR_BY_YEAR:
        /*Search property count by own_id by year*/
        query = SQL`SELECT year, own_id, count
          FROM owner_count
          WHERE own_id = ${ownid.toUpperCase()}
          ORDER BY year ASC`
        break

      default:
        console.error(`Unknown SQL query type: ${PGDBQueryType}`)
        break
    }
    console.log(`DB Query: ${query.text}`)
    const { rows } = await db.query(query)
    return { data: rows }
  } catch (err) {
    const query = "UNKNOWN QUERY"
    console.error(
      `An error occurred executing SQL query type$: ${PGDBQueryType}, 
      query: ${query}. Message: ${err}`
    )
  }
}

async function queryMapboxAPI({ coordinates, place, mbQueryType }) {
  try {
    let mbResponse, mbJSON, APIRequest

    switch (mbQueryType) {
      case GEOCODE:
        const queryParams = new URLSearchParams({
          autocomplete: "true",
          fuzzyMatch: "true",
          country: "US",
          bbox: [-83.287959, 42.25519197, -82.91043917, 42.45023198].join(","),
          types: ["address", "poi"].join(","),
          access_token: keys.MAPBOX_ACCESS_TOKEN,
        })
        APIRequest = `https://api.mapbox.com/geocoding/v5/mapbox.places/${place}.json?${queryParams}`
        console.log(`MBAPIRequest: ${APIRequest}`)
        mbResponse = await fetch(APIRequest)
        mbJSON = await mbResponse.json()
        // Filter for Detroit addresses, simplify that part of string
        const mb = mbJSON.features
          .filter(({ place_name }) => place_name.includes(", Detroit, "))
          .map(({ place_name, geometry }) => ({
            place_name: place_name.split(", Detroit, ")[0],
            geometry,
          }))
        return { data: mb }

      case REVERSE_GEOCODE:
        const { longitude, latitude } = JSON.parse(decodeURI(coordinates))
        APIRequest = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${keys.MAPBOX_ACCESS_TOKEN}`
        console.log(`MBAPIRequest: ${APIRequest}`)
        mbResponse = await fetch(APIRequest)
        mbJSON = await mbResponse.json()
        const { place_name, geometry } = mbJSON.features[0]
        return { data: { place_name, geometry } }

      default:
        console.error(`Unkown Mapbox query type: ${mbQueryType}`)
        return { data: `Unkown Mapbox query type: ${mbQueryType}` }
    }
  } catch (err) {
    console.error(`An error occurred executing MB query. Message: ${err}`)
  }
}

module.exports = {
  queryPGDB,
  queryMapboxAPI,
  PRIMARY_ZIPCODE,
  PRIMARY_SPECULATOR,
  GEOJSON_ZIPCODES,
  GEOJSON_ZIPCODES_PARCELS,
  GEOJSON_PARCELS_CODE,
  GEOJSON_PARCELS_CODE_OWNID,
  GEOJSON_PARCELS_OWNID,
  GEOJSON_PARCELS_OWNID_CODE,
  GEOJSON_PARCELS_CODE_DISTANCE,
  POINT_CODE,
  DETAILED_RECORD_YEARS,
  GEOCODE,
  REVERSE_GEOCODE,
  SPECULATORS_BY_CODE,
  CODES_BY_SPECULATOR,
  SPECULATION_BY_CODE,
  SPECULATOR_BY_YEAR,
  ZIPCODE_PARCEL_COUNT,
}
