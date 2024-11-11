import React, { Component } from "react"
import { connect } from "react-redux"
import { withRouter } from "../../utils/router"
import PropTypes from "prop-types"
import SearchBar from "./SearchBar"

/* The SearchContainer passes the avaialble years
for selection to SearchBar */
class SearchContainer extends Component {
  render() {
    return (
      <SearchBar
        searchBarType="grid-item"
        showSearchButtons={true}
        {...this.props}
      />
    )
  }
}

SearchContainer.propTypes = {
  searchState: PropTypes.object.isRequired,
}

function mapStateToProps({ searchState, mapData, mapState, results }) {
  return { searchState, mapData, mapState, results }
}

export default withRouter(connect(mapStateToProps)(SearchContainer))
