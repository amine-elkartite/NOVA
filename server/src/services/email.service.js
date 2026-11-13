const nodemailer = require('nodemailer')
const env = require('../config/env')

function hasEmailConfig() {
  return Boolean(env.email.host && env.email.user && env.email.password)
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  if (!hasEmailConfig()) {
    return {
      sent: false,
      reason: 'SMTP_NOT_CONFIGURED',
    }
  }

  const transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: {
      user: env.email.user,
      pass: env.email.password,
    },
  })

  await transporter.sendMail({
    from: env.email.from,
    to,
    subject: 'Réinitialisation de votre mot de passe NOVA',
    text: [
      `Bonjour ${name || ''}`.trim(),
      '',
      'Vous avez demandé la réinitialisation de votre mot de passe NOVA.',
      `Lien de réinitialisation : ${resetUrl}`,
      '',
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
    ].join('\n'),
  })

  return {
    sent: true,
  }
}

module.exports = {
  hasEmailConfig,
  sendPasswordResetEmail,
}
