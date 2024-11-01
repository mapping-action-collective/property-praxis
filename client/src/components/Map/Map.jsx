import React, { Component } from "react"
import PropTypes from "prop-types"
import ReactMapGL, { Source, Layer, Marker, Popup } from "react-map-gl"
// import ParcelLayerController from "./ParcelLayerController";
import BasemapController from "./BasemapController"
import { createNewViewport, getTileLayer } from "../../utils/map"
import {
  capitalizeFirstLetter,
  parseMBAddressString,
  createFilterFromParams,
  createQueryStringFromParams,
} from "../../utils/helper"
import queryString from "query-string"
import { URLParamsToAPIQueryString } from "../../utils/parseURL"
import {
  getMapStateAction,
  toggleLoadingIndicatorAction,
} from "../../actions/mapState"
import { getHoveredFeatureAction } from "../../actions/currentFeature"
import {
  logMarkerDragEventAction,
  onMarkerDragEndAction,
  setMarkerCoordsAction,
  handleGetZipcodesDataAction,
  handleGetParcelsByQueryAction,
  handleGetReverseGeocodeAction,
} from "../../actions/mapData"
import {
  parcelLayer,
  parcelHighlightLayer,
  parcelCentroid,
  // parcelCentroidHighlightLayer,
  zipsLayer,
  zipsLabel,
} from "./mapStyle"
import { Pin, Arrow } from "./Pin"
import {
  parcelStop1,
  parcelStop2,
  parcelStop3,
  parcelStop4,
  parcelStop5,
  parcelStop6,
  parcelStop7,
} from "../../utils/colors"

/*This API token works for propertypraxis.org  */
const MAPBOX_TOKEN =
  "pk.eyJ1IjoibWFwcGluZ2FjdGlvbiIsImEiOiJjazZrMTQ4bW4wMXpxM251cnllYnR6NjMzIn0.9KhQIoSfLvYrGCl3Hf_9Bw"

class PraxisMarker extends React.Component {
  _logDragEvent(name, event) {
    this.props.dispatch(logMarkerDragEventAction(name, event))
  }

  _onMarkerDragStart = (event) => {
    this._logDragEvent("onDragStart", event)
  }

  _onMarkerDrag = (event) => {
    this._logDragEvent("onDrag", event)
  }

  _onMarkerDragEnd = async (event) => {
    this._logDragEvent("onDragEnd", event)
    this.props.dispatch(onMarkerDragEndAction(event))

    // get the marker coords
    const [markerLongitude, markerLatitude] = event.lngLat
    const encodedCoords = encodeURI(
      JSON.stringify({
        longitude: markerLongitude,
        latitude: markerLatitude,
      })
    )

    // query mapbox api based on those coords
    const apiReverseGeocodeRoute = `/api/reverse-geocode?coordinates=${encodedCoords}`
    const { place_name, geometry } = await this.props.dispatch(
      handleGetReverseGeocodeAction(apiReverseGeocodeRoute)
    )
    const [reverseGCLongitude, reverseGCLatitude] = geometry.coordinates
    const reverseGCEncodedCoords = encodeURI(
      JSON.stringify({
        longitude: reverseGCLongitude,
        latitude: reverseGCLatitude,
      })
    )

    // create a new route using the api return data
    // const parsedPlaceName = parseMBAddressString(place_name);
    const { searchYear } = this.props.searchState.searchParams
    const clientRoute = createQueryStringFromParams(
      {
        type: "address",
        place: parseMBAddressString(place_name),
        coordinates: reverseGCEncodedCoords,
        year: searchYear,
      },
      "/map"
    )

    this.props.router?.navigate(clientRoute)
  }

  render() {
    const { latitude, longitude } = this.props.mapData.marker
    return (
      <Marker
        longitude={longitude}
        latitude={latitude}
        // offsetTop={-20}
        // offsetLeft={-10}
        draggable
        onDragStart={this._onMarkerDragStart}
        onDrag={this._onMarkerDrag}
        onDragEnd={this._onMarkerDragEnd}
      >
        <Pin size={30} />
      </Marker>
    )
  }
}

PraxisMarker.propTypes = {
  mapData: PropTypes.shape({
    marker: PropTypes.shape(
      {
        latitude: PropTypes.number.isRequired,
        longitude: PropTypes.number.isRequired,
      }.isRequired
    ),
  }).isRequired,
  createNewViewport: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
}

class PraxisMap extends Component {
  _stops = [
    [1, parcelStop1],
    [2, parcelStop2],
    [3, parcelStop3],
    [4, parcelStop4],
    [5, parcelStop5],
    [6, parcelStop6],
    [7, parcelStop7],
  ]

  mapRef = React.createRef()
  mapRefDidUpdate = false

  // _stops = [
  //   [1, "#f6d2a9;"],
  //   [2, "#f5b78e"],
  //   [3, "#f19c7c"],
  //   [4, "#ea8171"],
  //   [5, "#dd686c"],
  //   [6, "#ca5268"],
  //   [7, "#b13f64"],
  // ];

  // create new vieport dependent on geojson bbox
  _createNewViewport = (geojson) => {
    createNewViewport(geojson, this.mapRef)
  }

  _getMapData = async () => {
    // Toggle loading on (will be togled off on map load)
    this.props.dispatch(toggleLoadingIndicatorAction(true))

    // Build route and get data
    const parcelsRoute = URLParamsToAPIQueryString(
      this.props.router?.location?.search,
      "parcels"
    )

    const zipRoute = URLParamsToAPIQueryString(
      this.props.router?.location?.search,
      "zipcode"
    )

    // Get Data
    const parcelsGeojson = await this.props.dispatch(
      handleGetParcelsByQueryAction(parcelsRoute)
    )
    const zipsGeojson = await this.props.dispatch(
      handleGetZipcodesDataAction(zipRoute)
    )

    if (parcelsGeojson?.type === "FeatureCollection") {
      this._createNewViewport(parcelsGeojson)
    } else if (zipsGeojson) {
      this._createNewViewport(zipsGeojson)
    }

    // set marker not undefined or null
    const { searchCoordinates } = this.props.searchParams
    if (searchCoordinates) {
      const { longitude, latitude } = JSON.parse(decodeURI(searchCoordinates))
      this.props.dispatch(setMarkerCoordsAction(longitude, latitude))
    } else {
      this.props.dispatch(setMarkerCoordsAction(null, null))
    }

    // Toggle indicator off
    if (parcelsGeojson && zipsGeojson) {
      this.props.dispatch(toggleLoadingIndicatorAction(false))
    }
  }

  _onViewportChange = (viewport) => {
    this.props.dispatch(getMapStateAction({ ...viewport }))
  }

  _onHover = (event) => {
    const {
      features,
      lngLat,
      originalEvent: { offsetX, offsetY },
    } = event

    const hoveredFeature =
      features && features.find((f) => f.layer.id === "parcel-polygon")

    if (hoveredFeature) {
      this.mapRef.current?.setFeatureState(
        {
          source: "parcels",
          sourceLayer: "parcels",
          id: hoveredFeature.id,
        },
        { hover: true }
      )
    }
    if (
      this.props.currentFeature?.hoveredFeature?.id &&
      this.props.currentFeature?.hoveredFeature?.id !== hoveredFeature?.id
    ) {
      this.mapRef.current?.setFeatureState(
        {
          source: "parcels",
          sourceLayer: "parcels",
          id: this.props.currentFeature.hoveredFeature.id,
        },
        { hover: false }
      )
    }
    this.props.dispatch(
      getHoveredFeatureAction({
        hoveredFeature,
        x: offsetX,
        y: offsetY,
        lngLat,
      })
    )
  }

  _renderTooltip() {
    // TODO: Move to use mapbox native tooltip, performance on this is too rough
    const { hoveredFeature, x, y } = this.props.currentFeature
    console.log(hoveredFeature)

    return (
      hoveredFeature && (
        <div className="tooltip" style={{ left: x, top: y }}>
          <div>{hoveredFeature.properties.propaddr}</div>
          <div>Speculator: {hoveredFeature.properties.own_id}</div>
          <div>Properties owned: {hoveredFeature.properties.count}</div>
        </div>
      )
    )
  }

  _removeTooltip() {
    this.props.dispatch(getHoveredFeatureAction(null))
  }
  // add a new marker if user clicks on a parcel feature
  // nothing happens if there is no feature
  _handleMapClick = async (event) => {
    const { hoveredFeature } = this.props.currentFeature
    if (hoveredFeature) {
      const { lng: markerLongitude, lat: markerLatitude } = event.lngLat

      // set the marker based on event feature coords
      this.props.dispatch(
        setMarkerCoordsAction(markerLongitude, markerLatitude)
      )

      const coordinates = {
        longitude: markerLongitude,
        latitude: markerLatitude,
      }

      // build route using feature properties
      const { propaddr } = hoveredFeature.properties
      const encodedCoords = encodeURI(JSON.stringify(coordinates))

      const { searchYear } = this.props.searchState.searchParams
      const clientRoute = createQueryStringFromParams(
        {
          type: "address",
          place: capitalizeFirstLetter(propaddr),
          coordinates: encodedCoords,
          year: searchYear,
        },
        "/map"
      )
      this.props.router?.navigate(clientRoute)
    }
  }

  _handleToggleLoadingIndicator = (isLoading) => {
    this.props.dispatch(toggleLoadingIndicatorAction(isLoading))
  }

  componentDidMount() {
    this._getMapData()
  }

  componentDidUpdate(prevProps) {
    if (!this.mapRefDidUpdate && this.mapRef?.current !== null) {
      this.mapRef.current.getMap()?.touchZoomRotate?.disableRotation()
      this.mapRef.current.resize() // Force a resize in case missed
      this.mapRefDidUpdate = true
    }
    // if the location changes, query for new data
    if (
      this.props.router?.location?.search !== prevProps.router?.location?.search
    ) {
      this._getMapData()
    }
  }

  render() {
    //create the new viewport before rendering
    const { latitude, longitude } = this.props.mapData.marker
    const { hoveredFeature, lngLat } = this.props.currentFeature
    const { zips } = this.props.mapData
    const { basemapLayer } = this.props.controller
    const { sliderValue } = this.props.controller
    const { searchYear } = this.props.searchState.searchParams
    const { lat, lng, bearing } = this.props.searchState.viewerCoords
    const parcelLayerFilter = createFilterFromParams(
      queryString.parse(window.location.search)
    )

    return (
      <div className="map">
        <ReactMapGL
          ref={this.mapRef}
          // TODO: Don't control view state, but still move around
          initialViewState={this.props.mapState.viewport}
          mapOptions={{ attributionControl: false }}
          mapStyle={basemapLayer}
          width="100vw"
          height="100dvh"
          minZoom={10}
          maxZoom={18}
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={this._onViewportChange}
          touchPitch={false}
          // TODO:
          // onViewportChange={this._onViewportChange}
          interactiveLayerIds={["parcel-polygon"]}
          onMouseMove={this._onHover}
          onClick={(e) => {
            this._handleMapClick(e)
          }}
          onLoad={() => {
            this._handleToggleLoadingIndicator(false)
          }}
          onMouseOut={() => this._removeTooltip()}
          cursor={hoveredFeature ? "pointer" : "auto"}
        >
          {latitude && longitude ? (
            <PraxisMarker
              {...this.props}
              createNewViewport={this._createNewViewport}
            />
          ) : null}
          {lat && lng && bearing ? (
            <Marker
              latitude={lat}
              longitude={lng}
              rotationAlignment="map"
              anchor="bottom"
            >
              <Arrow compassAngle={bearing} />
            </Marker>
          ) : null}
          <Source
            id="parcels-centroids"
            type="vector"
            tiles={[getTileLayer("parcels-centroids", searchYear)]}
            minzoom={8}
            maxzoom={13}
          >
            <Layer
              key="parcel-centroid"
              {...parcelCentroid}
              filter={parcelLayerFilter}
              paint={{
                "circle-radius": 3,
                "circle-color": {
                  property: "own_group",
                  stops: this._stops,
                },
                "circle-opacity": sliderValue / 100,
              }}
            />
          </Source>
          <Source
            id="parcels"
            type="vector"
            tiles={[getTileLayer("parcels", searchYear)]}
            minzoom={13}
            maxzoom={14}
          >
            <Layer
              key="parcel-layer"
              {...parcelLayer}
              paint={{
                "fill-color": {
                  property: "own_group",
                  stops: this._stops,
                },
                "fill-opacity": sliderValue / 100,
              }}
              filter={parcelLayerFilter}
            />
            <Layer key="highlight-parcel-layer" {...parcelHighlightLayer} />
          </Source>

          {hoveredFeature && (
            <Popup
              longitude={lngLat.lng}
              latitude={lngLat.lat}
              closeOnClick={false}
            >
              <div className="tooltip">
                <div>{hoveredFeature.properties.propaddr}</div>
                <div>Speculator: {hoveredFeature.properties.own_id}</div>
                <div>
                  Properties owned: {hoveredFeature.properties.own_count}
                </div>
              </div>
            </Popup>
          )}
          <Source
            id="zips"
            type="geojson"
            data={zips || { type: "FeatureCollection", features: [] }}
          >
            <Layer key="zips-layer" {...zipsLayer} />
            <Layer key="zips-label" {...zipsLabel} />
          </Source>
        </ReactMapGL>
        {/* <ParcelLayerController {...this.props} /> */}
        <BasemapController {...this.props} />
      </div>
    )
  }
}

PraxisMap.propTypes = {
  mapData: PropTypes.shape({
    marker: PropTypes.shape(
      {
        latitude: PropTypes.number.isRequired,
        longitude: PropTypes.number.isRequired,
      }.isRequired
    ),
    ppraxis: PropTypes.object,
    zips: PropTypes.object,
  }).isRequired,
  currentFeature: PropTypes.shape({
    hoveredFeature: PropTypes.oneOfType([
      PropTypes.object.isRequired,
      PropTypes.oneOf([undefined]),
    ]),
  }).isRequired,
  controller: PropTypes.shape({
    filter: PropTypes.array.isRequired,
    sliderValue: PropTypes.number.isRequired,
    basemapLayer: PropTypes.string.isRequired,
  }).isRequired,
  mapState: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
}

export default PraxisMap
