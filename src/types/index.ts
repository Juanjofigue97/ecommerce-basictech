export interface ProductVariantItem {
  id: string
  label: string | null
  stock: number
  price?: number | null
  values?: { attrName: string; value: string }[]
}

export interface Product {
  id: string
  name: string
  slug: string
  brand: string
  category: string
  price: number
  originalPrice?: number
  images: string[]
  description: string
  specs: Record<string, string>
  stock: number
  isNew: boolean
  isFeatured: boolean
  rating: number
  variants?: ProductVariantItem[]
  variantAttributeNames?: string[]
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  productCount: number
}

export interface Brand {
  id: string
  name: string
  logo?: string
  productCount: number
}

export interface CartItem {
  product: Product
  quantity: number
  variantId?: string
  variantLabel?: string
  variantPrice?: number
}

export interface FilterState {
  categories: string[]
  brands: string[]
  priceRange: [number, number]
  sortBy: 'popular' | 'price-asc' | 'price-desc' | 'newest' | 'rating'
  // attributeId -> selected valueIds (AND between attributes, OR within)
  attributeValues: Record<string, string[]>
}
