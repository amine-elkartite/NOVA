const bcrypt = require('bcrypt')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const speakeasy = require('speakeasy')
const QRCode = require('qrcode')

const pool = require('../config/db')
const env = require('../config/env')

const {
  sendPasswordResetEmail,
} = require('../services/email.service')


const RESET_TOKEN_TTL_MINUTES = 60
const TWO_FACTOR_CHALLENGE_TTL_MINUTES = 10

const FORGOT_PASSWORD_RESPONSE =
  'Si un compte existe pour cette adresse e-mail, une demande de réinitialisation a été prise en compte.'


/* =========================
   HELPERS
========================= */

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
}


function getRegistrationPayload(body) {
  return {
    firstName: String(
      body.firstName ||
        body.first_name ||
        '',
    ).trim(),

    lastName: String(
      body.lastName ||
        body.last_name ||
        '',
    ).trim(),

    email: normalizeEmail(
      body.email,
    ),

    phone: body.phone
      ? String(body.phone).trim()
      : null,

    password: String(
      body.password || '',
    ),
  }
}


function toSafeUser(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,

    firstName:
      row.first_name,

    lastName:
      row.last_name,

    email:
      row.email,

    phone:
      row.phone,

    city:
      row.city,

    country:
      row.country,

    avatarUrl:
      row.avatar_url || null,

    newsletterOptIn:
      Boolean(
        row.newsletter_opt_in,
      ),

    twoFactorEnabled:
      Boolean(
        row.two_factor_enabled,
      ),

    role:
      row.role,

    isActive:
      Boolean(
        row.is_active,
      ),

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}


/* =========================
   JWT + SESSION HELPERS
========================= */

function signToken(
  user,
  sessionId,
) {
  if (!env.jwt.secret) {
    throw Object.assign(
      new Error(
        'JWT_SECRET is not configured.',
      ),
      {
        statusCode: 500,
      },
    )
  }

  return jwt.sign(
    {
      email: user.email,
      role: user.role,
      sid: sessionId,
    },
    env.jwt.secret,
    {
      subject:
        String(user.id),

      expiresIn:
        env.jwt.expiresIn,
    },
  )
}


function getRequestIp(req) {
  const forwardedFor =
    req.headers['x-forwarded-for']

  if (forwardedFor) {
    return String(forwardedFor)
      .split(',')[0]
      .trim()
      .slice(0, 45)
  }

  const ip =
    req.ip ||
    req.socket?.remoteAddress ||
    ''

  return (
    String(ip)
      .trim()
      .slice(0, 45) ||
    null
  )
}


function getRequestUserAgent(req) {
  const userAgent =
    String(
      req.headers['user-agent'] ||
        '',
    ).trim()

  if (!userAgent) {
    return null
  }

  return userAgent.slice(
    0,
    500,
  )
}


async function createUserSession(
  user,
  req,
  executor = pool,
) {
  const sessionId =
    crypto.randomUUID()

  const token =
    signToken(
      user,
      sessionId,
    )

  const decodedToken =
    jwt.decode(token)

  if (
    !decodedToken ||
    !decodedToken.exp
  ) {
    throw Object.assign(
      new Error(
        'Impossible de déterminer l’expiration de la session.',
      ),
      {
        statusCode: 500,
      },
    )
  }

  const expiresAt =
    new Date(
      decodedToken.exp * 1000,
    )

  await executor.execute(
    `
      INSERT INTO user_sessions (
        user_id,
        session_id,
        user_agent,
        ip_address,
        last_seen_at,
        expires_at
      )
      VALUES (
        ?,
        ?,
        ?,
        ?,
        NOW(),
        ?
      )
    `,
    [
      user.id,
      sessionId,
      getRequestUserAgent(req),
      getRequestIp(req),
      expiresAt,
    ],
  )

  return {
    token,
    sessionId,
  }
}


function createChallengeToken() {
  return crypto
    .randomBytes(32)
    .toString('hex')
}


function hashChallengeToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
}


function verifyTotpCode(
  secret,
  code,
) {
  if (!secret || !code) {
    return false
  }

  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token:
      String(code).trim(),
    window: 1,
  })
}


async function getSafeUserById(id) {
  const [rows] =
    await pool.execute(
      `
        SELECT
          id,
          first_name,
          last_name,
          email,
          phone,
          city,
          country,
          avatar_url,
          newsletter_opt_in,
          two_factor_enabled,
          role,
          is_active,
          created_at,
          updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    )

  return toSafeUser(
    rows[0],
  )
}


/* =========================
   REGISTER
========================= */

async function register(
  req,
  res,
  next,
) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
    } =
      getRegistrationPayload(
        req.body,
      )

    const [existingUsers] =
      await pool.execute(
        `
          SELECT id
          FROM users
          WHERE email = ?
          LIMIT 1
        `,
        [email],
      )

    if (
      existingUsers.length > 0
    ) {
      return res
        .status(409)
        .json({
          message:
            'Un compte utilise déjà cette adresse e-mail.',
        })
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12,
      )

    const [result] =
      await pool.execute(
        `
          INSERT INTO users (
            first_name,
            last_name,
            email,
            phone,
            password_hash,
            role,
            is_active
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            'customer',
            1
          )
        `,
        [
          firstName,
          lastName,
          email,
          phone,
          passwordHash,
        ],
      )

    const user =
      await getSafeUserById(
        result.insertId,
      )

    const {
      token,
    } =
      await createUserSession(
        user,
        req,
      )

    return res
      .status(201)
      .json({
        user,
        token,
      })
  } catch (error) {
    next(error)
  }
}


/* =========================
   LOGIN
========================= */

async function login(
  req,
  res,
  next,
) {
  try {
    const email =
      normalizeEmail(
        req.body.email,
      )

    const password =
      String(
        req.body.password ||
          '',
      )

    const [rows] =
      await pool.execute(
        `
          SELECT
            id,
            first_name,
            last_name,
            email,
            phone,
            city,
            country,
            avatar_url,
            newsletter_opt_in,
            two_factor_enabled,
            two_factor_secret,
            password_hash,
            role,
            is_active,
            created_at,
            updated_at
          FROM users
          WHERE email = ?
          LIMIT 1
        `,
        [email],
      )

    const userRow =
      rows[0]

    const passwordMatches =
      userRow?.password_hash
        ? await bcrypt.compare(
            password,
            userRow.password_hash,
          )
        : false

    if (
      !userRow ||
      !passwordMatches
    ) {
      return res
        .status(401)
        .json({
          message:
            'Adresse e-mail ou mot de passe incorrect.',
        })
    }

    if (
      !userRow.is_active
    ) {
      return res
        .status(403)
        .json({
          message:
            'Ce compte est désactivé.',
        })
    }

    if (
      userRow.two_factor_enabled &&
      userRow.two_factor_secret
    ) {
      const challengeToken =
        createChallengeToken()

      const challengeHash =
        hashChallengeToken(
          challengeToken,
        )

      await pool.execute(
        `
          UPDATE two_factor_challenges
          SET used_at = NOW()
          WHERE user_id = ?
            AND used_at IS NULL
        `,
        [userRow.id],
      )

      await pool.execute(
        `
          INSERT INTO two_factor_challenges (
            user_id,
            token_hash,
            expires_at
          )
          VALUES (
            ?,
            ?,
            DATE_ADD(
              NOW(),
              INTERVAL ? MINUTE
            )
          )
        `,
        [
          userRow.id,
          challengeHash,
          TWO_FACTOR_CHALLENGE_TTL_MINUTES,
        ],
      )

      return res.json({
        requiresTwoFactor:
          true,

        challengeToken,

        message:
          'Veuillez saisir le code de votre application d’authentification.',
      })
    }

    const user =
      toSafeUser(userRow)

    const {
      token,
    } =
      await createUserSession(
        user,
        req,
      )

    return res.json({
      requiresTwoFactor:
        false,

      user,
      token,
    })
  } catch (error) {
    next(error)
  }
}


/* =========================
   VERIFY LOGIN 2FA
========================= */

async function verifyLoginTwoFactor(
  req,
  res,
  next,
) {
  const connection =
    await pool.getConnection()

  try {
    const challengeToken =
      String(
        req.body
          .challengeToken ||
          '',
      ).trim()

    const code =
      String(
        req.body.code ||
          '',
      ).trim()

    if (
      !challengeToken ||
      !code
    ) {
      return res
        .status(400)
        .json({
          message:
            'Le challenge et le code 2FA sont requis.',
        })
    }

    const challengeHash =
      hashChallengeToken(
        challengeToken,
      )

    await connection
      .beginTransaction()

    const [rows] =
      await connection.execute(
        `
          SELECT
            challenges.id AS challenge_id,
            challenges.user_id,
            users.id,
            users.first_name,
            users.last_name,
            users.email,
            users.phone,
            users.city,
            users.country,
            users.avatar_url,
            users.newsletter_opt_in,
            users.two_factor_enabled,
            users.two_factor_secret,
            users.role,
            users.is_active,
            users.created_at,
            users.updated_at
          FROM two_factor_challenges
            AS challenges
          INNER JOIN users
            ON users.id =
              challenges.user_id
          WHERE
            challenges.token_hash = ?
            AND challenges.used_at IS NULL
            AND challenges.expires_at > NOW()
          LIMIT 1
          FOR UPDATE
        `,
        [challengeHash],
      )

    const row =
      rows[0]

    if (
      !row ||
      !row.is_active ||
      !row.two_factor_enabled ||
      !row.two_factor_secret
    ) {
      await connection
        .rollback()

      return res
        .status(401)
        .json({
          message:
            'Le challenge 2FA est invalide ou expiré.',
        })
    }

    const validCode =
      verifyTotpCode(
        row.two_factor_secret,
        code,
      )

    if (!validCode) {
      await connection
        .rollback()

      return res
        .status(401)
        .json({
          message:
            'Le code de vérification est incorrect.',
        })
    }

    await connection.execute(
      `
        UPDATE two_factor_challenges
        SET used_at = NOW()
        WHERE id = ?
      `,
      [row.challenge_id],
    )

    const user =
      toSafeUser(row)

    const {
      token,
    } =
      await createUserSession(
        user,
        req,
        connection,
      )

    await connection
      .commit()

    return res.json({
      user,
      token,
    })
  } catch (error) {
    try {
      await connection
        .rollback()
    } catch {
      // La transaction peut déjà être terminée.
    }

    next(error)
  } finally {
    connection.release()
  }
}


/* =========================
   GET CURRENT USER
========================= */

async function getMe(
  req,
  res,
  next,
) {
  try {
    const user =
      await getSafeUserById(
        req.user.id,
      )

    if (
      !user ||
      !user.isActive
    ) {
      return res
        .status(401)
        .json({
          message:
            'Session invalide.',
        })
    }

    return res.json({
      user,
    })
  } catch (error) {
    next(error)
  }
}


/* =========================
   SETUP 2FA
========================= */

async function setupTwoFactor(
  req,
  res,
  next,
) {
  try {
    const userId =
      req.user.id

    const [rows] =
      await pool.execute(
        `
          SELECT
            id,
            email,
            two_factor_enabled
          FROM users
          WHERE id = ?
            AND is_active = 1
          LIMIT 1
        `,
        [userId],
      )

    const user =
      rows[0]

    if (!user) {
      return res
        .status(401)
        .json({
          message:
            'Session invalide.',
        })
    }

    if (
      user.two_factor_enabled
    ) {
      return res
        .status(409)
        .json({
          message:
            'La vérification en deux étapes est déjà activée.',
        })
    }

    const secret =
      speakeasy.generateSecret({
        name:
          `NOVA (${user.email})`,

        issuer:
          'NOVA',

        length:
          32,
      })

    await pool.execute(
      `
        UPDATE users
        SET two_factor_secret = ?
        WHERE id = ?
      `,
      [
        secret.base32,
        userId,
      ],
    )

    const qrCodeDataUrl =
      await QRCode.toDataURL(
        secret.otpauth_url,
      )

    return res.json({
      qrCodeDataUrl,

      manualKey:
        secret.base32,

      message:
        'Scannez le QR code puis confirmez avec un code à 6 chiffres.',
    })
  } catch (error) {
    next(error)
  }
}


/* =========================
   ENABLE 2FA
========================= */

async function enableTwoFactor(
  req,
  res,
  next,
) {
  try {
    const userId =
      req.user.id

    const code =
      String(
        req.body.code ||
          '',
      ).trim()

    if (!code) {
      return res
        .status(400)
        .json({
          message:
            'Le code de vérification est requis.',
        })
    }

    const [rows] =
      await pool.execute(
        `
          SELECT
            id,
            two_factor_enabled,
            two_factor_secret,
            is_active
          FROM users
          WHERE id = ?
          LIMIT 1
        `,
        [userId],
      )

    const user =
      rows[0]

    if (
      !user ||
      !user.is_active
    ) {
      return res
        .status(401)
        .json({
          message:
            'Session invalide.',
        })
    }

    if (
      user.two_factor_enabled
    ) {
      return res
        .status(409)
        .json({
          message:
            'La vérification en deux étapes est déjà activée.',
        })
    }

    if (
      !user.two_factor_secret
    ) {
      return res
        .status(400)
        .json({
          message:
            'Commencez d’abord la configuration 2FA.',
        })
    }

    const validCode =
      verifyTotpCode(
        user.two_factor_secret,
        code,
      )

    if (!validCode) {
      return res
        .status(400)
        .json({
          message:
            'Le code de vérification est incorrect.',
        })
    }

    await pool.execute(
      `
        UPDATE users
        SET two_factor_enabled = 1
        WHERE id = ?
      `,
      [userId],
    )

    return res.json({
      message:
        'La vérification en deux étapes a été activée avec succès.',

      twoFactorEnabled:
        true,
    })
  } catch (error) {
    next(error)
  }
}


/* =========================
   DISABLE 2FA
========================= */

async function disableTwoFactor(
  req,
  res,
  next,
) {
  try {
    const userId =
      req.user.id

    const currentPassword =
      String(
        req.body
          .currentPassword ||
          '',
      )

    const code =
      String(
        req.body.code ||
          '',
      ).trim()

    if (
      !currentPassword ||
      !code
    ) {
      return res
        .status(400)
        .json({
          message:
            'Le mot de passe actuel et le code 2FA sont requis.',
        })
    }

    const [rows] =
      await pool.execute(
        `
          SELECT
            id,
            password_hash,
            two_factor_enabled,
            two_factor_secret,
            is_active
          FROM users
          WHERE id = ?
          LIMIT 1
        `,
        [userId],
      )

    const user =
      rows[0]

    if (
      !user ||
      !user.is_active
    ) {
      return res
        .status(401)
        .json({
          message:
            'Session invalide.',
        })
    }

    if (
      !user.two_factor_enabled ||
      !user.two_factor_secret
    ) {
      return res
        .status(400)
        .json({
          message:
            'La vérification en deux étapes n’est pas activée.',
        })
    }

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        user.password_hash,
      )

    if (
      !passwordMatches
    ) {
      return res
        .status(400)
        .json({
          message:
            'Le mot de passe actuel est incorrect.',
        })
    }

    const validCode =
      verifyTotpCode(
        user.two_factor_secret,
        code,
      )

    if (!validCode) {
      return res
        .status(400)
        .json({
          message:
            'Le code de vérification est incorrect.',
        })
    }

    await pool.execute(
      `
        UPDATE users
        SET
          two_factor_enabled = 0,
          two_factor_secret = NULL
        WHERE id = ?
      `,
      [userId],
    )

    await pool.execute(
      `
        UPDATE two_factor_challenges
        SET used_at = NOW()
        WHERE user_id = ?
          AND used_at IS NULL
      `,
      [userId],
    )

    return res.json({
      message:
        'La vérification en deux étapes a été désactivée.',

      twoFactorEnabled:
        false,
    })
  } catch (error) {
    next(error)
  }
}


/* =========================
   FORGOT PASSWORD
========================= */

async function forgotPassword(
  req,
  res,
  next,
) {
  try {
    const email =
      normalizeEmail(
        req.body.email,
      )

    const [rows] =
      await pool.execute(
        `
          SELECT
            id,
            first_name,
            email,
            is_active
          FROM users
          WHERE email = ?
          LIMIT 1
        `,
        [email],
      )

    const user =
      rows[0]

    if (
      user &&
      user.is_active
    ) {
      const rawToken =
        crypto
          .randomBytes(32)
          .toString('hex')

      const tokenHash =
        crypto
          .createHash(
            'sha256',
          )
          .update(rawToken)
          .digest('hex')

      const resetUrl =
        `${env.clientUrl}/reinitialiser-mot-de-passe/${rawToken}`

      await pool.execute(
        `
          UPDATE password_reset_tokens
          SET used_at = NOW()
          WHERE user_id = ?
            AND used_at IS NULL
        `,
        [user.id],
      )

      await pool.execute(
        `
          INSERT INTO password_reset_tokens (
            user_id,
            token_hash,
            expires_at
          )
          VALUES (
            ?,
            ?,
            DATE_ADD(
              NOW(),
              INTERVAL ? MINUTE
            )
          )
        `,
        [
          user.id,
          tokenHash,
          RESET_TOKEN_TTL_MINUTES,
        ],
      )

      await sendPasswordResetEmail({
        to:
          user.email,

        name:
          user.first_name,

        resetUrl,
      })
    }

    return res.json({
      message:
        FORGOT_PASSWORD_RESPONSE,
    })
  } catch (error) {
    next(error)
  }
}


/* =========================
   RESET PASSWORD
========================= */

async function resetPassword(
  req,
  res,
  next,
) {
  const connection =
    await pool.getConnection()

  try {
    const token =
      String(
        req.body.token ||
          req.params.token ||
          '',
      ).trim()

    const password =
      String(
        req.body.password ||
          '',
      )

    if (
      !token ||
      !password
    ) {
      return res
        .status(400)
        .json({
          message:
            'Le lien de réinitialisation et le nouveau mot de passe sont requis.',
        })
    }

    if (
      password.length < 8
    ) {
      return res
        .status(400)
        .json({
          message:
            'Le nouveau mot de passe doit contenir au moins 8 caractères.',
        })
    }

    const tokenHash =
      crypto
        .createHash(
          'sha256',
        )
        .update(token)
        .digest('hex')

    await connection
      .beginTransaction()

    const [rows] =
      await connection.execute(
        `
          SELECT
            reset_tokens.id,
            reset_tokens.user_id,
            users.password_hash
          FROM password_reset_tokens
            AS reset_tokens
          INNER JOIN users
            ON users.id =
              reset_tokens.user_id
          WHERE
            reset_tokens.token_hash = ?
            AND reset_tokens.used_at IS NULL
            AND reset_tokens.expires_at > NOW()
            AND users.is_active = 1
          LIMIT 1
          FOR UPDATE
        `,
        [tokenHash],
      )

    const resetToken =
      rows[0]

    if (!resetToken) {
      await connection
        .rollback()

      return res
        .status(400)
        .json({
          message:
            'Le lien de réinitialisation est invalide ou expiré.',
        })
    }

    const sameAsCurrentPassword =
      await bcrypt.compare(
        password,
        resetToken.password_hash,
      )

    if (
      sameAsCurrentPassword
    ) {
      await connection
        .rollback()

      return res
        .status(400)
        .json({
          message:
            'Le nouveau mot de passe doit être différent de l’ancien mot de passe.',
        })
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12,
      )

    /*
     * 1. Modifier le mot de passe.
     */
    await connection.execute(
      `
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
      `,
      [
        passwordHash,
        resetToken.user_id,
      ],
    )

    /*
     * 2. Invalider tous les liens
     *    de réinitialisation encore
     *    actifs pour cet utilisateur.
     */
    await connection.execute(
      `
        UPDATE password_reset_tokens
        SET used_at = NOW()
        WHERE user_id = ?
          AND used_at IS NULL
      `,
      [
        resetToken.user_id,
      ],
    )

    /*
     * 3. Déconnecter TOUS les appareils.
     *
     * Un reset de mot de passe est une
     * opération sensible. Contrairement
     * au changement de mot de passe
     * depuis le compte, aucune session
     * existante ne doit rester active.
     */
    await connection.execute(
      `
        UPDATE user_sessions
        SET revoked_at = NOW()
        WHERE user_id = ?
          AND revoked_at IS NULL
      `,
      [
        resetToken.user_id,
      ],
    )

    /*
     * 4. Invalider également les
     *    challenges 2FA de connexion
     *    encore ouverts.
     */
    await connection.execute(
      `
        UPDATE two_factor_challenges
        SET used_at = NOW()
        WHERE user_id = ?
          AND used_at IS NULL
      `,
      [
        resetToken.user_id,
      ],
    )

    await connection
      .commit()

    return res.json({
      message:
        'Votre mot de passe a été réinitialisé. Tous les appareils ont été déconnectés.',
    })
  } catch (error) {
    try {
      await connection
        .rollback()
    } catch {
      // La transaction peut déjà être terminée.
    }

    next(error)
  } finally {
    connection.release()
  }
}

/* =========================
   CHANGE PASSWORD
========================= */

async function changePassword(
  req,
  res,
  next,
) {
  const connection =
    await pool.getConnection()

  try {
    const userId =
      req.user.id

    const currentSessionId =
      req.user.sessionId

    const currentPassword =
      String(
        req.body
          .currentPassword ||
          '',
      )

    const newPassword =
      String(
        req.body.newPassword ||
          '',
      )

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res
        .status(400)
        .json({
          message:
            'Le mot de passe actuel et le nouveau mot de passe sont requis.',
        })
    }

    if (
      newPassword.length < 8
    ) {
      return res
        .status(400)
        .json({
          message:
            'Le nouveau mot de passe doit contenir au moins 8 caractères.',
        })
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return res
        .status(400)
        .json({
          message:
            'Le nouveau mot de passe doit être différent du mot de passe actuel.',
        })
    }

    await connection
      .beginTransaction()

    const [rows] =
      await connection.execute(
        `
          SELECT
            id,
            password_hash,
            is_active
          FROM users
          WHERE id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [userId],
      )

    const user =
      rows[0]

    if (
      !user ||
      !user.is_active
    ) {
      await connection
        .rollback()

      return res
        .status(401)
        .json({
          message:
            'Session invalide.',
        })
    }

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        user.password_hash,
      )

    if (
      !passwordMatches
    ) {
      await connection
        .rollback()

      return res
        .status(400)
        .json({
          message:
            'Le mot de passe actuel est incorrect.',
        })
    }

    const sameAsCurrentPassword =
      await bcrypt.compare(
        newPassword,
        user.password_hash,
      )

    if (
      sameAsCurrentPassword
    ) {
      await connection
        .rollback()

      return res
        .status(400)
        .json({
          message:
            'Le nouveau mot de passe doit être différent du mot de passe actuel.',
        })
    }

    const newPasswordHash =
      await bcrypt.hash(
        newPassword,
        12,
      )

    await connection.execute(
      `
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
      `,
      [
        newPasswordHash,
        userId,
      ],
    )

    /*
     * Après un changement de mot
     * de passe, toutes les autres
     * sessions sont révoquées.
     *
     * La session actuelle reste
     * active afin que l'utilisateur
     * ne soit pas déconnecté de
     * l'appareil utilisé pour
     * changer le mot de passe.
     */
    await connection.execute(
      `
        UPDATE user_sessions
        SET revoked_at = NOW()
        WHERE user_id = ?
          AND session_id <> ?
          AND revoked_at IS NULL
          AND expires_at > NOW()
      `,
      [
        userId,
        currentSessionId,
      ],
    )

    await connection
      .commit()

    return res.json({
      message:
        'Votre mot de passe a été modifié avec succès. Les autres appareils ont été déconnectés.',
    })
  } catch (error) {
    try {
      await connection
        .rollback()
    } catch {
      // La transaction peut déjà être terminée.
    }

    next(error)
  } finally {
    connection.release()
  }
}

/* =========================
   GET USER SESSIONS
========================= */

async function getSessions(
  req,
  res,
  next,
) {
  try {
    const userId =
      req.user.id

    const currentSessionId =
      req.user.sessionId

    const [rows] =
      await pool.execute(
        `
          SELECT
            id,
            session_id,
            user_agent,
            ip_address,
            created_at,
            last_seen_at,
            expires_at,
            revoked_at
          FROM user_sessions
          WHERE user_id = ?
            AND revoked_at IS NULL
            AND expires_at > NOW()
          ORDER BY
            last_seen_at DESC,
            created_at DESC
        `,
        [userId],
      )

    const sessions =
      rows.map(
        (session) => ({
          id:
            session.id,

          sessionId:
            session.session_id,

          userAgent:
            session.user_agent,

          ipAddress:
            session.ip_address,

          createdAt:
            session.created_at,

          lastSeenAt:
            session.last_seen_at,

          expiresAt:
            session.expires_at,

          isCurrent:
            session.session_id ===
            currentSessionId,
        }),
      )

    return res.json({
      sessions,
    })
  } catch (error) {
    next(error)
  }
}


/* =========================
   REVOKE OTHER SESSIONS
========================= */

async function revokeOtherSessions(
  req,
  res,
  next,
) {
  try {
    const userId =
      req.user.id

    const currentSessionId =
      req.user.sessionId

    const [result] =
      await pool.execute(
        `
          UPDATE user_sessions
          SET revoked_at = NOW()
          WHERE user_id = ?
            AND session_id <> ?
            AND revoked_at IS NULL
            AND expires_at > NOW()
        `,
        [
          userId,
          currentSessionId,
        ],
      )

    return res.json({
      message:
        'Les autres appareils ont été déconnectés avec succès.',

      revokedCount:
        result.affectedRows,
    })
  } catch (error) {
    next(error)
  }
}


/* =========================
   REVOKE ONE SESSION
========================= */

async function revokeSession(
  req,
  res,
  next,
) {
  try {
    const userId =
      req.user.id

    const currentSessionId =
      req.user.sessionId

    const sessionId =
      String(
        req.params
          .sessionId ||
          '',
      ).trim()

    if (!sessionId) {
      return res
        .status(400)
        .json({
          message:
            'La session est requise.',
        })
    }

    if (
      sessionId ===
      currentSessionId
    ) {
      return res
        .status(400)
        .json({
          message:
            'Vous ne pouvez pas déconnecter la session actuelle avec cette action.',
        })
    }

    const [result] =
      await pool.execute(
        `
          UPDATE user_sessions
          SET revoked_at = NOW()
          WHERE user_id = ?
            AND session_id = ?
            AND revoked_at IS NULL
            AND expires_at > NOW()
        `,
        [
          userId,
          sessionId,
        ],
      )

    if (
      result.affectedRows ===
      0
    ) {
      return res
        .status(404)
        .json({
          message:
            'Cette session est introuvable ou déjà déconnectée.',
        })
    }

    return res.json({
      message:
        'L’appareil a été déconnecté avec succès.',
    })
  } catch (error) {
    next(error)
  }
}


/* =========================
   LOGOUT CURRENT SESSION
========================= */

async function logout(
  req,
  res,
  next,
) {
  try {
    const userId =
      req.user.id

    const currentSessionId =
      req.user.sessionId

    await pool.execute(
      `
        UPDATE user_sessions
        SET revoked_at = NOW()
        WHERE user_id = ?
          AND session_id = ?
          AND revoked_at IS NULL
      `,
      [
        userId,
        currentSessionId,
      ],
    )

    return res.json({
      message:
        'Vous avez été déconnecté avec succès.',
    })
  } catch (error) {
    next(error)
  }
}


/* =========================
   EXPORTS
========================= */

module.exports = {
  register,
  login,
  verifyLoginTwoFactor,
  getMe,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  forgotPassword,
  resetPassword,
  changePassword,

  getSessions,
  revokeOtherSessions,
  revokeSession,
  logout,
}