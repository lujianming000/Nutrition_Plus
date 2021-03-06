/**
 * Searches a grocery item from the USDA API and displays its nutritional facts.
 * 
 * Uses React Bootstrap Button for buttons, and Pagination to help with navigating
 * through larger queries. InputGroup and FormControl are used for the search field. 
 * Dropdown & Dropdown Button is used to hold a list of MyCart food items.
 * 
 * Button
 * @see https://react-bootstrap.github.io/components/buttons/
 * 
 * Pagination
 * @see https://react-bootstrap.github.io/components/pagination/
 * 
 * InputGroup
 * @see https://react-bootstrap.github.io/components/input-group/
 * 
 * FormControl
 * @see https://react-bootstrap.github.io/components/forms/#form-control-props
 * 
 * Dropdown
 * @see https://react-bootstrap.github.io/components/dropdowns/
 * 
 * Uses React Icons to help customize design of buttons.
 * 
 * FaSearch and FaShoppingCart from Font Awesome library
 * @see https://fontawesome.com/
 */

import firebase from 'firebase'
import firebaseConfig from '../firebaseConfig'
import searchStyles from '../styles/ItemSearch.module.css'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { connect } from 'react-redux'
import { Button, Pagination, InputGroup, FormControl, DropdownButton, Dropdown } from 'react-bootstrap'
import { FaSearch, FaShoppingCart } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { EDAMAM_RECIPE_APP_ID, EDAMAM_RECIPE_APP_KEY } from '../apiKey'

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
let db = firebase.firestore()

const RecipeSearch = (props) => {
  const [search, setSearch] = useState("")
  const [result, setResult] = useState([])
  const [pagination, setPagination] = useState([])
  const [totalPages, setTotalPages] = useState()
  const [error, setError] = useState(null)

  const url = `/search?app_id=${EDAMAM_RECIPE_APP_ID}&app_key=${EDAMAM_RECIPE_APP_KEY}`
  
  const pageSizeLimit = 10
  const searchLimit = 100

  const router = useRouter()
  const item = router.query.item

  // my cart with quantity
  const [myCart, setCart] = useState([])

  useEffect(() => {
    //handle myCart
    if (props.currentUser) {
      db.collection('users').doc(props.currentUser.uid).get().then(userInfo => {
        let arrayWithQuantity = getQuantity(userInfo.data().cart)
        setCart(sortArrayAlphabetically(arrayWithQuantity))
      })
    }

    //handle href
    if (item != null) {
      handleMyCartQuery(item)
    }
  }, [])


  // updates value in search field
  const handleSearchInput = e => {
    let value = e.target.value
    setSearch(value)
  }

  // obtains values from API by using search as query and pageSize to display 10 results per page
  const handleSearchQuery = e => {
    let results = []

    axios.get(url, {
      params: {
        q: search,
        to: pageSizeLimit - 1,
      }
    }).then(
      res => {
        setError(null)

        res.data.hits.forEach(item => results.push(item))
        setResult(results)
        let noPages = searchLimit / pageSizeLimit
        setTotalPages(noPages)
        if (noPages > 5) {  // if number of pages is > 5
            // console.log("over five")
            let paginationItems = []
            for (let number = 1; number <= 5; number++) {
            paginationItems.push(
                <Pagination.Item 
                    key={number} 
                    onClick={() => {handlePagination(number, noPages, search)}}
                    active={1 === number}>
                    {number}
                </Pagination.Item>
            )
          }
          paginationItems.push(<Pagination.Next key="next" onClick={() => {handleNext(1, noPages, search)}}/>)
          setPagination(paginationItems)
        } else {    // if number of pages is < 5
            // console.log("under five")
            let paginationItems = []
            for (let number = 1; number <= noPages; number++) {
                paginationItems.push(
                <Pagination.Item 
                  key={number} 
                  onClick={() => {handlePagination(number)}}
                  active={1 === number}>
                    {number}
                </Pagination.Item>
                )
            }
            setPagination(paginationItems)
        }
      }
    ).catch(err => {
      setError({
        data: err.response.data,
        status: err.response.status,
        statusText: err.response.statusText
      })
    })
}

// << arrow
const handleFirst = (number, totalPages, search) => {
    const prevNumber = number - 5
    if (prevNumber > 0) {
      let results = []
      axios.get(url, {
        params: {
          q: search,
          from: pageSizeLimit * (prevNumber - 1),
          to: (pageSizeLimit * prevNumber) - 1,
        }
      }).then(res => {
        setError(null)
        res.data.hits.forEach(item => results.push(item))
        setResult(results)
      }).catch(err => {
        setError({
          data: err.response.data,
          status: err.response.status,
          statusText: err.response.statusText
        })
      })
      let paginationItems = []
      if (prevNumber > 3) {
        paginationItems.push(<Pagination.First key="first" onClick={() => {handleFirst(prevNumber, totalPages, search)}}/>)
        paginationItems.push(<Pagination.Prev key="prev" onClick={() => {handlePrev(prevNumber, totalPages, search)}}/>)
        paginationItems.push(<Pagination.Item key="firstPage" onClick={() => {handleNumberOne(totalPages, search)}}>{1}</Pagination.Item>)
        paginationItems.push(<Pagination.Ellipsis key="ell1" disabled/>)
        for (let i = prevNumber - 2; i <= prevNumber + 2; i++) {
          paginationItems.push(
            <Pagination.Item 
              key={i} 
              onClick={() => {handlePagination(i, totalPages, search)}}
              active={prevNumber === i}>
              {i}
            </Pagination.Item>
          )
        }
        paginationItems.push(<Pagination.Ellipsis key="ell2" disabled/>)
        paginationItems.push(<Pagination.Item key="lastPage" onClick={() => {handleNumberLast(totalPages, search)}}>{totalPages}</Pagination.Item>)
        paginationItems.push(<Pagination.Next key="next" onClick={() => {handleNext(prevNumber, totalPages, search)}}/>)
        paginationItems.push(<Pagination.Last key="last" onClick={() => {handleLast(prevNumber, totalPages, search)}}/>)
        setPagination(paginationItems)
      }
    }
  }
  
  // < arrow
  const handlePrev = (number, totalPages, search) => {
    const prevNumber = number - 1
    let results = []
    axios.get(url, {
      params: {
        q: search,
        from: pageSizeLimit * (prevNumber - 1),
        to: (pageSizeLimit * prevNumber) - 1,
      }
    }).then(res => {
      setError(null)
      res.data.hits.forEach(item => results.push(item))
      setResult(results)
    }).catch(err => {
      setError({
        data: err.response.data,
        status: err.response.status,
        statusText: err.response.statusText
      })
    })
    let paginationItems = []
    if (prevNumber > totalPages - 3) {
      paginationItems.push(<Pagination.Prev key="less" onClick={() => {handlePrev(prevNumber, totalPages, search)}}/>)
      for (let i = totalPages - 4; i <= totalPages; i++) {
        paginationItems.push(
          <Pagination.Item 
          key={i} 
          onClick={() => {handlePagination(prevNumber, totalPages, search)}}
          active={prevNumber === i}>
            {i}
          </Pagination.Item>
        )
      }
      setPagination(paginationItems)
    }
    if (prevNumber > 3 && prevNumber <= totalPages - 3) {
      // console.log("sdfasdfasdf")
      paginationItems.push(<Pagination.First key="first" onClick={() => {handleFirst(prevNumber, totalPages, search)}}/>)
      paginationItems.push(<Pagination.Prev key="prev" onClick={() => {handlePrev(prevNumber, totalPages, search)}}/>)
      paginationItems.push(<Pagination.Item key="firstPage" onClick={() => {handleNumberOne(totalPages, search)}}>{1}</Pagination.Item>)
      paginationItems.push(<Pagination.Ellipsis key="ell1" disabled/>)
      for (let i = prevNumber - 2; i <= prevNumber + 2; i++) {
        paginationItems.push(
          <Pagination.Item 
            key={i} 
            onClick={() => {handlePagination(i, totalPages, search)}}
            active={prevNumber === i}>
            {i}
          </Pagination.Item>
        )
      }
      paginationItems.push(<Pagination.Ellipsis key="ell2" disabled/>)
      paginationItems.push(<Pagination.Item key="lastPage" onClick={() => {handleNumberLast(totalPages, search)}}>{totalPages}</Pagination.Item>)
      paginationItems.push(<Pagination.Next key="next" onClick={() => {handleNext(prevNumber, totalPages, search)}}/>)
      paginationItems.push(<Pagination.Last key="last" onClick={() => {handleLast(prevNumber, totalPages, search)}}/>)
      setPagination(paginationItems)
    }
    if (prevNumber <= 3) {
      for (let number = 1; number <= 5; number++) {
        paginationItems.push(
          <Pagination.Item 
            key={number} 
            onClick={() => {handlePagination(number, totalPages, search)}}
            active={prevNumber === number}>
            {number}
          </Pagination.Item>
        )
      }
      paginationItems.push(<Pagination.Next key="next" onClick={() => {handleNext(prevNumber, totalPages, search)}}/>)
      setPagination(paginationItems)
    }
  }

  // first page
  const handleNumberOne = (totalPages, search) => {
    let results = []
    const numberOne = 1
    axios.get(url, {
      params: {
        q: search,
        from: 0,
        to: pageSizeLimit - 1,
      }
    }).then(res => {
      setError(null)
      res.data.hits.forEach(item => results.push(item))
      setResult(results)
    }).catch(err => {
      setError({
        data: err.response.data,
        status: err.response.status,
        statusText: err.response.statusText
      })
    })
    let paginationItems = []
    for (let number = 1; number <= 5; number++) {
      paginationItems.push(
        <Pagination.Item 
            key={number} 
            onClick={() => {handlePagination(number, totalPages, search)}}
            active={1 === number}>
          {number}
        </Pagination.Item>
      )
    }
    paginationItems.push(<Pagination.Next key="more" onClick={() => {handleNext(numberOne, totalPages, search)}}/>)
    setPagination(paginationItems)
  }

  // last number
  const handleNumberLast = (totalPages, search) => {
    let results = []
    const numberLast = totalPages
    axios.get(url, {
      params: {
        q: search,
        from: pageSizeLimit * (numberLast - 1),
        to: (pageSizeLimit * numberLast) - 1,
      }
    }).then(res => {
      setError(null)
      res.data.hits.forEach(item => results.push(item))
      setResult(results)
    }).catch(err => {
      setError({
        data: err.response.data,
        status: err.response.status,
        statusText: err.response.statusText
      })
    })
    let paginationItems = []
    paginationItems.push(<Pagination.Prev key="less" onClick={() => {handlePrev(numberLast, totalPages, search)}}/>)
    for (let number = totalPages - 4; number <= totalPages; number++) {
      paginationItems.push(
        <Pagination.Item 
            key={number} 
            onClick={() => {handlePagination(number, totalPages, search)}}
            active={numberLast === number}>
          {number}
        </Pagination.Item>
      )
    }
    setPagination(paginationItems)
  }

  // > arrow
  const handleNext = (number, totalPages, search) => {
    let nextNumber = number + 1
    let results = []
    axios.get(url, {
      params: {
        q: search,
        from: pageSizeLimit * number,
        to: (pageSizeLimit * nextNumber) - 1,
      }
    }).then(res => {
      setError(null)
      res.data.hits.forEach(item => results.push(item))
      setResult(results)
    }).catch(err => {
      setError({
        data: err.response.data,
        status: err.response.status,
        statusText: err.response.statusText
      })
    })
    let paginationItems = []
    if (nextNumber < 4) {
      for (let number = 1; number <= 5; number++) {
        paginationItems.push(
          <Pagination.Item 
            key={number} 
            onClick={() => {handlePagination(nextNumber, totalPages, search)}}
            active={nextNumber === number}>
            {number}
          </Pagination.Item>
        )
      }
      paginationItems.push(<Pagination.Next key="more" onClick={() => {handleNext(nextNumber, totalPages, search)}}/>)
      setPagination(paginationItems)
    }
    if (nextNumber >= 4 && nextNumber < totalPages - 2) {
      paginationItems.push(<Pagination.First key="first" onClick={() => {handleFirst(nextNumber, totalPages, search)}}/>)
      paginationItems.push(<Pagination.Prev key="prev" onClick={() => {handlePrev(nextNumber, totalPages, search)}}/>)
      paginationItems.push(<Pagination.Item key="firstPage" onClick={() => {handleNumberOne(totalPages, search)}}>{1}</Pagination.Item>)
      paginationItems.push(<Pagination.Ellipsis key="ell1" disabled/>)
      for (let i = nextNumber - 2; i <= nextNumber + 2; i++) {
        paginationItems.push(
          <Pagination.Item 
            key={i} 
            onClick={() => {handlePagination(i, totalPages, search)}}
            active={nextNumber === i}>
            {i}
          </Pagination.Item>
        )
      }
      paginationItems.push(<Pagination.Ellipsis key="ell2" disabled/>)
      paginationItems.push(<Pagination.Item key="lastPage" onClick={() => {handleNumberLast(totalPages, search)}}>{totalPages}</Pagination.Item>)
      paginationItems.push(<Pagination.Next key="next" onClick={() => {handleNext(nextNumber, totalPages, search)}}/>)
      paginationItems.push(<Pagination.Last key="last" onClick={() => {handleLast(nextNumber, totalPages, search)}}/>)
      setPagination(paginationItems)
    }
    if (nextNumber >= totalPages - 2) {
      paginationItems.push(<Pagination.Prev key="less" onClick={() => {handlePrev(nextNumber, totalPages, search)}}/>)
      for (let number = totalPages - 4; number <= totalPages; number++) {
        paginationItems.push(
          <Pagination.Item 
            key={number} 
            onClick={() => {handlePagination(number, totalPages, search)}}
            active={nextNumber === number}>
            {number}
          </Pagination.Item>
        )
      }
      setPagination(paginationItems)
    }
  }

  // >> arrow
  const handleLast = (number, totalPages, search) => {
    let nextNumber = number + 5
    if (nextNumber <= totalPages) {
      let results = []
      axios.get(url, {
        params: {
          q: search,
          from: pageSizeLimit * (nextNumber - 1),
          to: (pageSizeLimit * nextNumber) - 1,
        }
      }).then(res => {
        setError(null)
        res.data.hits.forEach(item => results.push(item))
        setResult(results)
      }).catch(err => {
        setError({
          data: err.response.data,
          status: err.response.status,
          statusText: err.response.statusText
        })
      })
      let paginationItems = []
      if (nextNumber < totalPages - 1) {
        paginationItems.push(<Pagination.First key="first" onClick={() => {handleFirst(nextNumber, totalPages, search)}}/>)
        paginationItems.push(<Pagination.Prev key="prev" onClick={() => {handlePrev(nextNumber, totalPages, search)}}/>)
        paginationItems.push(<Pagination.Item key="firstPage" onClick={() => {handleNumberOne(totalPages, search)}}>{1}</Pagination.Item>)
        paginationItems.push(<Pagination.Ellipsis key="ell1" disabled/>)
        for (let i = nextNumber - 2; i <= nextNumber + 2; i++) {
          paginationItems.push(
            <Pagination.Item 
              key={i} 
              onClick={() => {handlePagination(i, totalPages, search)}}
              active={nextNumber === i}>
              {i}
            </Pagination.Item>
          )
        }
        paginationItems.push(<Pagination.Ellipsis key="ell2" disabled/>)
        paginationItems.push(<Pagination.Item key="lastPage" onClick={() => {handleNumberLast(totalPages, search)}}>{totalPages}</Pagination.Item>)
        paginationItems.push(<Pagination.Next key="next" onClick={() => {handleNext(nextNumber, totalPages, search)}}/>)
        paginationItems.push(<Pagination.Last key="last" onClick={() => {handleLast(nextNumber, totalPages, search)}}/>)
        setPagination(paginationItems)
      }
    }
  }

  // handles the results of each numbered page
  const handlePagination = (number, totalPages, search) => {
    const prevNum = number - 1;
    let results = []
    axios.get(url, {
      params: {
        q: search,
        from: pageSizeLimit * prevNum,
        to: (pageSizeLimit * number) - 1,
      }
    }).then(res => {
      setError(null)
      res.data.hits.forEach(item => results.push(item))
      setResult(results)
    }).catch(err => {
      setError({
        data: err.response.data,
        status: err.response.status,
        statusText: err.response.statusText
      })
    })
    let paginationItems = []
    if (number < 4) {
      for (let i = 1; i <= 5; i++) {
        paginationItems.push(
          <Pagination.Item 
            key={i} 
            onClick={() => {handlePagination(i, totalPages, search)}}
            active={number === i}>
            {i}
          </Pagination.Item>
        )
      }
      paginationItems.push(<Pagination.Next key="more" onClick={() => {handleNext(number, totalPages, search)}}/>)
      setPagination(paginationItems)
    }
    if (number >= 4 && number < totalPages - 2) {
      paginationItems.push(<Pagination.First key="first" onClick={() => {handleFirst(number, totalPages, search)}}/>)
      paginationItems.push(<Pagination.Prev key="prev" onClick={() => {handlePrev(number, totalPages, search)}}/>)
      paginationItems.push(<Pagination.Item key="firstPage" onClick={() => {handleNumberOne(totalPages, search)}}>{1}</Pagination.Item>)
      paginationItems.push(<Pagination.Ellipsis key="ell1" disabled/>)
      for (let i = number - 2; i <= number + 2; i++) {
        paginationItems.push(
          <Pagination.Item 
            key={i} 
            onClick={() => {handlePagination(i, totalPages, search)}}
            active={number === i}>
            {i}
          </Pagination.Item>
        )
      }
      paginationItems.push(<Pagination.Ellipsis key="ell2" disabled/>)
      paginationItems.push(<Pagination.Item key="lastPage" onClick={() => {handleNumberLast(totalPages, search)}}>{totalPages}</Pagination.Item>)
      paginationItems.push(<Pagination.Next key="next" onClick={() => {handleNext(number, totalPages, search)}}/>)
      paginationItems.push(<Pagination.Last key="last" onClick={() => {handleLast(number, totalPages, search)}}/>)
      setPagination(paginationItems)
    }
    if (number >= totalPages - 2) {
      paginationItems.push(<Pagination.Prev key="less" onClick={() => {handlePrev(number, totalPages, search)}}/>)
      for (let i = totalPages - 4; i <= totalPages; i++) {
        paginationItems.push(
          <Pagination.Item 
            key={i} 
            onClick={() => {handlePagination(i, totalPages, search)}}
            active={number === i}>
            {i}
          </Pagination.Item>
        )
      }
      setPagination(paginationItems)
    }
  }

  // MyCart - gets quantity of each item from repeating single items
  const getQuantity = (arr) => {
    let result = []
    let visited = []
    if (arr.length >= 2) {
      let foodItem
      for (let i = 0; i < arr.length - 1; i++) {
        let qty = 1
        for (let j = i + 1; j < arr.length; j++) {
          if(arr[i]['fdcId'] === arr[j]['fdcId']) {
            qty++
          }
        }
        
        foodItem = {
          quantity: qty,
          ...arr[i]
        }
        if (!visited.includes(arr[i]['fdcId'])) {
          result.push(foodItem)
        }
        visited.push(arr[i]['fdcId'])
      }
      // last element of the array
      foodItem = {
        quantity: 1,
        ...arr[arr.length - 1]
      }
      if (!visited.includes(arr[arr.length - 1]['fdcId'])) {
        result.push(foodItem)
      }
      // if there is only one item left
    } else if (arr.length === 1) {
      let foodItem = {
        quantity: 1,
        ...arr[0]
      }
      if (!visited.includes(arr[0]['fdcId'])) {
        result.push(foodItem)
      }
      visited.push(arr[0]['fdcId'])
    }
    return result
  }

  // MyCart - sort array by alphabetical order
  const sortArrayAlphabetically = (arr) => {
    return arr.sort((a, b) => a.description > b.description ? 1 : -1)
  }

  // encodes search item to URI for href to recipe details
  const getURI = (item) => {
    const searchTerm = "recipe_";
    const lengthSearch = searchTerm.length;
  
    let index = item.indexOf(searchTerm) + lengthSearch;
  
    let uri = item.substr(index);
    return uri;
  }

  // fills out search fiell with food item from MyCart
  const handleMyCartQuery = (query) => {

    const promiseSearch = new Promise((resolve, reject) => {
      document.getElementById("searchInput").value = query
      setSearch(query)
      resolve()
    })

    promiseSearch.then( (success, error) => {
      document.getElementById("searchButton").click()
    })
    
  }
  
  // HTML elements
  return (
    <div className={searchStyles.body}>
      <h1 className={searchStyles.title}>Find a Meal</h1>

      <div className={searchStyles.container}>

      <div className={searchStyles.searchContainer}>

        {/* InputGroup component from react-bootstrap */}
        <InputGroup>

          {/* Dropdown component from react-bootstrap */}
          <DropdownButton
            id="myCartAppend"
            as={InputGroup.Prepend}
            variant="success"
            title={<FaShoppingCart />}
          >
            {
              props.currentUser
              ?
              <span>
                <Dropdown.Header><i>Choose an Item from My Cart</i></Dropdown.Header>
                {
                  myCart.map(food => {
                    return(
                      <Dropdown.Item onClick={handleMyCartQuery.bind(this, food.description)}>{food.description}</Dropdown.Item>
                    )
                  })
                }
              </span>
              :
              <Dropdown.Header><i>Please Sign In First.</i></Dropdown.Header>
            }
          </DropdownButton>

          {/* FormControl component from react-bootstrap */}
          <FormControl
            id="searchInput"
            placeholder="Search Recipes..."
            onChange={handleSearchInput}
          />
          <Button
            className={searchStyles.button}
            id="searchButton"
            as={InputGroup.Append}
            variant="primary"
            onClick={handleSearchQuery}>
              <FaSearch />
          </Button>
        </InputGroup>    
      </div>

        <ul className={searchStyles.listCards}>

          {/* Loops through result array and displays each item */}
          {
            !error
              ?
            result.map(item => {
              return(
                <li 
                  key={getURI(item.recipe.uri)} 
                  className={searchStyles.card}>
                    <Link 
                      href={{ 
                        pathname: "/recipe/[recipeId]", 
                        query: { 
                          search: `${search}`,
                          prevPage: "/recipe"
                        } 
                      }}
                      as={`/recipe/${getURI(item.recipe.uri)}`}
                    >
                      <a className={searchStyles.itemLink}>
                        <img className={searchStyles.itemImage} src={item.recipe.image} alt={item.recipe.label} />
                        <b>{item.recipe.label}</b>
                        <p className={searchStyles.itemRecipeData}>{Math.floor(item.recipe.calories)}
                        <span className={searchStyles.itemRecipeLabel}> Calories | </span>
                        {item.recipe.ingredients.length}
                        <span className={searchStyles.itemRecipeLabel}> Ingredients</span>
                        </p>
                        <p className={searchStyles.itemRecipeSource}>{item.recipe.source}</p>
                      </a>
                    </Link>
                </li>
              )
            })
              :
            <>
              <div style={{paddingTop: "1.5rem"}}>
                <code>{error.status} - {error.statusText}</code>
                <h5 style={{marginTop: "1.5rem"}}>This error has occurred because of the limitation of free API - Please support us :)</h5>
              </div>
            </>
          }

        </ul>

      </div>

      {/* Pagination component from react-bootstrap */}
      <Pagination className={searchStyles.pagination}>{pagination}</Pagination>

    </div>
  ) 
}

// contains the application's state - the current user object
const mapStateToProps = state => {
  return {
    currentUser: state.currentUser
  }
}

export default connect(mapStateToProps)(RecipeSearch) 