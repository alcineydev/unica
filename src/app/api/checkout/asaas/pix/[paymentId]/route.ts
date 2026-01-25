import { NextRequest, NextResponse } from 'next/server'
import { getPixQrCode, findPaymentById } from '@/lib/asaas'

interface RouteParams {
  params: Promise<{ paymentId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { paymentId } = await params

    if (!paymentId) {
      return NextResponse.json({ error: 'ID do pagamento não informado' }, { status: 400 })
    }

    // Verificar se o pagamento existe e é PIX
    const payment = await findPaymentById(paymentId)

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    if (payment.billingType !== 'PIX') {
      return NextResponse.json({ error: 'Este pagamento não é PIX' }, { status: 400 })
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'PIX não disponível',
        status: payment.status,
        message: payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' 
          ? 'Este pagamento já foi realizado' 
          : 'Este pagamento não está mais pendente'
      }, { status: 400 })
    }

    // Buscar QR Code
    const pixData = await getPixQrCode(paymentId)

    return NextResponse.json({
      success: true,
      paymentId,
      status: payment.status,
      value: payment.value,
      pix: {
        qrCode: pixData.encodedImage,
        copyPaste: pixData.payload,
        expirationDate: pixData.expirationDate
      }
    })

  } catch (error) {
    console.error('[PIX] Erro ao buscar QR Code:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar QR Code' },
      { status: 500 }
    )
  }
}

