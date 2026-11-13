const jwt = require('jsonwebtoken')

const pool = require('../config/db')
const env = require('../config/env')


async function authenticate(
  req,
  res,
  next,
) {
  const header =
    req.headers.authorization || ''

  const [scheme, token] =
    header.split(' ')

  if (
    scheme !== 'Bearer' ||
    !token
  ) {
    return res.status(401).json({
      message:
        'Authentification requise.',
    })
  }

  if (!env.jwt.secret) {
    return next(
      Object.assign(
        new Error(
          'JWT_SECRET is not configured.',
        ),
        {
          statusCode: 500,
        },
      ),
    )
  }

  try {
    /*
     * 1. Vérification cryptographique du JWT.
     */
    const payload =
      jwt.verify(
        token,
        env.jwt.secret,
      )

    const userId =
      Number(payload.sub)

    const sessionId =
      String(
        payload.sid || '',
      ).trim()

    /*
     * Les anciens JWT sans sid ne sont plus acceptés.
     */
    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !sessionId
    ) {
      return res.status(401).json({
        message:
          'Session invalide.',
      })
    }

    /*
     * 2. Vérifier que la session existe réellement
     *    dans MySQL et qu'elle n'a pas été révoquée.
     *
     * On vérifie également que le compte est actif.
     */
    const [rows] =
      await pool.execute(
        `
          SELECT
            sessions.id,
            sessions.user_id,
            sessions.session_id,
            sessions.expires_at,
            sessions.revoked_at,
            users.email,
            users.role,
            users.is_active
          FROM user_sessions
            AS sessions
          INNER JOIN users
            ON users.id =
              sessions.user_id
          WHERE
            sessions.session_id = ?
            AND sessions.user_id = ?
          LIMIT 1
        `,
        [
          sessionId,
          userId,
        ],
      )

    const session =
      rows[0]

    if (!session) {
      return res.status(401).json({
        message:
          'Session invalide.',
      })
    }

    /*
     * Compte désactivé.
     */
    if (!session.is_active) {
      return res.status(401).json({
        message:
          'Ce compte est désactivé.',
      })
    }

    /*
     * Session déjà déconnectée/révoquée.
     */
    if (session.revoked_at) {
      return res.status(401).json({
        message:
          'Cette session a été déconnectée.',
      })
    }

    /*
     * Vérification DB de l'expiration.
     * jwt.verify() contrôle déjà exp côté JWT,
     * mais on garde également le contrôle côté DB.
     */
    const expiresAt =
      new Date(
        session.expires_at,
      )

    if (
      Number.isNaN(
        expiresAt.getTime(),
      ) ||
      expiresAt.getTime() <=
        Date.now()
    ) {
      return res.status(401).json({
        message:
          'Session expirée.',
      })
    }

    /*
     * 3. Mise à jour de la dernière activité.
     */
    await pool.execute(
      `
        UPDATE user_sessions
        SET last_seen_at = NOW()
        WHERE id = ?
      `,
      [
        session.id,
      ],
    )

    /*
     * 4. Informations disponibles dans
     *    les controllers suivants.
     */
    req.user = {
      id: Number(
        session.user_id,
      ),

      role:
        session.role,

      email:
        session.email,

      sessionId:
        session.session_id,

      sessionDbId:
        session.id,
    }

    next()
  } catch (error) {
    if (
      error.name ===
      'TokenExpiredError'
    ) {
      return res.status(401).json({
        message:
          'Session expirée.',
      })
    }

    if (
      error.name ===
      'JsonWebTokenError' ||
      error.name ===
        'NotBeforeError'
    ) {
      return res.status(401).json({
        message:
          'Jeton invalide.',
      })
    }

    next(error)
  }
}


module.exports = {
  authenticate,
}