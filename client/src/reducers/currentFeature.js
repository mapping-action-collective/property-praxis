import { GET_HOVERED_FEATURE } from "../actions/currentFeature"

const initialState = {
  hoveredFeature: null,
}

export default function currentFeature(state = initialState, action) {
  switch (action.type) {
    case GET_HOVERED_FEATURE:
      return { ...state, ...action.payload }
    default:
      return state
  }
}
