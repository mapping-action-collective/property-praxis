import React, { useEffect } from "react"
import Footer from "./Footer"
import TopContainer from "./TopContainer"
import nounAbout from "../../assets/img/noun_about.svg"
import { trackPage } from "../../utils/analytics"

const About = () => {
  useEffect(() => {
    trackPage()
  }, [])

  return (
    <main>
      <div className="page-container">
        <TopContainer title="About the Project" />
        <div className="middle-container">
          <div>
            <img src={nounAbout} alt="An illustration of a question mark"></img>
          </div>
          <div>
            <p>
              Property Praxis is a collective exercise illustrating the impact
              of speculation on cities. This map focuses on Detroit.
            </p>
            <p>
              Though speculative practices vary, these activities often change
              the role and use of property in neighborhoods and communities. At
              its most extreme, speculation generates vacancy and abandonment.
              It is often a practice with minimal investment hastening the
              deterioration of houses, commercial, and industrial buildings.
              Speculation is linked to increasing evictions and exploitative
              contracts (Akers and Seymour 2018).
            </p>
            <p>
              What you see on this site are bulk speculative property owners in
              the city of Detroit. It includes the name of owners listed by the
              City of Detroit Assessors Office. It also includes owner or member
              names of Limited Liability Companies (LLCs), shell corporations
              that protect assets and hide identities.
            </p>
            <p>
              The intent is to offer a more complete understanding of how
              speculative property ownership is actively shaping the conditions
              of Detroit neighborhoods. We hope this information allows
              community groups, activists, and individuals to take a more direct
              role in shaping the places they live.
            </p>
            <p>
              For further information:
              <ul>
                <li>
                  <a href="mailto:urbanpraxis@umich.edu?subject=Property Praxis">
                    urbanpraxis@umich.edu
                  </a>
                </li>
                <li>
                  <a
                    href="https://urbanpraxis.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Urbanpraxis.org
                  </a>
                </li>
                <li>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    Detroitography.org
                  </a>
                </li>
              </ul>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    </main>
  )
}

export default About
