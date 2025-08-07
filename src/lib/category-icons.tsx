import React from 'react'
import {
  UtensilsCrossed,
  ShoppingBag,
  Heart,
  GamepadIcon,
  Scissors,
  Store
} from 'lucide-react'

export type CategoryType = 
  | 'Food & Beverage' 
  | 'Retail' 
  | 'Health & Wellness' 
  | 'Entertainment & Recreation' 
  | 'Personal Services'

const categoryIcons = {
  'Food & Beverage': UtensilsCrossed,
  'Retail': ShoppingBag,
  'Health & Wellness': Heart,
  'Entertainment & Recreation': GamepadIcon,
  'Personal Services': Scissors,
} as const

const categoryColors = {
  'Food & Beverage': 'text-orange-500',
  'Retail': 'text-blue-500',
  'Health & Wellness': 'text-green-500',
  'Entertainment & Recreation': 'text-purple-500',
  'Personal Services': 'text-pink-500',
} as const

const categoryBgColors = {
  'Food & Beverage': 'bg-orange-50',
  'Retail': 'bg-blue-50',
  'Health & Wellness': 'bg-green-50',
  'Entertainment & Recreation': 'bg-purple-50',
  'Personal Services': 'bg-pink-50',
} as const

interface CategoryIconProps {
  category: CategoryType
  size?: number
  className?: string
  showBackground?: boolean
}

export function CategoryIcon({ 
  category, 
  size = 20, 
  className = '', 
  showBackground = false 
}: CategoryIconProps) {
  const Icon = categoryIcons[category] || Store
  const colorClass = categoryColors[category] || 'text-gray-500'
  const bgColorClass = categoryBgColors[category] || 'bg-gray-50'
  
  return (
    <div 
      className={`
        ${showBackground ? `p-2 rounded-lg ${bgColorClass}` : ''} 
        flex items-center justify-center
        ${className}
      `}
    >
      <Icon 
        size={size} 
        className={colorClass}
      />
    </div>
  )
}

export function getCategoryIcon(category: CategoryType) {
  return categoryIcons[category] || Store
}

export function getCategoryColor(category: CategoryType) {
  return categoryColors[category] || 'text-gray-500'
}

export function getCategoryBgColor(category: CategoryType) {
  return categoryBgColors[category] || 'bg-gray-50'
}

export const allCategories: CategoryType[] = [
  'Food & Beverage',
  'Retail', 
  'Health & Wellness',
  'Entertainment & Recreation',
  'Personal Services'
]