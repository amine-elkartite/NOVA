const express = require('express')

const {
  body,
  param,
} = require('express-validator')

const authController = require(
  '../controllers/auth.controller',
)

const {
  authenticate,
} = require(
  '../middleware/auth.middleware',
)

const {
  handleValidation,
} = require(
  '../middleware/validation.middleware',
)


const router = express.Router()


/* =========================
   VALIDATORS
========================= */

const nameValidator = (
  fieldName,
  label,
) =>
  body(fieldName)
    .custom((value, { req }) => {
      const fallbackField =
        fieldName === 'firstName'
          ? 'first_name'
          : 'last_name'

      return Boolean(
        String(
          value ||
            req.body[fallbackField] ||
            '',
        ).trim(),
      )
    })
    .withMessage(
      `${label} est requis.`,
    )
    .bail()
    .custom((value, { req }) => {
      const fallbackField =
        fieldName === 'firstName'
          ? 'first_name'
          : 'last_name'

      return (
        String(
          value ||
            req.body[fallbackField] ||
            '',
        ).trim().length <= 100
      )
    })
    .withMessage(
      `${label} ne peut pas dépasser 100 caractères.`,
    )


const passwordValidator =
  body('password')
    .isString()
    .withMessage(
      'Le mot de passe est requis.',
    )
    .bail()
    .isLength({
      min: 8,
    })
    .withMessage(
      'Le mot de passe doit contenir au moins 8 caractères.',
    )


const currentPasswordValidator =
  body('currentPassword')
    .isString()
    .withMessage(
      'Le mot de passe actuel est requis.',
    )
    .bail()
    .notEmpty()
    .withMessage(
      'Le mot de passe actuel est requis.',
    )


const newPasswordValidator =
  body('newPassword')
    .isString()
    .withMessage(
      'Le nouveau mot de passe est requis.',
    )
    .bail()
    .isLength({
      min: 8,
    })
    .withMessage(
      'Le nouveau mot de passe doit contenir au moins 8 caractères.',
    )


const twoFactorCodeValidator =
  body('code')
    .isString()
    .withMessage(
      'Le code de vérification est requis.',
    )
    .bail()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage(
      'Le code de vérification doit contenir 6 chiffres.',
    )


/* =========================
   REGISTER
========================= */

router.post(
  '/register',

  [
    nameValidator(
      'firstName',
      'Le prénom',
    ),

    nameValidator(
      'lastName',
      'Le nom',
    ),

    body('email')
      .isEmail()
      .withMessage(
        "L'adresse e-mail est invalide.",
      )
      .bail()
      .normalizeEmail(),

    body('phone')
      .optional({
        values: 'falsy',
      })
      .isLength({
        max: 30,
      })
      .withMessage(
        'Le téléphone ne peut pas dépasser 30 caractères.',
      ),

    passwordValidator,
  ],

  handleValidation,

  authController.register,
)


/* =========================
   LOGIN
========================= */

router.post(
  '/login',

  [
    body('email')
      .isEmail()
      .withMessage(
        "L'adresse e-mail est invalide.",
      )
      .bail()
      .normalizeEmail(),

    body('password')
      .isString()
      .notEmpty()
      .withMessage(
        'Le mot de passe est requis.',
      ),
  ],

  handleValidation,

  authController.login,
)


/* =========================
   VERIFY LOGIN 2FA
========================= */

router.post(
  '/2fa/login/verify',

  [
    body('challengeToken')
      .isString()
      .withMessage(
        'Le challenge 2FA est requis.',
      )
      .bail()
      .notEmpty()
      .withMessage(
        'Le challenge 2FA est requis.',
      ),

    twoFactorCodeValidator,
  ],

  handleValidation,

  authController.verifyLoginTwoFactor,
)


/* =========================
   CURRENT USER
========================= */

router.get(
  '/me',

  authenticate,

  authController.getMe,
)


/* =========================
   2FA SETUP
========================= */

router.post(
  '/2fa/setup',

  authenticate,

  authController.setupTwoFactor,
)


/* =========================
   2FA ENABLE
========================= */

router.post(
  '/2fa/enable',

  authenticate,

  [
    twoFactorCodeValidator,
  ],

  handleValidation,

  authController.enableTwoFactor,
)


/* =========================
   2FA DISABLE
========================= */

router.post(
  '/2fa/disable',

  authenticate,

  [
    currentPasswordValidator,
    twoFactorCodeValidator,
  ],

  handleValidation,

  authController.disableTwoFactor,
)


/* =========================
   CHANGE PASSWORD
========================= */

router.put(
  '/change-password',

  authenticate,

  [
    currentPasswordValidator,
    newPasswordValidator,
  ],

  handleValidation,

  authController.changePassword,
)


/* =========================
   USER SESSIONS
========================= */

/*
 * GET /api/auth/sessions
 *
 * Retourne toutes les sessions actives
 * de l'utilisateur connecté.
 */
router.get(
  '/sessions',

  authenticate,

  authController.getSessions,
)


/*
 * DELETE /api/auth/sessions/others
 *
 * Déconnecte tous les autres appareils,
 * sans toucher à la session actuelle.
 *
 * IMPORTANT:
 * Cette route doit rester AVANT
 * /sessions/:sessionId.
 */
router.delete(
  '/sessions/others',

  authenticate,

  authController.revokeOtherSessions,
)


/*
 * DELETE /api/auth/sessions/:sessionId
 *
 * Déconnecte un appareil précis.
 */
router.delete(
  '/sessions/:sessionId',

  authenticate,

  [
    param('sessionId')
      .isUUID()
      .withMessage(
        'La session est invalide.',
      ),
  ],

  handleValidation,

  authController.revokeSession,
)


/* =========================
   LOGOUT
========================= */

/*
 * Révoque la session actuelle côté serveur.
 */
router.post(
  '/logout',

  authenticate,

  authController.logout,
)


/* =========================
   FORGOT PASSWORD
========================= */

router.post(
  '/forgot-password',

  [
    body('email')
      .isEmail()
      .withMessage(
        "L'adresse e-mail est invalide.",
      )
      .bail()
      .normalizeEmail(),
  ],

  handleValidation,

  authController.forgotPassword,
)


/* =========================
   RESET PASSWORD
========================= */

router.post(
  '/reset-password',

  [
    body('token')
      .isString()
      .notEmpty()
      .withMessage(
        'Le jeton de réinitialisation est requis.',
      ),

    passwordValidator,
  ],

  handleValidation,

  authController.resetPassword,
)


router.post(
  '/reset-password/:token',

  [
    param('token')
      .isString()
      .notEmpty()
      .withMessage(
        'Le jeton de réinitialisation est requis.',
      ),

    passwordValidator,
  ],

  handleValidation,

  authController.resetPassword,
)


module.exports = router