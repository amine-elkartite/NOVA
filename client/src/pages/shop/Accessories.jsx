import CatalogPage from '../../components/product/CatalogPage.jsx'
import { catalogPages } from './catalogData.js'

function Accessories() {
  return <CatalogPage {...catalogPages.accessories} />
}

export default Accessories