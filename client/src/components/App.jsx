import React, { Component } from "react"
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom"
import { connect } from "react-redux"
import { setDocHeightOnWindow } from "../utils/helper"
import Home from "./pages/Home"
import About from "./pages/About"
import Methodology from "./pages/Methodology"
import MapContainer from "./Map/MapContainer"
import SearchContainer from "./Search/SearchContainer"
import DetailedResultsContainer from "./Search/DetailedResultsContainer"
// import LoadingIndicator from "./LoadingIndicator/LoadingIndicator"
import Error from "./Redirect/Error"
import PPLogo from "./Logo/Logo"

const router = createBrowserRouter([
  {
    element: (
      <div className="app-container">
        <SearchContainer />
        <DetailedResultsContainer />
        <PPLogo />
        {/* TODO: Loading */}
        <Outlet />
      </div>
    ),
    children: [
      {
        errorElement: <Error />,
        children: [
          {
            path: "/",
            element: <Home />,
          },
          {
            path: "/map",
            element: <MapContainer />,
          },
          {
            path: "/methodology",
            element: <Methodology />,
          },
          {
            path: "/about",
            element: <About />,
          },
        ],
      },
    ],
  },
])

class App extends Component {
  componentDidMount() {
    //set window height for mobile
    setDocHeightOnWindow()
  }

  render() {
    return <RouterProvider router={router} />
  }
}

function mapStateToProps({ mapData, mapState, redirect }) {
  return { mapData, mapState, redirect }
}
export default connect(mapStateToProps)(App)
