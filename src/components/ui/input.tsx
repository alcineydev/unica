import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-xl bg-white px-4 py-2 text-sm text-slate-900",
        "placeholder:text-slate-400 transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "border border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-900",
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

export { Input }
