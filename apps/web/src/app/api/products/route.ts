import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { transformProduct } from "@/lib/transformers"
import { requireAdmin } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Query params
    const category = searchParams.get("category")
    const brand = searchParams.get("brand")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sortBy = searchParams.get("sortBy") || "newest"
    const featured = searchParams.get("featured")
    const isNew = searchParams.get("new")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")
    const search = searchParams.get("search")

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (category) {
      where.category = { slug: category }
    }

    if (brand) {
      where.brand = { slug: brand }
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) (where.price as Record<string, number>).gte = Number(minPrice)
      if (maxPrice) (where.price as Record<string, number>).lte = Number(maxPrice)
    }

    if (featured === "true") {
      where.isFeatured = true
    }

    if (isNew === "true") {
      where.isNew = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Attribute value filters: avGroup=attrId:valueId1,valueId2 (AND across attrs, OR within)
    const avGroups = searchParams.getAll("avGroup")
    if (avGroups.length > 0) {
      const andConditions = avGroups
        .map((group) => {
          const colonIdx = group.indexOf(":")
          if (colonIdx === -1) return null
          const valueIds = group.slice(colonIdx + 1).split(",").filter(Boolean)
          if (valueIds.length === 0) return null
          return {
            variants: {
              some: {
                isActive: true,
                values: { some: { attributeValueId: { in: valueIds } } },
              },
            },
          }
        })
        .filter(Boolean)

      if (andConditions.length > 0) {
        where.AND = andConditions
      }
    }

    // Build orderBy
    let orderBy: Record<string, string> = { createdAt: "desc" }
    switch (sortBy) {
      case "price-asc":
        orderBy = { price: "asc" }
        break
      case "price-desc":
        orderBy = { price: "desc" }
        break
      case "newest":
        orderBy = { createdAt: "desc" }
        break
      case "popular":
        orderBy = { stock: "desc" } // Placeholder - would use sales count
        break
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
        brand: true,
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            label: true,
            stock: true,
            price: true,
            values: {
              select: {
                attributeValue: {
                  select: {
                    value: true,
                    attribute: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      take: limit ? Number(limit) : undefined,
      skip: offset ? Number(offset) : undefined,
    })

    const total = await prisma.product.count({ where })

    return NextResponse.json({
      products: products.map((p) => {
        const mappedVariants = p.variants.map((v) => ({
          id: v.id,
          label: v.label,
          stock: v.stock,
          price: v.price ? Number(v.price) : null,
          values: v.values.map((vv) => ({
            attrName: vv.attributeValue.attribute.name,
            value: vv.attributeValue.value,
          })),
        }))

        const attrNamesOrdered: string[] = []
        const seen = new Set<string>()
        for (const v of p.variants) {
          for (const vv of v.values) {
            const name = vv.attributeValue.attribute.name
            if (!seen.has(name)) { seen.add(name); attrNamesOrdered.push(name) }
          }
        }

        const totalStock = p.variants.length > 0
          ? p.variants.reduce((sum, v) => sum + v.stock, 0)
          : p.stock

        return {
          ...transformProduct(p),
          stock: totalStock,
          variants: mappedVariants,
          variantAttributeNames: attrNamesOrdered,
        }
      }),
      total,
      limit: limit ? Number(limit) : null,
      offset: offset ? Number(offset) : 0,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Error fetching products" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()

    type VariantInput = {
      sku?: string
      stock: number
      price?: number
      attributeValueIds: string[]
    }
    const variants: VariantInput[] = body.variants ?? []

    // Resolve attribute value labels to auto-generate variant label
    let attributeValueMap: Record<string, string> = {}
    if (variants.length > 0) {
      const allIds = [...new Set(variants.flatMap((v) => v.attributeValueIds ?? []))]
      if (allIds.length > 0) {
        const avs = await prisma.attributeValue.findMany({
          where: { id: { in: allIds } },
          select: { id: true, value: true },
        })
        attributeValueMap = Object.fromEntries(avs.map((av) => [av.id, av.value]))
      }
    }

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        price: body.price,
        comparePrice: body.comparePrice,
        stock: variants.length > 0 ? variants.reduce((s, v) => s + (v.stock ?? 0), 0) : (body.stock || 0),
        images: body.images || [],
        specs: body.specs || {},
        isNew: body.isNew || false,
        isFeatured: body.isFeatured || false,
        categoryId: body.categoryId,
        brandId: body.brandId,
        variants: variants.length > 0 ? {
          create: variants.map((v) => {
            const ids = v.attributeValueIds ?? []
            const label = ids.map((id) => attributeValueMap[id] ?? "").filter(Boolean).join(" / ")
            return {
              label: label || undefined,
              sku: v.sku || undefined,
              stock: v.stock ?? 0,
              price: v.price ?? null,
              values: ids.length > 0 ? {
                create: ids.map((attributeValueId) => ({ attributeValueId })),
              } : undefined,
            }
          }),
        } : undefined,
      },
      include: {
        category: true,
        brand: true,
        variants: { orderBy: { createdAt: "asc" } },
      },
    })

    return NextResponse.json(transformProduct(product), { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 }
    )
  }
}
