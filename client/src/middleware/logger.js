// eslint-disable-next-line
const logger = (store) => (next) => (action) => {
  // console.group(action.type)
  // console.log("The action: ", action)
  //this is like dispatching an action
  //to get the next state
  const returnValue = next(action)
  // console.log("The new state: ", store.getState())
  // console.groupEnd()

  return returnValue
}

export default logger
