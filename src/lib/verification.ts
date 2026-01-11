import prisma from './prisma'
import crypto from 'crypto'

// Gera código de 6 dígitos
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Gera token seguro para reset de senha
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Cria código de verificação no banco
export async function createVerificationCode(
  email: string,
  type: string = 'EMAIL_VERIFICATION'
) {
  // Invalida códigos anteriores
  await prisma.verificationCode.updateMany({
    where: {
      email,
      type,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  })

  // Cria novo código (expira em 10 minutos)
  const code = generateVerificationCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.verificationCode.create({
    data: {
      email,
      code,
      type,
      expiresAt,
    },
  })

  return code
}

// Verifica código
export async function verifyCode(
  email: string,
  code: string,
  type: string = 'EMAIL_VERIFICATION'
) {
  const verification = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      type,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  })

  if (!verification) {
    return { valid: false, error: 'Código inválido ou expirado' }
  }

  // Marca como usado
  await prisma.verificationCode.update({
    where: { id: verification.id },
    data: { usedAt: new Date() },
  })

  return { valid: true }
}

// Cria token de reset de senha
export async function createPasswordResetToken(email: string) {
  // Invalida tokens anteriores
  await prisma.passwordResetToken.updateMany({
    where: {
      email,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  })

  // Cria novo token (expira em 1 hora)
  const token = generateResetToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expiresAt,
    },
  })

  return token
}

// Verifica token de reset
export async function verifyResetToken(token: string) {
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      token,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  })

  if (!resetToken) {
    return { valid: false, error: 'Token inválido ou expirado', email: null }
  }

  return { valid: true, email: resetToken.email }
}

// Marca token como usado
export async function consumeResetToken(token: string) {
  await prisma.passwordResetToken.update({
    where: { token },
    data: { usedAt: new Date() },
  })
}
