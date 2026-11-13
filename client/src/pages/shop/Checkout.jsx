import {
  Link,
  Navigate,
} from 'react-router-dom'

import {
  useState,
} from 'react'

import {
  ArrowLeft,
} from 'lucide-react'

import ContactForm from '../../components/checkout/ContactForm.jsx'
import AddressForm from '../../components/checkout/AddressForm.jsx'
import DeliveryMethod from '../../components/checkout/DeliveryMethod.jsx'
import PaymentMethod from '../../components/checkout/PaymentMethod.jsx'
import CheckoutSummary from '../../components/checkout/CheckoutSummary.jsx'

import {
  useCart,
} from '../../context/CartContext.jsx'
import { useStorefrontSettings } from '../../context/StorefrontSettingsContext.jsx'

import orderService from '../../services/orderService.js'

function Checkout() {
  const { settings } = useStorefrontSettings()
  const {
    cartItems,
    subtotal,
    itemCount,
    loading: cartLoading,

    appliedPromotion,
    discount,
    freeShipping,
  } = useCart()

  const [
    contact,
    setContact,
  ] = useState({
    email: '',
    phone: '',
  })

  const [
    address,
    setAddress,
  ] = useState({
    firstName: '',
    lastName: '',
    addressLine1: '',
    city: '',
    postalCode: '',
    country: 'Maroc',
  })

  const [
    delivery,
    setDelivery,
  ] = useState(
    'standard',
  )

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState(
    'cash',
  )

  const [
    paymentDetails,
    setPaymentDetails,
  ] = useState({
    cardHolder: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    paypalEmail: '',
  })

  const [
    paymentErrors,
    setPaymentErrors,
  ] = useState({})

  const [
    pendingMessage,
    setPendingMessage,
  ] = useState('')

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const thresholdFreeShipping =
    delivery === 'standard' &&
    Number(settings.shipping.freeFrom) > 0 &&
    subtotal >= Number(settings.shipping.freeFrom)

  const baseDeliveryFee =
    delivery === 'express'
      ? Number(settings.shipping.express)
      : Number(settings.shipping.standard)

  const deliveryFee =
    freeShipping || thresholdFreeShipping
      ? 0
      : baseDeliveryFee

  const total =
    Math.max(
      0,
      subtotal +
        deliveryFee -
        Number(
          discount || 0,
        ),
    )

  const getSubmitLabel =
    () => {
      if (isSubmitting) {
        return 'Validation en cours...'
      }

      if (
        paymentMethod ===
        'card'
      ) {
        return 'Valider la carte bancaire'
      }

      if (
        paymentMethod ===
        'paypal'
      ) {
        return 'Valider PayPal'
      }

      return 'Confirmer la commande'
    }

  const getCheckoutData =
    () => {
      const firstName =
        address.firstName.trim()

      const lastName =
        address.lastName.trim()

      const phone =
        contact.phone.trim()

      if (
        !firstName ||
        !lastName ||
        !address.addressLine1.trim() ||
        !address.city.trim() ||
        !address.country.trim() ||
        !phone
      ) {
        return {
          error:
            'Veuillez remplir tous les champs obligatoires.',
        }
      }

      const promotionCode =
        appliedPromotion?.code
          ? String(
              appliedPromotion.code,
            )
              .trim()
              .toUpperCase()
          : null

      return {
        data: {
          shippingAddress: {
            full_name:
              `${firstName} ${lastName}`,

            address_line1:
              address.addressLine1.trim(),

            address_line2:
              '',

            city:
              address.city.trim(),

            postal_code:
              address.postalCode.trim(),

            country:
              address.country.trim(),

            phone,

            email:
              contact.email.trim(),
          },

          deliveryMethod:
            delivery,

          promotionCode,
        },
      }
    }

  const validateCard =
    () => {
      const errors = {}

      const holder =
        paymentDetails.cardHolder.trim()

      const cardNumber =
        paymentDetails.cardNumber
          .replace(/\s/g, '')

      const expiry =
        paymentDetails.cardExpiry.trim()

      const cvc =
        paymentDetails.cardCvc.trim()

      if (!holder) {
        errors.cardHolder =
          'Le nom du titulaire est obligatoire.'
      }

      if (
        !/^\d{16}$/.test(
          cardNumber,
        )
      ) {
        errors.cardNumber =
          'Le numéro de carte doit contenir 16 chiffres.'
      }

      const expiryMatch =
        expiry.match(
          /^(\d{2})\/(\d{2})$/,
        )

      if (!expiryMatch) {
        errors.cardExpiry =
          'Utilisez le format MM/AA.'
      } else {
        const month =
          Number(
            expiryMatch[1],
          )

        const year =
          Number(
            `20${expiryMatch[2]}`,
          )

        const now =
          new Date()

        const currentMonth =
          now.getMonth() + 1

        const currentYear =
          now.getFullYear()

        if (
          month < 1 ||
          month > 12
        ) {
          errors.cardExpiry =
            'Le mois est invalide.'
        } else if (
          year < currentYear ||
          (
            year ===
              currentYear &&
            month <
              currentMonth
          )
        ) {
          errors.cardExpiry =
            'La carte est expirée.'
        }
      }

      if (
        !/^\d{3,4}$/.test(
          cvc,
        )
      ) {
        errors.cardCvc =
          'Le CVC doit contenir 3 ou 4 chiffres.'
      }

      setPaymentErrors(
        errors,
      )

      return (
        Object.keys(
          errors,
        ).length === 0
      )
    }

  const validatePayPal =
    () => {
      const errors = {}

      const email =
        paymentDetails.paypalEmail.trim()

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (
        !emailPattern.test(
          email,
        )
      ) {
        errors.paypalEmail =
          'Veuillez saisir une adresse e-mail PayPal valide.'
      }

      setPaymentErrors(
        errors,
      )

      return (
        Object.keys(
          errors,
        ).length === 0
      )
    }

  const handlePaymentMethodChange =
    (
      nextMethod,
    ) => {
      setPaymentMethod(
        nextMethod,
      )

      setPaymentErrors({})

      setPendingMessage('')
    }

  const handleCheckoutSubmit =
    async (
      event,
    ) => {
      event.preventDefault()

      if (isSubmitting) {
        return
      }

      setPendingMessage('')

      setPaymentErrors({})

      const {
        data:
          checkoutData,

        error:
          validationError,
      } =
        getCheckoutData()

      if (
        validationError
      ) {
        setPendingMessage(
          validationError,
        )

        return
      }

      if (!settings.paymentMethods[paymentMethod]?.available) {
        setPendingMessage(
          'Ce moyen de paiement est indisponible. Veuillez choisir un moyen actif.',
        )
        return
      }

      /*
       * =====================================================
       * CARD — VALIDATION FRONTEND ONLY
       * =====================================================
       */

      if (
        paymentMethod ===
        'card'
      ) {
        const valid =
          validateCard()

        if (!valid) {
          setPendingMessage(
            'Veuillez vérifier les informations de votre carte.',
          )

          return
        }

        /*
         * IMPORTANT:
         *
         * Nous ne transmettons PAS:
         * cardNumber
         * cardCvc
         * cardExpiry
         *
         * au backend.
         *
         * Ceci est uniquement une
         * validation d'interface.
         */

        setPendingMessage(
          'Paiement carte indisponible pour le moment : aucun paiement ni commande n’a été effectué.',
        )

        return
      }

      /*
       * =====================================================
       * PAYPAL — VALIDATION FRONTEND ONLY
       * =====================================================
       */

      if (
        paymentMethod ===
        'paypal'
      ) {
        const valid =
          validatePayPal()

        if (!valid) {
          setPendingMessage(
            'Veuillez vérifier les informations PayPal.',
          )

          return
        }

        setPendingMessage(
          'Paiement PayPal indisponible pour le moment : aucun paiement ni commande n’a été effectué.',
        )

        return
      }

      /*
       * =====================================================
       * CASH ON DELIVERY
       * =====================================================
       */

      try {
        setIsSubmitting(
          true,
        )

        const data =
          await orderService.createOrder(
            {
              ...checkoutData,

              paymentMethod:
                'cash_on_delivery',
            },
          )

        const order =
          data?.order

        if (!order?.id) {
          throw new Error(
            'La commande a été créée mais aucune référence de commande n’a été reçue.',
          )
        }

        setPendingMessage(
          `Commande ${
            order.order_number ||
            ''
          } créée avec succès.`,
        )

        window.location.assign(
          '/mon-compte/commandes',
        )
      } catch (error) {
        console.error(
          'Checkout submit error:',
          error,
        )

        setPendingMessage(
          error?.message ||
            'Impossible de finaliser la commande. Veuillez réessayer.',
        )
      } finally {
        setIsSubmitting(
          false,
        )
      }
    }

  /*
   * =====================================================
   * CART HYDRATION
   * =====================================================
   *
   * Important:
   * Do not redirect while CartContext is still loading
   * the authenticated user's cart from the backend.
   */

  if (cartLoading) {
    return (
      <main className="checkout-page">
        <div className="nova-container">
          <div className="checkout-loading">
            Chargement de votre panier...
          </div>
        </div>
      </main>
    )
  }

  /*
   * Only redirect after cart hydration has completed.
   */

  if (
    !cartItems.length &&
    !isSubmitting
  ) {
    return (
      <Navigate
        to="/panier"
        replace
      />
    )
  }

  return (
    <main className="checkout-page">
      <div className="nova-container">

        <nav className="checkout-breadcrumb">
          <Link to="/">
            Accueil
          </Link>

          <span>
            ›
          </span>

          <Link to="/panier">
            Mon panier
          </Link>

          <span>
            ›
          </span>

          <span>
            Paiement
          </span>
        </nav>

        <form
          className="checkout-layout"
          onSubmit={
            handleCheckoutSubmit
          }
        >

          <div className="checkout-left">

            <div className="checkout-heading">
              <h1>
                Finaliser ma commande
              </h1>

              <p>
                Quelques étapes encore
                et votre commande sera
                confirmée.
              </p>
            </div>

            <ContactForm
              contact={
                contact
              }
              onContactChange={
                setContact
              }
            />

            <AddressForm
              address={
                address
              }
              onAddressChange={
                setAddress
              }
            />

            <DeliveryMethod
              delivery={
                delivery
              }
              onDeliveryChange={
                setDelivery
              }
              shipping={settings.shipping}
              standardIsFree={
                freeShipping ||
                (Number(settings.shipping.freeFrom) > 0 &&
                  subtotal >= Number(settings.shipping.freeFrom))
              }
            />

            <PaymentMethod
              paymentMethod={
                paymentMethod
              }

              onPaymentMethodChange={
                handlePaymentMethodChange
              }

              paymentDetails={
                paymentDetails
              }

              onPaymentDetailsChange={
                setPaymentDetails
              }

              paymentErrors={
                paymentErrors
              }
              availability={settings.paymentMethods}
            />

            <Link
              to="/panier"
              className="checkout-back-link"
            >
              <ArrowLeft
                size={16}
              />

              Retour au panier
            </Link>

          </div>

          <CheckoutSummary
            cartItems={
              cartItems
            }

            subtotal={
              subtotal
            }

            itemCount={
              itemCount
            }

            deliveryFee={
              deliveryFee
            }

            discount={
              Number(
                discount || 0,
              )
            }

            total={
              total
            }

            appliedPromotion={
              appliedPromotion
            }

            freeShipping={
              freeShipping || thresholdFreeShipping
            }

            freeShippingThreshold={settings.shipping.freeFrom}

            pendingMessage={
              isSubmitting
                ? 'Validation en cours...'
                : pendingMessage
            }

            confirmLabel={
              getSubmitLabel()
            }

            isSubmitting={
              isSubmitting
            }
          />

        </form>
      </div>
    </main>
  )
}

export default Checkout
