'use client'

import { User, MapPin, CreditCard, Check } from 'lucide-react'

interface Props {
  currentStep: number
}

const steps = [
  { label: 'Dados', icon: User },
  { label: 'Endereço', icon: MapPin },
  { label: 'Pagamento', icon: CreditCard },
]

export default function CheckoutStepper({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto">
      {steps.map((step, i) => {
        const isActive = i === currentStep
        const isCompleted = i < currentStep
        const StepIcon = step.icon

        return (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted
                  ? 'bg-green-500 text-white shadow-sm shadow-green-200'
                  : isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200/60 ring-4 ring-blue-100'
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <span className={`text-[11px] mt-1.5 font-medium transition-colors ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>

            {/* Conector */}
            {i < steps.length - 1 && (
              <div className={`h-[2px] w-full mx-1 -mt-5 transition-colors duration-300 ${
                isCompleted ? 'bg-green-400' : 'bg-gray-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
