import { prisma } from "@/lib/prisma"
import { transformBrand } from "@/lib/transformers"
import Image from "next/image"

async function getBrands() {
  try {
    const brands = await prisma.brand.findMany({
      where: { products: { some: { isActive: true } } },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
      orderBy: { name: "asc" },
      take: 8,
    })
    return brands.map(transformBrand)
  } catch {
    return []
  }
}

export async function BrandSection() {
  const brands = await getBrands()

  if (brands.length === 0) return null

  return (
    <section className="py-12 sm:py-16 border-t">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold sm:text-3xl">Marcas que Confiamos</h2>
          <p className="mt-2 text-muted-foreground">
            Trabajamos con las mejores marcas del mercado
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center justify-center px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              {brand.logo ? (
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={80}
                  height={32}
                  className="object-contain h-8 w-auto"
                />
              ) : (
                <span className="text-lg font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  {brand.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
