const pool = require('../config/db')

function formatAddress(row) {
  return {
    id: row.id,
    label: row.label,
    fullName: row.full_name,
    address: row.address_line1,
    address2: row.address_line2,
    city: row.city,
    postalCode: row.postal_code,
    country: row.country,
    phone: row.phone,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getAddresses(req, res, next) {
  try {
    const userId = req.user.id

    const [rows] = await pool.execute(
      `
        SELECT
          id,
          label,
          full_name,
          address_line1,
          address_line2,
          city,
          postal_code,
          country,
          phone,
          is_default,
          created_at,
          updated_at
        FROM addresses
        WHERE user_id = ?
        ORDER BY is_default DESC, created_at DESC
      `,
      [userId],
    )

    res.json({
      addresses: rows.map(formatAddress),
    })
  } catch (error) {
    next(error)
  }
}

async function createAddress(req, res, next) {
  const connection = await pool.getConnection()

  try {
    const userId = req.user.id

    const {
      label,
      fullName,
      address,
      address2,
      city,
      postalCode,
      country,
      phone,
      isDefault,
    } = req.body

    if (!fullName || !String(fullName).trim()) {
      res.status(400).json({
        message: 'Le nom complet est obligatoire.',
      })
      return
    }

    if (!address || !String(address).trim()) {
      res.status(400).json({
        message: "L'adresse est obligatoire.",
      })
      return
    }

    if (!city || !String(city).trim()) {
      res.status(400).json({
        message: 'La ville est obligatoire.',
      })
      return
    }

    await connection.beginTransaction()

    const [existingRows] = await connection.execute(
      `
        SELECT COUNT(*) AS total
        FROM addresses
        WHERE user_id = ?
      `,
      [userId],
    )

    const shouldBeDefault =
      Boolean(isDefault) ||
      Number(existingRows[0].total) === 0

    if (shouldBeDefault) {
      await connection.execute(
        `
          UPDATE addresses
          SET is_default = 0
          WHERE user_id = ?
        `,
        [userId],
      )
    }

    const [result] = await connection.execute(
      `
        INSERT INTO addresses (
          user_id,
          label,
          full_name,
          address_line1,
          address_line2,
          city,
          postal_code,
          country,
          phone,
          is_default
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        String(label || 'Domicile').trim(),
        String(fullName).trim(),
        String(address).trim(),
        address2 ? String(address2).trim() : null,
        String(city).trim(),
        postalCode ? String(postalCode).trim() : null,
        String(country || 'Maroc').trim(),
        phone ? String(phone).trim() : null,
        shouldBeDefault ? 1 : 0,
      ],
    )

    const [rows] = await connection.execute(
      `
        SELECT
          id,
          label,
          full_name,
          address_line1,
          address_line2,
          city,
          postal_code,
          country,
          phone,
          is_default,
          created_at,
          updated_at
        FROM addresses
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
      `,
      [result.insertId, userId],
    )

    await connection.commit()

    res.status(201).json({
      message: 'Adresse ajoutée avec succès.',
      address: formatAddress(rows[0]),
    })
  } catch (error) {
    await connection.rollback()
    next(error)
  } finally {
    connection.release()
  }
}

async function updateAddress(req, res, next) {
  const connection = await pool.getConnection()

  try {
    const userId = req.user.id
    const addressId = Number(req.params.id)

    const {
      label,
      fullName,
      address,
      address2,
      city,
      postalCode,
      country,
      phone,
      isDefault,
    } = req.body

    if (!Number.isInteger(addressId) || addressId <= 0) {
      res.status(400).json({
        message: "Identifiant d'adresse invalide.",
      })
      return
    }

    if (!fullName || !String(fullName).trim()) {
      res.status(400).json({
        message: 'Le nom complet est obligatoire.',
      })
      return
    }

    if (!address || !String(address).trim()) {
      res.status(400).json({
        message: "L'adresse est obligatoire.",
      })
      return
    }

    if (!city || !String(city).trim()) {
      res.status(400).json({
        message: 'La ville est obligatoire.',
      })
      return
    }

    await connection.beginTransaction()

    const [existingRows] = await connection.execute(
      `
        SELECT id, is_default
        FROM addresses
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [addressId, userId],
    )

    if (!existingRows.length) {
      await connection.rollback()

      res.status(404).json({
        message: 'Adresse introuvable.',
      })
      return
    }

    if (Boolean(isDefault)) {
      await connection.execute(
        `
          UPDATE addresses
          SET is_default = 0
          WHERE user_id = ?
        `,
        [userId],
      )
    }

    await connection.execute(
      `
        UPDATE addresses
        SET
          label = ?,
          full_name = ?,
          address_line1 = ?,
          address_line2 = ?,
          city = ?,
          postal_code = ?,
          country = ?,
          phone = ?,
          is_default = ?
        WHERE id = ?
          AND user_id = ?
      `,
      [
        String(label || 'Domicile').trim(),
        String(fullName).trim(),
        String(address).trim(),
        address2 ? String(address2).trim() : null,
        String(city).trim(),
        postalCode ? String(postalCode).trim() : null,
        String(country || 'Maroc').trim(),
        phone ? String(phone).trim() : null,
        Boolean(isDefault)
          ? 1
          : Number(existingRows[0].is_default),
        addressId,
        userId,
      ],
    )

    const [rows] = await connection.execute(
      `
        SELECT
          id,
          label,
          full_name,
          address_line1,
          address_line2,
          city,
          postal_code,
          country,
          phone,
          is_default,
          created_at,
          updated_at
        FROM addresses
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
      `,
      [addressId, userId],
    )

    await connection.commit()

    res.json({
      message: 'Adresse modifiée avec succès.',
      address: formatAddress(rows[0]),
    })
  } catch (error) {
    await connection.rollback()
    next(error)
  } finally {
    connection.release()
  }
}

async function deleteAddress(req, res, next) {
  const connection = await pool.getConnection()

  try {
    const userId = req.user.id
    const addressId = Number(req.params.id)

    if (!Number.isInteger(addressId) || addressId <= 0) {
      res.status(400).json({
        message: "Identifiant d'adresse invalide.",
      })
      return
    }

    await connection.beginTransaction()

    const [rows] = await connection.execute(
      `
        SELECT id, is_default
        FROM addresses
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [addressId, userId],
    )

    if (!rows.length) {
      await connection.rollback()

      res.status(404).json({
        message: 'Adresse introuvable.',
      })
      return
    }

    const wasDefault = Boolean(rows[0].is_default)

    await connection.execute(
      `
        DELETE FROM addresses
        WHERE id = ?
          AND user_id = ?
      `,
      [addressId, userId],
    )

    if (wasDefault) {
      const [remainingRows] = await connection.execute(
        `
          SELECT id
          FROM addresses
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [userId],
      )

      if (remainingRows.length) {
        await connection.execute(
          `
            UPDATE addresses
            SET is_default = 1
            WHERE id = ?
              AND user_id = ?
          `,
          [remainingRows[0].id, userId],
        )
      }
    }

    await connection.commit()

    res.json({
      message: 'Adresse supprimée avec succès.',
    })
  } catch (error) {
    await connection.rollback()
    next(error)
  } finally {
    connection.release()
  }
}

async function setDefaultAddress(req, res, next) {
  const connection = await pool.getConnection()

  try {
    const userId = req.user.id
    const addressId = Number(req.params.id)

    if (!Number.isInteger(addressId) || addressId <= 0) {
      res.status(400).json({
        message: "Identifiant d'adresse invalide.",
      })
      return
    }

    await connection.beginTransaction()

    const [rows] = await connection.execute(
      `
        SELECT id
        FROM addresses
        WHERE id = ?
          AND user_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [addressId, userId],
    )

    if (!rows.length) {
      await connection.rollback()

      res.status(404).json({
        message: 'Adresse introuvable.',
      })
      return
    }

    await connection.execute(
      `
        UPDATE addresses
        SET is_default = 0
        WHERE user_id = ?
      `,
      [userId],
    )

    await connection.execute(
      `
        UPDATE addresses
        SET is_default = 1
        WHERE id = ?
          AND user_id = ?
      `,
      [addressId, userId],
    )

    await connection.commit()

    res.json({
      message: 'Adresse définie par défaut.',
    })
  } catch (error) {
    await connection.rollback()
    next(error)
  } finally {
    connection.release()
  }
}

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
}