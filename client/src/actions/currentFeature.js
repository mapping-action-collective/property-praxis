export const GET_HOVERED_FEATURE = "GET_HOVERED_FEATURE"

export function getHoveredFeatureAction(feature) {
  return {
    type: GET_HOVERED_FEATURE,
    payload: feature,
  }
}
