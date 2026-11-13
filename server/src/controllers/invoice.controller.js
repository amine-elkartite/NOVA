const PDFDocument = require('pdfkit')
const pool = require('../config/db')

const formatPrice = (value) => {
  const amount = Number(value || 0)

  return `${amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} DH`
}

const formatDate = (value) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const parseShippingAddress = (value) => {
  if (!value) {
    return {}
  }

  if (typeof value === 'object') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

const getPaymentMethodLabel = (method) => {
  switch (method) {
    case 'cash_on_delivery':
      return 'Paiement a la livraison'

    case 'card':
      return 'Carte bancaire'

    case 'paypal':
      return 'PayPal'

    default:
      return method || 'Non renseigne'
  }
}

const getPaymentStatusLabel = (status) => {
  switch (status) {
    case 'pending':
      return 'En attente'

    case 'paid':
      return 'Paye'

    case 'failed':
      return 'Echoue'

    case 'cancelled':
      return 'Annule'

    case 'refunded':
      return 'Rembourse'

    default:
      return status || 'En attente'
  }
}

async function generateInvoice(req, res, next) {
  try {
    const userId = req.user.id
    const orderId = Number(req.params.id)

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0
    ) {
      res.status(400).json({
        message:
          'Identifiant de commande invalide.',
      })
      return
    }

    /*
      On cherche uniquement une commande
      appartenant a l'utilisateur connecte.
    */
    const [orderRows] = await pool.query(
      `
      SELECT
        id,
        user_id,
        order_number,
        status,
        subtotal,
        shipping_cost,
        discount,
        total,
        payment_method,
        payment_status,
        shipping_address,
        notes,
        created_at,
        updated_at
      FROM orders
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
      `,
      [orderId, userId],
    )

    if (orderRows.length === 0) {
      res.status(404).json({
        message:
          'Commande introuvable.',
      })
      return
    }

    const order = orderRows[0]

    const [items] = await pool.query(
      `
      SELECT
        oi.id,
        oi.product_id,
        oi.variant_id,
        oi.product_name,
        oi.product_sku,
        oi.size,
        oi.color,
        oi.quantity,
        oi.unit_price,
        oi.total_price
      FROM order_items oi
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
      `,
      [orderId],
    )

    const shippingAddress =
      parseShippingAddress(
        order.shipping_address,
      )

    /*
      Nom du fichier telecharge.
    */
    const safeOrderNumber = String(
      order.order_number || order.id,
    ).replace(
      /[^a-zA-Z0-9-_]/g,
      '-',
    )

    const fileName =
      `facture-${safeOrderNumber}.pdf`

    /*
      Headers PDF.
    */
    res.setHeader(
      'Content-Type',
      'application/pdf',
    )

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    )

    /*
      Creation du PDF.
    */
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title:
          `Facture ${order.order_number}`,
        Author: 'NOVA',
        Subject:
          `Facture de la commande ${order.order_number}`,
      },
    })

    doc.on('error', (error) => {
      console.error(
        'Invoice PDF error:',
        error,
      )

      if (!res.headersSent) {
        next(error)
      } else {
        res.end()
      }
    })

    doc.pipe(res)

    /*
      =========================
      HEADER
      =========================
    */

    doc
      .font('Times-Bold')
      .fontSize(28)
      .text('NOVA', {
        align: 'left',
      })

    doc
      .moveDown(0.2)
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#666666')
      .text(
        "L'ELEGANCE AU QUOTIDIEN",
      )

    doc
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('FACTURE', 400, 50, {
        width: 145,
        align: 'right',
      })

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#555555')
      .text(
        `Commande : #${order.order_number}`,
        330,
        80,
        {
          width: 215,
          align: 'right',
        },
      )

    doc.text(
      `Date : ${formatDate(
        order.created_at,
      )}`,
      330,
      95,
      {
        width: 215,
        align: 'right',
      },
    )

    doc
      .moveTo(50, 130)
      .lineTo(545, 130)
      .strokeColor('#B7B39A')
      .lineWidth(1)
      .stroke()

    /*
      =========================
      CUSTOMER / SHIPPING
      =========================
    */

    let y = 155

    doc
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(
        'ADRESSE DE LIVRAISON',
        50,
        y,
      )

    y += 24

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(
        shippingAddress.full_name ||
          'Non renseigne',
        50,
        y,
      )

    y += 17

    doc
      .font('Helvetica')
      .fontSize(9)

    if (
      shippingAddress.address_line1
    ) {
      doc.text(
        shippingAddress.address_line1,
        50,
        y,
      )

      y += 15
    }

    if (
      shippingAddress.address_line2
    ) {
      doc.text(
        shippingAddress.address_line2,
        50,
        y,
      )

      y += 15
    }

    const cityLine = [
      shippingAddress.postal_code,
      shippingAddress.city,
      shippingAddress.country,
    ]
      .filter(Boolean)
      .join(' - ')

    if (cityLine) {
      doc.text(cityLine, 50, y)
      y += 15
    }

    if (shippingAddress.phone) {
      doc.text(
        `Tel : ${shippingAddress.phone}`,
        50,
        y,
      )

      y += 15
    }

    if (shippingAddress.email) {
      doc.text(
        shippingAddress.email,
        50,
        y,
      )

      y += 15
    }

    /*
      PAYMENT INFORMATION
    */

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(
        'PAIEMENT',
        330,
        155,
      )

    doc
      .font('Helvetica')
      .fontSize(9)
      .text(
        getPaymentMethodLabel(
          order.payment_method,
        ),
        330,
        179,
        {
          width: 215,
        },
      )

    doc.text(
      `Statut : ${getPaymentStatusLabel(
        order.payment_status,
      )}`,
      330,
      196,
      {
        width: 215,
      },
    )

    /*
      =========================
      PRODUCTS TABLE
      =========================
    */

    y = Math.max(y + 25, 270)

    const tableTop = y

    doc
      .rect(
        50,
        tableTop,
        495,
        26,
      )
      .fill('#F1EFE7')

    doc
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .fontSize(9)

    doc.text(
      'Article',
      60,
      tableTop + 9,
      {
        width: 210,
      },
    )

    doc.text(
      'Qte',
      285,
      tableTop + 9,
      {
        width: 40,
        align: 'center',
      },
    )

    doc.text(
      'Prix',
      340,
      tableTop + 9,
      {
        width: 80,
        align: 'right',
      },
    )

    doc.text(
      'Total',
      440,
      tableTop + 9,
      {
        width: 95,
        align: 'right',
      },
    )

    y = tableTop + 36

    for (const item of items) {
      /*
        Nouvelle page si necessaire.
      */
      if (y > 700) {
        doc.addPage()

        y = 60

        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .text(
            'Article',
            60,
            y,
            {
              width: 210,
            },
          )

        doc.text(
          'Qte',
          285,
          y,
          {
            width: 40,
            align: 'center',
          },
        )

        doc.text(
          'Prix',
          340,
          y,
          {
            width: 80,
            align: 'right',
          },
        )

        doc.text(
          'Total',
          440,
          y,
          {
            width: 95,
            align: 'right',
          },
        )

        y += 25
      }

      const variant = [
        item.color,
        item.size,
      ]
        .filter(Boolean)
        .join(' - ')

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#000000')
        .text(
          item.product_name ||
            'Produit NOVA',
          60,
          y,
          {
            width: 210,
          },
        )

      if (variant) {
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#777777')
          .text(
            variant,
            60,
            y + 14,
            {
              width: 210,
            },
          )
      }

      doc
        .fillColor('#000000')
        .font('Helvetica')
        .fontSize(9)
        .text(
          String(
            item.quantity || 0,
          ),
          285,
          y,
          {
            width: 40,
            align: 'center',
          },
        )

      doc.text(
        formatPrice(
          item.unit_price,
        ),
        340,
        y,
        {
          width: 80,
          align: 'right',
        },
      )

      doc
        .font('Helvetica-Bold')
        .text(
          formatPrice(
            item.total_price,
          ),
          440,
          y,
          {
            width: 95,
            align: 'right',
          },
        )

      y += variant ? 42 : 32

      doc
        .moveTo(50, y - 8)
        .lineTo(545, y - 8)
        .strokeColor('#E6E3D9')
        .lineWidth(0.5)
        .stroke()
    }

    /*
      =========================
      TOTALS
      =========================
    */

    if (y > 610) {
      doc.addPage()
      y = 70
    } else {
      y += 15
    }

    const totalsX = 330
    const totalsWidth = 215

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#444444')

    doc.text(
      'Sous-total',
      totalsX,
      y,
    )

    doc
      .fillColor('#000000')
      .text(
        formatPrice(
          order.subtotal,
        ),
        430,
        y,
        {
          width: 115,
          align: 'right',
        },
      )

    y += 22

    doc
      .fillColor('#444444')
      .text(
        'Livraison',
        totalsX,
        y,
      )

    doc
      .fillColor('#000000')
      .text(
        Number(
          order.shipping_cost || 0,
        ) === 0
          ? 'Gratuite'
          : formatPrice(
              order.shipping_cost,
            ),
        430,
        y,
        {
          width: 115,
          align: 'right',
        },
      )

    y += 22

    doc
      .fillColor('#444444')
      .text(
        'Reduction',
        totalsX,
        y,
      )

    doc
      .fillColor('#000000')
      .text(
        Number(
          order.discount || 0,
        ) > 0
          ? `-${formatPrice(
              order.discount,
            )}`
          : formatPrice(0),
        430,
        y,
        {
          width: 115,
          align: 'right',
        },
      )

    y += 16

    doc
      .moveTo(
        totalsX,
        y,
      )
      .lineTo(
        totalsX +
          totalsWidth,
        y,
      )
      .strokeColor('#B7B39A')
      .lineWidth(1)
      .stroke()

    y += 15

    doc
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(
        'TOTAL',
        totalsX,
        y,
      )

    doc.text(
      formatPrice(
        order.total,
      ),
      420,
      y,
      {
        width: 125,
        align: 'right',
      },
    )

    /*
      =========================
      FOOTER
      =========================
    */

    y += 70

    if (y > 760) {
      doc.addPage()
      y = 700
    }

    doc
      .moveTo(50, y)
      .lineTo(545, y)
      .strokeColor('#E6E3D9')
      .lineWidth(0.5)
      .stroke()

    doc
      .fillColor('#777777')
      .font('Helvetica')
      .fontSize(8)
      .text(
        'Merci pour votre commande chez NOVA.',
        50,
        y + 15,
        {
          width: 495,
          align: 'center',
        },
      )

    doc.text(
      "L'elegance au quotidien",
      50,
      y + 29,
      {
        width: 495,
        align: 'center',
      },
    )

    doc.end()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  generateInvoice,
}
