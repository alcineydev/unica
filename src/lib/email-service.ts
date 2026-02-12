import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export class EmailService {
    private static fromEmail = process.env.EMAIL_FROM || 'noreply@unicabeneficios.com.br'
    private static appName = 'UNICA Clube de Benefícios'

    // Gerar código de verificação de 4 dígitos
    static generateVerificationCode(): string {
        return Math.floor(1000 + Math.random() * 9000).toString()
    }

    // Enviar código de verificação para troca de email
    static async sendEmailChangeVerification(
        currentEmail: string,
        newEmail: string,
        code: string,
        adminName: string
    ): Promise<boolean> {
        try {
            // Envia para o email atual
            await resend.emails.send({
                from: this.fromEmail,
                to: currentEmail,
                subject: `[${this.appName}] Código de Verificação - Alteração de Email`,
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
              .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; }
              .logo { text-align: center; margin-bottom: 20px; }
              .code { font-size: 32px; font-weight: bold; text-align: center; color: #dc2626; letter-spacing: 8px; padding: 20px; background: #fef2f2; border-radius: 8px; margin: 20px 0; }
              .info { color: #666; font-size: 14px; margin: 15px 0; }
              .warning { color: #dc2626; font-size: 12px; margin-top: 20px; padding: 15px; background: #fef2f2; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <h2 style="color: #dc2626;">🔐 ${this.appName}</h2>
              </div>
              <h3>Olá, ${adminName}!</h3>
              <p>Você solicitou a alteração do seu email de administrador.</p>
              <p><strong>Novo email:</strong> ${newEmail}</p>
              <p>Use o código abaixo para confirmar a alteração:</p>
              <div class="code">${code}</div>
              <p class="info">Este código expira em <strong>10 minutos</strong>.</p>
              <div class="warning">
                ⚠️ <strong>Atenção:</strong> Se você não solicitou esta alteração, ignore este email e sua conta permanecerá segura.
              </div>
            </div>
          </body>
          </html>
        `,
            })

            return true
        } catch (error) {
            console.error('Erro ao enviar email de verificação:', error)
            return false
        }
    }

    // Confirmar alteração de email (enviar para o novo email)
    static async sendEmailChangeConfirmation(
        newEmail: string,
        adminName: string
    ): Promise<boolean> {
        try {
            await resend.emails.send({
                from: this.fromEmail,
                to: newEmail,
                subject: `[${this.appName}] Email Alterado com Sucesso`,
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
              .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; }
              .success { color: #16a34a; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 style="color: #dc2626;">🔐 ${this.appName}</h2>
              <h3 class="success">✅ Email Alterado com Sucesso!</h3>
              <p>Olá, ${adminName}!</p>
              <p>Seu email de administrador foi alterado para <strong>${newEmail}</strong>.</p>
              <p>Agora você pode usar este email para fazer login no painel.</p>
              <p style="color: #666; font-size: 12px; margin-top: 20px;">
                Se você não fez esta alteração, entre em contato com o suporte imediatamente.
              </p>
            </div>
          </body>
          </html>
        `,
            })

            return true
        } catch (error) {
            console.error('Erro ao enviar confirmação:', error)
            return false
        }
    }

    // Enviar email de boas-vindas para novo admin
    static async sendWelcomeAdmin(
        email: string,
        name: string,
        tempPassword: string
    ): Promise<boolean> {
        try {
            await resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: `[${this.appName}] Bem-vindo ao Painel de Administração`,
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
              .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; }
              .credentials { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .password { font-family: monospace; font-size: 18px; color: #0369a1; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 style="color: #dc2626;">🎉 ${this.appName}</h2>
              <h3>Bem-vindo, ${name}!</h3>
              <p>Você foi adicionado como administrador do sistema.</p>
              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Senha temporária:</strong> <span class="password">${tempPassword}</span></p>
              </div>
              <p>Acesse o painel em: <a href="https://app.unicabeneficios.com.br/admin">app.unicabeneficios.com.br/admin</a></p>
              <p style="color: #dc2626; font-weight: bold;">⚠️ Recomendamos alterar sua senha no primeiro acesso.</p>
            </div>
          </body>
          </html>
        `,
            })

            return true
        } catch (error) {
            console.error('Erro ao enviar email de boas-vindas:', error)
            return false
        }
    }

    // Enviar alerta de exclusão de conta
    static async sendAccountDeletionNotice(
        email: string,
        name: string
    ): Promise<boolean> {
        try {
            await resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: `[${this.appName}] Sua Conta de Administrador foi Removida`,
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
              .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 style="color: #dc2626;">⚠️ ${this.appName}</h2>
              <h3>Olá, ${name}</h3>
              <p>Informamos que sua conta de administrador foi removida do sistema.</p>
              <p>Você não terá mais acesso ao painel de administração.</p>
              <p style="color: #666; font-size: 12px; margin-top: 20px;">
                Se você acredita que isso foi um erro, entre em contato com o desenvolvedor.
              </p>
            </div>
          </body>
          </html>
        `,
            })

            return true
        } catch (error) {
            console.error('Erro ao enviar notificação de exclusão:', error)
            return false
        }
    }
}
