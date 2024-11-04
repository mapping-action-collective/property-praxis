import React, { useEffect } from "react"
import Footer from "./Footer"
import TopContainer from "./TopContainer"
import nounMethodologies from "../../assets/img/noun_methodologies.svg"
import { trackPage } from "../../utils/analytics"

const Methodology = () => {
  useEffect(() => {
    trackPage()
  }, [])

  return (
    <main>
      <div className="page-container">
        <TopContainer title="Methodology" />
        <div className="middle-container">
          <div>
            <img
              src={nounMethodologies}
              alt="An illustration of a lightbulb"
            ></img>
          </div>
          <div>
            <p>
              This project relies heavily on the accuracy and availability of
              public data provided by the City of Detroit via the City Assessor.
              The project is focused on examining bulk ownership, which is
              defined as ten or more properties. We pull all owners of ten or
              more properties from the parcel file that we annually download
              from the City of Detroit on September 1st.
            </p>
            <p>
              We update the assessor data with Wayne County Tax Foreclosure
              sales as these are not currently included in the Assessor data. We
              manually review corporation filings with the State of Michigan or
              the state in which Limited Liability Corporations are
              incorporated. From these records we identify company ownership. We
              sample property conditions for owners utilizing street view
              products from Google and Mapillary.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    </main>
  )
}

export default Methodology
