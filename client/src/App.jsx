import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import {
  StorefrontSettingsProvider,
  useStorefrontSettings,
} from './context/StorefrontSettingsContext.jsx'
import useAuth from './hooks/useAuth.js'
import PrivateRoute from './routes/PrivateRoute.jsx'
import AdminRoute from './routes/AdminRoute.jsx'

import Header from './components/layout/Header.jsx'
import Footer from './components/layout/Footer.jsx'

import Home from './pages/shop/Home.jsx'
import NewArrivals from './pages/shop/NewArrivals.jsx'
import Men from './pages/shop/Men.jsx'
import Women from './pages/shop/Women.jsx'
import Accessories from './pages/shop/Accessories.jsx'
import ProductDetails from './pages/shop/ProductDetails.jsx'
import Search from './pages/shop/Search.jsx'
import Cart from './pages/shop/Cart.jsx'
import Checkout from './pages/shop/Checkout.jsx'
import PaymentReturn from './pages/shop/PaymentReturn.jsx'

import Profile from './pages/account/Profile.jsx'
import Orders from './pages/account/Orders.jsx'
import OrderDetails from './pages/account/OrderDetails.jsx'
import Addresses from './pages/account/Addresses.jsx'
import Favorites from './pages/account/Favorites.jsx'
import Security from './pages/account/Security.jsx'

import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'

import Dashboard from './pages/admin/Dashboard.jsx'
import AdminOrders from './pages/admin/Orders.jsx'
import AdminOrderDetails from './pages/admin/OrderDetails.jsx'
import Products from './pages/admin/Products.jsx'
import ProductCreate from './pages/admin/ProductCreate.jsx'
import ProductEdit from './pages/admin/ProductEdit.jsx'
import Categories from './pages/admin/Categories.jsx'
import CategoryCreate from './pages/admin/CategoryCreate.jsx'
import CategoryEdit from './pages/admin/CategoryEdit.jsx'
import Customers from './pages/admin/Customers.jsx'
import AdminCustomerDetails from './pages/admin/CustomerDetails.jsx'
import Promotions from './pages/admin/Promotions.jsx'
import PromotionCreate from './pages/admin/PromotionCreate.jsx'
import PromotionEdit from './pages/admin/PromotionEdit.jsx'
import Analytics from './pages/admin/Analytics.jsx'
import Messages from './pages/admin/Messages.jsx'
import Settings from './pages/admin/Settings.jsx'
import AdminProfile from './pages/admin/AdminProfile.jsx'

import './styles/shop.css'

function AppContent() {
  const location = useLocation()
  const { user } = useAuth()
  const { settings, loading: settingsLoading } =
    useStorefrontSettings()

  const isAdminPage =
    location.pathname.startsWith('/admin')

  const isAuthPage = [
    '/connexion',
    '/inscription',
    '/mot-de-passe-oublie',
    '/reinitialiser-mot-de-passe',
  ].some((path) => location.pathname.startsWith(path))

  if (
    !settingsLoading &&
    settings.maintenanceMode &&
    !isAdminPage &&
    !isAuthPage &&
    user?.role !== 'admin'
  ) {
    return (
      <main className="payment-return-page">
        <div className="nova-container">
          <section className="payment-return-panel">
            <h1>{settings.storeName} est en maintenance</h1>
            <p>
              La boutique est temporairement indisponible. Merci de revenir
              prochainement.
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <div
      className={
        isAdminPage
          ? 'admin-app-shell'
          : 'app-shell'
      }
    >
      {!isAdminPage && <Header />}

      <Routes>
        {/* =========================
            SHOP
        ========================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/nouveautes"
          element={<NewArrivals />}
        />

        <Route
          path="/homme"
          element={<Men />}
        />

        <Route
          path="/femme"
          element={<Women />}
        />

        <Route
          path="/accessoires"
          element={<Accessories />}
        />

        <Route
          path="/produit/:slug"
          element={<ProductDetails />}
        />

        <Route
          path="/recherche"
          element={<Search />}
        />

        <Route
          path="/panier"
          element={<Cart />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/paiement/succes"
          element={
            <PaymentReturn status="success" />
          }
        />

        <Route
          path="/paiement/annule"
          element={
            <PaymentReturn status="cancelled" />
          }
        />

        {/* =========================
            COMPTE CLIENT
        ========================= */}

        <Route
          path="/mon-compte"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route
          path="/mon-compte/commandes"
          element={
            <PrivateRoute>
              <Orders />
            </PrivateRoute>
          }
        />

        <Route
          path="/mon-compte/commandes/:id"
          element={
            <PrivateRoute>
              <OrderDetails />
            </PrivateRoute>
          }
        />

        <Route
          path="/mon-compte/adresses"
          element={
            <PrivateRoute>
              <Addresses />
            </PrivateRoute>
          }
        />

        <Route
          path="/mon-compte/favoris"
          element={
            <PrivateRoute>
              <Favorites />
            </PrivateRoute>
          }
        />

        <Route
          path="/mon-compte/securite"
          element={
            <PrivateRoute>
              <Security />
            </PrivateRoute>
          }
        />

        {/* =========================
            AUTH
        ========================= */}

        <Route
          path="/connexion"
          element={<Login />}
        />

        <Route
          path="/inscription"
          element={<Register />}
        />

        <Route
          path="/mot-de-passe-oublie"
          element={<ForgotPassword />}
        />

        <Route
          path="/reinitialiser-mot-de-passe"
          element={<ResetPassword />}
        />

        <Route
          path="/reinitialiser-mot-de-passe/:token"
          element={<ResetPassword />}
        />

        {/* =========================
            ADMIN
        ========================= */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/commandes"
          element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/commandes/:id"
          element={
            <AdminRoute>
              <AdminOrderDetails />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/produits"
          element={
            <AdminRoute>
              <Products />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/produits/nouveau"
          element={
            <AdminRoute>
              <ProductCreate />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/produits/:id/modifier"
          element={
            <AdminRoute>
              <ProductEdit />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <Categories />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/categories/nouvelle"
          element={
            <AdminRoute>
              <CategoryCreate />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/categories/:id/modifier"
          element={
            <AdminRoute>
              <CategoryEdit />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/clients"
          element={
            <AdminRoute>
              <Customers />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/clients/:id"
          element={
            <AdminRoute>
              <AdminCustomerDetails />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/promotions"
          element={
            <AdminRoute>
              <Promotions />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/promotions/nouvelle"
          element={
            <AdminRoute>
              <PromotionCreate />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/promotions/:id/modifier"
          element={
            <AdminRoute>
              <PromotionEdit />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/analyses"
          element={
            <AdminRoute>
              <Analytics />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/messages"
          element={
            <AdminRoute>
              <Messages />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/parametres"
          element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/profil"
          element={
            <AdminRoute>
              <AdminProfile />
            </AdminRoute>
          }
        />

        {/* =========================
            FALLBACK
        ========================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>

      {!isAdminPage && <Footer />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StorefrontSettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </StorefrontSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
