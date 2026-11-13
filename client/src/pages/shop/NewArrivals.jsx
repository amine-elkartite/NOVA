import CatalogPage from '../../components/product/CatalogPage.jsx'
import { catalogPages } from './catalogData.js'

function NewArrivals() {
  return <CatalogPage {...catalogPages.newArrivals} />
}

export default NewArrivals