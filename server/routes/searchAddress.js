const Router = require("express-promise-router");
const db = require("../db"); //index.js
const fetch = require("node-fetch");
const keys = require("../config/keys");

const router = new Router();

router.get("/partial/:id/:year", async (req, res) => {
  const { id, year } = req.params;
  const decodeId = decodeURI(id).toUpperCase();

  try {
    //   query the MB Geocoder API
    const mbResponse = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${id}.json?fuzzyMatch=true&bbox=-83.287959,42.25519197,-82.91043917,42.45023198&types=address,poi&access_token=${keys.MAPBOX_ACCESS_TOKEN}`
    );
    const mbJson = await mbResponse.json();
    const mbFeatures = mbJson.features;
    ////////////////////////////////////////
    // query the db
    // Note this may need to be shifted to be a view on db creation
    // const query = `SELECT ppg.parcelno, CONCAT( (p.propno || ' ' ||
    //                 CASE WHEN p.propdir = '0' THEN '' ELSE p.propdir END),
    //                 (p.propstr || ', '), 'Detroit, Michigan ', (p.propzip) ) AS address
    //                 FROM property AS p
    //                 INNER JOIN parcel_property_geom AS ppg ON p.parprop_id = ppg.parprop_id
    //                 INNER JOIN taxpayer_property AS tpp ON p.prop_id = tpp.prop_id
    //                 INNER JOIN year AS y ON tpp.taxparprop_id = y.taxparprop_id
    //                 WHERE levenshtein( (p.propno || ' ' ||
    //                 CASE WHEN p.propdir = '0' THEN '' ELSE p.propdir END
    //                 || p.propstr || ', DETROIT, MICHIGAN ' || p.propzip), $1) <= 5
    //                 OR (p.propno || ' ' ||
    //                 CASE WHEN p.propdir = '0' THEN '' ELSE p.propdir END
    //                 || p.propstr || ', DETROIT, MICHIGAN ' || p.propzip) LIKE $2
    //                 AND y.praxisyear = $3`;

    // const { rows } = await db.query(query, [decodeId, `${decodeId}%`, year]);
    // return an array
    // res.json([{ mb: mbFeatures }, { db: rows }]);
    ////////////////////////////////////////
    res.json([{ mb: mbFeatures }]);
  } catch (err) {
    res.json(err);
  }
});

router.get("/full/:coords/:year", async (req, res) => {
  const { coords, year } = req.params;
  const { longitude, latitude } = JSON.parse(decodeURI(coords));

  try {
    const query =  `SELECT DISTINCT p.*, otp.own_id 
    FROM parcel_property_geom AS ppg
    INNER JOIN property as p ON ppg.parprop_id = p.parprop_id
    INNER JOIN taxpayer_property AS tpp ON p.prop_id = tpp.prop_id
    INNER JOIN year AS y ON tpp.taxparprop_id = y.taxparprop_id
    INNER JOIN taxpayer as tp ON tpp.tp_id = tp.tp_id
    INNER JOIN owner_taxpayer as otp ON tp.owntax_id = otp.owntax_id
    WHERE y.praxisyear = $1 AND
    ST_Intersects(ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), ppg.geom_${year})`;

    const { rows } = await db.query(query, [`${year}`]);
    res.json({ rows });
  } catch (err) {
    res.json(err);
  }
});
// export our router to be mounted by the parent application
module.exports = router;

