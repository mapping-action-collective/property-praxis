import { GET_MAP_STATE, GET_MAP_PARAMS } from "../actions/mapState";

const initialMapState = {
  viewport: {
    latitude: 42.40230199308517,
    longitude: -83.11182404081912,
    zoom: 10,
    bearing: 0,
    pitch: 0,
  },
  // params: {
  //   type: null, // maybe remove this
  //   search: null, //maybe remove these
  //   coordinates: null,
  //   year: "2020",
  // },
};

export default function mapState(state = initialMapState, action) {
  switch (action.type) {
    case GET_MAP_STATE:
      return { ...state, ...action.payload };
    // case GET_MAP_PARAMS:
    //   return { ...state, ...action.payload };
    default:
      return state;
  }
}
