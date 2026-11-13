import CatalogPage from '../../components/product/CatalogPage.jsx'
import { catalogPages } from './catalogData.js'

function Women() {
  return <CatalogPage {...catalogPages.women} />
}

export default Women