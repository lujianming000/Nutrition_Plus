/**
 * Creates the chart with necessary nutrients on the chart for groceries.
 * Uses react-bootstrap form to alternate between da=ily and weekly views.
 * 
 * Uses react-chartjs-2.
 * @see https://www.npmjs.com/package/react-chartjs-2
 * 
 * Uses MediaQuery component from react-responsive.
 * @see https://www.npmjs.com/package/react-responsive
 * 
 * Uses Form component from react-bootstrap.
 * @see https://react-bootstrap.github.io/components/forms/
 */

import { useState, useEffect } from 'react'
import MediaQuery from 'react-responsive'
import { HorizontalBar } from 'react-chartjs-2'
import 'chartjs-plugin-annotation'
import firebase from 'firebase'
import firebaseConfig from '../../firebaseConfig'
import { Form } from 'react-bootstrap'
import { connect } from 'react-redux'
import { useRouter } from 'next/router'
import Link from 'next/link'
import resultStyles from '../../styles/QuestionnaireResult.module.css'

// firebase settings
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
let db = firebase.firestore()

const RecipeChart = (props) => {
  const router = useRouter()
  
  // data object used in the chart
  const [data, setData] = useState({})
  // the array containing calculated percentage value of each nutrient
  const [amountsPercentage, setAmountsPercentage] = useState([])
  // daily value of the user
  const [dailyValue, setDailyValue] = useState([])
  // for toggle between weekly and daily calculation
  const [isWeekly, setWeekly] = useState(false)

  // called only when props.nutrients is changed
  useEffect(() => {
    let chartData = {
      labels: null,
      datasets: null
    }

    // if the user is signed in
    if (props.currentUser) {
      // changes each id of nutrients from cart items corresponding to the ones in user's daily value
      if (props.nutrients) {
        // fetches user's daily value from firebase
        db.collection('users').doc(props.currentUser.uid).get().then(userInfo => {
          chartData.labels = ['Fat', 'Fatty acids', 'Fibre', 'Sugars', 'Cholesterol', 'Sodium', 'Potassium', 'Calcium', 'Iron', 'Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'Thiamin', 'Riboflavin', 'Niacin', 'Vitamin B6', 'Folate', 'Vitamin B12', 'Choline', 'Biotin', 'Pantothenate', 'Phosphorous', 'Iodide', 'Magnesium', 'Zinc', 'Selenium', 'Copper', 'Manganese', 'Chromium', 'Molybdenum', 'Chloride']
          setDailyValue(userInfo.data().healthInfo.dailyValue)
    
          // sets initial values for amount of each nutirent (total of 33)
          let amountsArray = []
          for (let i = 0; i < 33; i++) {
            amountsArray[i] = 0
          }
    
          // adds amount of each nutrient
          props.nutrients.forEach(nut => {
            for (let i = 0; i < 33; i++) {
              if (parseInt(nut.id) === i + 1) {
                amountsArray[i] = amountsArray[i] + nut.amount
              } 
            }
          })
    
          // calculates percentage of each nutrient
          let percentageArray = []
          dailyValue.forEach(nut => {
            if (isWeekly) {
              // if user set to weekly
              percentageArray[parseInt(nut.id) - 1] = Math.ceil(100 * amountsArray[parseInt(nut.id) - 1] / (nut.value * 7))
            } else {
              // if user set to daily
              percentageArray[parseInt(nut.id) - 1] = Math.ceil(100 * amountsArray[parseInt(nut.id) - 1] / nut.value)
            }
          })
    
          chartData.datasets = [
            {
              label: 'Your Nutrient Intake (%)',
              backgroundColor: 'rgba(255,99,132,0.2)',
              borderColor: 'rgba(255,99,132,1)',
              borderWidth: 1,
              hoverBackgroundColor: 'rgba(255,99,132,0.4)',
              hoverBorderColor: 'rgba(255,99,132,1)',
              data: percentageArray
            }
          ]
    
          setAmountsPercentage(percentageArray)
          setData({...chartData})
        }).catch(err => console.log(err))
      }
    }
  }, [props.nutrients, isWeekly])

  // toggles between weekly and daily calculation for the chart
  const handleToggleChange = e => {
    setWeekly(prevState => !prevState)
  }

  return (
    <div>
      {
        // if the user's daily value exists
        dailyValue.length > 0
          ?
        <div style={{textAlign: "center"}}>
          <p style={{fontSize: "0.87rem"}}>* If the chart doesn't show its content, please trigger Daily/Weekly toggle.</p>
          <div style={{display: "flex", justifyContent: "center"}}>

            {/* Form component from react-bootstrap */}
            <Form>
              <div style={{display: "flex"}}>
                <p style={{marginRight: "10px"}}>Daily</p>
                <Form.Check 
                  type="switch"
                  id="custom-switch"
                  label=""
                  onChange={handleToggleChange}
                />
                <p>Weekly</p>
              </div>
            </Form>
          </div>

          
          {/* MediaQuery component from react-responsive; for desktop view */}
          <MediaQuery minDeviceWidth={500}>

            {/* HorizontalBar component from react-chartjs-2 */}
            <HorizontalBar 
              data={data}
              options={{
                annotation: {
                  annotations: [{
                    type: "line",
                    mode: "vertical",
                    scaleID: "x-axis-0",
                    value: 100,
                    borderColor: "red",
                    label: {
                      content: "Standard",
                      enabled: true,
                      position: "top"
                    }
                  }]
                }
              }}
              redraw
            />
          </MediaQuery>

          {/* MediaQuery component from react-responsive; for mobile view */}
          <MediaQuery maxDeviceWidth={499}>

            {/* HorizontalBar component from react-chartjs-2 */}
            <HorizontalBar 
              data={data}
              height={430}
              options={{
                annotation: {
                  annotations: [{
                    type: "line",
                    mode: "vertical",
                    scaleID: "x-axis-0",
                    value: 100,
                    borderColor: "red",
                    label: {
                      content: "Standard",
                      enabled: true,
                      position: "top"
                    }
                  }]
                }
              }}
              redraw
            />
          </MediaQuery>
        </div>
          :
        <div className={resultStyles.noValueYet}>
          <h3 className="mb-5">Can't see your nutrition composition chart?</h3>
          <p>You need to evaluate your daily value first to make the chart visible.</p>
          {
            !props.currentUser
              ?
            <p>Or, you need to <Link href="/login"><a>sign in.</a></Link></p>
              :
            null
          }
          <button className={resultStyles.getYourResultButton} onClick={() => router.push("/questionnaire")}>Evaulate your daily value here.</button>
        </div>
      }
    </div>
  )
}

// contains the application's state - the current user object
const mapStateToProps = state => {
  return {
    currentUser: state.currentUser
  }
}

export default connect(mapStateToProps)(RecipeChart)