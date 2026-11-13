import CatalogPage from '../../components/product/CatalogPage.jsx'
import { catalogPages } from './catalogData.js'

function Men() {
  return <CatalogPage {...catalogPages.men} />
}

export default Men