import { NextRequest, NextResponse } from 'next/server'
import { findPaymentById } from '@/lib/asaas'

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

    const payment = await findPaymentById(paymentId)

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    // Status que indicam pagamento confirmado
    const confirmedStatuses = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']
    const isConfirmed = confirmedStatuses.includes(payment.status)

    return NextResponse.json({
      success: true,
      paymentId,
      status: payment.status,
      isConfirmed,
      isPending: payment.status === 'PENDING',
      isOverdue: payment.status === 'OVERDUE',
      value: payment.value,
      billingType: payment.billingType,
      confirmedDate: payment.confirmedDate,
      paymentDate: payment.paymentDate
    })

  } catch (error) {
    console.error('[STATUS] Erro ao verificar status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}

