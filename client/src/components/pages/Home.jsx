import React, { useEffect } from "react"
import { connect } from "react-redux"
import PropTypes from "prop-types"
import SearchBar from "../Search/SearchBar"
import Footer from "./Footer"
import nounMarketingRealEstate2 from "../../assets/img/noun_marketing_real estate_2.svg"
import nounMarketingRealEstate from "../../assets/img/noun_marketing_real_estate.svg"
import nounLandlordTenant from "../../assets/img/noun_Landlord_Tenant.svg"
import logoTransparent from "../../assets/img/pp_logo_transparent.png"
import { trackPage } from "../../utils/analytics"

const Home = (props) => {
  useEffect(() => {
    trackPage()
  }, [])

  return (
    <main className="page-container">
      <div className="header-container">
        <div className="home-logo-container">
          <div className="home-logo">
            <img src={logoTransparent} alt="Property Praxis logo"></img>
          </div>
          <header>
            Explore Yearly Bulk Ownership & Speculation in Detroit
          </header>
        </div>
        <div className="home-search-container">
          <SearchBar
            searchBarType="modal-item"
            showSearchButtons={false}
            {...props}
          />
        </div>
      </div>
      <div>
        <div>
          <div className="home-general-search-container">
            <aside>
              <h2>Who are the worst speculators?</h2>
              <img
                src={nounMarketingRealEstate2}
                alt="An illustration of an investor"
              ></img>
              <p>
                Explore by zipcode or address to reveal who the top speculators
                in your area are.
              </p>
            </aside>
            <aside>
              <h2>What properties does a speculator own?</h2>
              <img
                src={nounMarketingRealEstate}
                alt="An illustration of a speculator"
              ></img>
              <p>
                Search a speculator by name to reveal the properties they own in
                the Detroit area.
              </p>
            </aside>
            <aside>
              <h2>Does a speculator own my property?</h2>
              <img
                src={nounLandlordTenant}
                alt="An illustration of hands passing a key to another hand"
              ></img>
              <p>
                Search your address to discover if a speculator owns your
                property.
              </p>
            </aside>
          </div>
          <div className="home-description">
            <aside>
              <p>
                Blight and abandonment are active process. This site shows part
                of that process. It maps bulk ownership and speculation in the
                city. It identifies the owners and members of limited liability
                companies holding multiple properties across the city. Over the
                last decade speculation has further damaged Detroit’s struggling
                neighborhoods and made life difficult for residents and tenants.
                {/* We hope you find this information useful in understanding your
                landlord, your neighborhood, or part of the reason why some
                Detroit neighborhoods look the way they do. */}
              </p>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

Home.propTypes = {
  searchState: PropTypes.object.isRequired,
  mapData: PropTypes.object.isRequired,
  mapState: PropTypes.object.isRequired,
  results: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
}

function mapStateToProps({ searchState, mapData, mapState, results = {} }) {
  return { searchState, mapData, mapState, results }
}

export default connect(mapStateToProps)(Home)
