import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-xl bg-white px-4 py-3 text-sm text-slate-900",
        "placeholder:text-slate-400 transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "border border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none",
        className
      )}
      style={{
        borderColor: 'rgb(226, 232, 240)',
        outline: 'none'
      }}
      {...props}
    />
  )
}

export { Textarea }
