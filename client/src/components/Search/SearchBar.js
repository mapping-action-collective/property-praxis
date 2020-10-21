import React, { Component } from "react";
import { DebounceInput } from "react-debounce-input";
import PropTypes from "prop-types";
import {
  resetSearch,
  handlePrimarySearchQuery,
  handlePrimarySearchAll,
} from "../../actions/search";
import { parseURLParams } from "../../utils/parseURL";
import {
  capitalizeFirstLetter,
  sanitizeSearchResult,
  createQueryStringFromSearch,
} from "../../utils/helper";
import PrimaryResultsContainer from "./SearchResults";
import * as searchIcon from "../../assets/img/search.png";
import styleVars from "../../scss/colors.scss";

// use this object to reset
const resetSearchOptions = {
  searchTerm: "",
  searchType: "all",
  searchCoordinates: null,
  primaryResults: [],
  fullResults: [],
  searchDisplayType: null,
};

const primarySearchRoutes = {
  addressRoute: `/api/address-search/partial/`,
  speculatorRoute: `/api/speculator-search/partial/`,
  zipcodeRoute: `/api/zipcode-search/partial/`,
};

class SearchBar extends Component {
  _searchButons = ["all", "address", "speculator", "zipcode"];

  /*Passed down to Search Results.
  Changes the URL query*/
  _setSearchLocationParams = (result) => {
    const { searchYear } = this.props.searchState;
    if (result) {
      const route = createQueryStringFromSearch(
        sanitizeSearchResult({
          result,
          year: searchYear,
        })
      );

      this.props.history.push(route);
    }
  };

  _setSearchStateParams = ({
    searchType,
    searchTerm,
    searchYear,
    searchCoordinates,
  }) => {
    this.props.dispatch(
      resetSearch({
        searchType,
        searchTerm,
        searchYear,
        searchCoordinates, //only set when type==="address"
        primaryResults: [],
      })
    );
  };

  _setSearchPlaceholderText = (searchType) => {
    switch (searchType) {
      case "all":
        return "Search Property Praxis...";
      case "address":
        return "Search Adresses...";
      case "speculator":
        return "Search Speculators...";
      case "zipcode":
        return "Search Zipcodes...";
      case "home":
        return "Search for an address, speculator, or zipcode...";
      default:
        return "Search Property Praxis...";
    }
  };

  _handleQueryPrimaryResults = ({ searchType, searchTerm, searchYear }) => {
    const { addressRoute, speculatorRoute, zipcodeRoute } = primarySearchRoutes;

    if (searchType && searchTerm && searchYear) {
      if (searchType === "address") {
        this.props.dispatch(
          handlePrimarySearchQuery({
            searchTerm,
            searchYear,
            route: addressRoute,
          })
        );
      } else if (searchType === "speculator") {
        this.props.dispatch(
          handlePrimarySearchQuery({
            searchTerm,
            searchYear,
            route: speculatorRoute,
          })
        );
      } else if (searchType === "zipcode") {
        this.props.dispatch(
          handlePrimarySearchQuery({
            searchTerm,
            searchYear,
            route: zipcodeRoute,
          })
        );
      } else if (searchType === "all") {
        this.props.dispatch(
          handlePrimarySearchAll(searchTerm, searchYear, [
            addressRoute,
            speculatorRoute,
            zipcodeRoute,
          ])
        );
      } else {
        throw new Error("This searchtype does not exit.");
      }
    }
  };

  _handleOnChange = async (e) => {
    const searchTerm = e.target.value;
    const { searchType, searchYear } = this.props.searchState;

    this._handleQueryPrimaryResults({
      searchType,
      searchTerm,
      searchYear,
    });
  };

  _handleOnFocus = () => {
    const { searchTerm, searchType, searchYear } = this.props.searchState;
    this._handleQueryPrimaryResults({
      searchType,
      searchTerm,
      searchYear,
    });
  };

  _handleOnBlur = () => {
    // this.props.dispatch(
    //   resetSearch({
    //     primaryResults: [],
    //   })
    // );
  };

  _handleSearchTypeButtonClick = (buttonType) => {
    this.props.dispatch(
      resetSearch({
        searchTerm: "",
        searchType: buttonType,
        searchCoordinates: null,
        primaryResults: [],
        fullResults: [],
      })
    );
  };

  _handleKeyPress = (e) => {
    const { primaryResults } = this.props.searchState;
    // if it is an enter key press
    if (e.key === "Enter") {
      // the index value here will need to be changed to be more dynamic
      this._setSearchLocationParams(primaryResults[0]);
    }

    if (e.key /*=== down or up*/) {
      //logic here
    }
  };

  _handleSearchButtonClick = () => {
    const { primaryResults } = this.props.searchState;
    this._setSearchLocationParams(primaryResults);
  };

  _handleYearSelect = (e) => {
    this.props.dispatch(resetSearch({ searchYear: e.target.value }));
  };

  componentDidMount() {
    // parse URL and dispatch params
    const { search: searchQuery } = this.props.history.location;
    const {
      searchType,
      searchTerm,
      searchCoordinates,
      searchYear,
    } = parseURLParams(searchQuery);
    this._setSearchStateParams({
      searchType,
      searchTerm,
      searchCoordinates,
      searchYear,
    });
  }

  componentDidUpdate(prevProps) {
    // set search if the full query string changes
    const { search: searchQuery } = this.props.history.location;
    if (prevProps.location.search !== searchQuery) {
      // parse URL and dispatch params
      const {
        searchType,
        searchTerm,
        searchYear,
        searchCoordinates,
      } = parseURLParams(searchQuery);
      this._setSearchStateParams({
        searchType,
        searchTerm,
        searchYear,
        searchCoordinates,
      });
    }
  }

  render() {
    const { searchType, searchTerm, searchYear } = this.props.searchState;
    const { years } = this.props.mapData;
    const { searchBarType, showSearchButtons } = this.props;

    if (years) {
      return (
        <section
          className={
            searchBarType === "grid-item"
              ? "search-grid-item"
              : "search-modal-item"
          }
        >
          <div className="search-container">
            {showSearchButtons ? (
              <div className="search-options">
                {this._searchButons.map((button) => {
                  return (
                    <div
                      key={button}
                      onClick={() => {
                        this._handleSearchTypeButtonClick(button);
                      }}
                      style={
                        button === searchType
                          ? { color: styleVars.ppRose }
                          : null
                      }
                    >
                      {capitalizeFirstLetter(button)}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="search-bar">
              <div className="year-select">
                <select id="years" onChange={this._handleYearSelect}>
                  {years.map((result) => (
                    <option
                      key={result.praxisyear}
                      selected={result.praxisyear.toString() === searchYear}
                    >
                      {result.praxisyear}
                    </option>
                  ))}
                </select>
              </div>
              <div
                className={
                  showSearchButtons ? "search-form" : "search-form-home"
                }
              >
                <div
                  className="clear-button"
                  onClick={() => {
                    this.props.dispatch(resetSearch({ ...resetSearchOptions }));
                  }}
                >
                  &times;
                </div>
                <DebounceInput
                  type="text"
                  size="1"
                  placeholder={
                    showSearchButtons
                      ? this._setSearchPlaceholderText(searchType)
                      : this._setSearchPlaceholderText("home")
                  }
                  value={searchTerm} //controlled input
                  minLength={1}
                  debounceTimeout={300}
                  inputRef={(ref) => {
                    //create a ref to the input
                    this._textInput = ref;
                  }}
                  onChange={this._handleOnChange}
                  onKeyPress={(event) => {
                    event.persist();
                    this._handleKeyPress(event);
                  }}
                  // onFocus={this._handleOnFocus}
                  // onBlur={this._handleOnBlur}
                />
                <div
                  className="search-button"
                  onClick={this._handleSearchButtonClick}
                >
                  <img src={searchIcon} alt="search button"></img>
                </div>
              </div>
            </div>
            <PrimaryResultsContainer
              {...this.props}
              setSearchLocationParams={this._setSearchLocationParams}
            />
          </div>
        </section>
      );
    }

    return null;
  }
}

SearchBar.propTypes = {
  searchBarType: PropTypes.string.isRequired,
  showSearchButtons: PropTypes.bool.isRequired,
  searchState: PropTypes.shape({
    searchType: PropTypes.string.isRequired,
    searchTerm: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.oneOf([null]),
    ]),
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
};

export default SearchBar;
