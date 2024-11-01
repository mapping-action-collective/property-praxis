import bbox from "@turf/bbox"

// function to create the new viewport to zoom to
export function createNewViewport(geojson, mapRef) {
  const { features } = geojson
  let featureCount = 0
  if (features && features.length > 0) {
    //check to make sure the features have geometries
    const reducer = (accumulator, currentValue) => accumulator + currentValue
    featureCount = features
      .map((feature) => {
        if (feature?.geometry?.geometries)
          return feature?.geometry?.geometries.length
        if (feature?.geometry?.coordinates)
          return feature?.geometry?.coordinates.length

        return 0
      })
      .reduce(reducer)
  }

  if (!mapRef?.current) {
    return
  }

  // create the appropriate
  if (features && featureCount > 0) {
    const [minLng, minLat, maxLng, maxLat] = bbox(geojson)
    mapRef.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: 40,
      }
    )
  } else if (geojson.geometry && geojson.geometry.type === "Point") {
    //if it is a point return this
    const [longitude, latitude] = geojson.center
    mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15 })
  } else {
    mapRef.current.flyTo({
      center: [-83.11182404081912, 42.40230199308517],
      zoom: 10,
    })
  }
}

export function coordsFromWKT(wkt) {
  if (wkt === "POINT EMPTY") return null

  //else do this
  const coordsArray = wkt.replace("POINT(", "").replace(")", "").split(" ")
  return {
    longitude: Number(coordsArray[0]),
    latitude: Number(coordsArray[1]),
  }
}

// TODO: Build in configurability here
export function getTileLayer(layer, year) {
  // import.meta.env.VITE_TILE_URL_BASE ?? `https://property-praxis-dev-assets.s3.amazonaws.com/tiles`
  return `https://property-praxis-dev-assets.s3.amazonaws.com/tiles/dev/${layer}-${year}/{z}/{x}/{y}.pbf`
}
