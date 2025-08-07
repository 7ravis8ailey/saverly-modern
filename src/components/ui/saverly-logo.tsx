import * as React from "react"
import { cn } from "@/lib/utils"
import { ShoppingBag } from "lucide-react"

interface SaverlyLogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  showIcon?: boolean
  variant?: "default" | "gradient" | "simple"
}

const sizeClasses = {
  sm: {
    text: "text-lg",
    icon: "h-5 w-5"
  },
  md: {
    text: "text-xl",
    icon: "h-6 w-6"
  },
  lg: {
    text: "text-2xl",
    icon: "h-8 w-8"
  },
  xl: {
    text: "text-3xl",
    icon: "h-10 w-10"
  }
}

export function SaverlyLogo({ 
  className, 
  size = "md", 
  showIcon = true, 
  variant = "gradient" 
}: SaverlyLogoProps) {
  const sizeConfig = sizeClasses[size]
  
  const getTextClasses = () => {
    const baseClasses = `${sizeConfig.text} font-bold tracking-tight`
    
    switch (variant) {
      case "gradient":
        return cn(baseClasses, "saverly-gradient-text")
      case "simple":
        return cn(baseClasses, "text-saverly-green")
      default:
        return cn(baseClasses, "text-gray-900")
    }
  }
  
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {showIcon && (
        <ShoppingBag className={cn(sizeConfig.icon, "text-saverly-green")} />
      )}
      <span className={getTextClasses()}>
        Saverly
      </span>
    </div>
  )
}

export default SaverlyLogo