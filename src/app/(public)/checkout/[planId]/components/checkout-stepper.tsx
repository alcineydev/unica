'use client'

import { Check, User, MapPin, CreditCard } from 'lucide-react'

interface StepperProps {
  currentStep: number
  steps?: { label: string; icon: React.ComponentType<{ className?: string }> }[]
}

const DEFAULT_STEPS = [
  { label: 'Dados', icon: User },
  { label: 'Endereço', icon: MapPin },
  { label: 'Pagamento', icon: CreditCard },
]

export default function CheckoutStepper({ currentStep, steps = DEFAULT_STEPS }: StepperProps) {
  return (
    <div className="flex items-center justify-center w-full max-w-md mx-auto">
      {steps.map((step, index) => {
        const StepIcon = step.icon
        const isActive = index === currentStep
        const isCompleted = index < currentStep

        return (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isCompleted
                    ? 'bg-primary border-primary text-white'
                    : isActive
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-medium transition-colors ${
                  isActive || isCompleted ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 mb-5">
                <div className="h-0.5 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
