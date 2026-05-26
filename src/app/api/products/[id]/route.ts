import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { transformProduct } from "@/lib/transformers"

type Params = Promise<{ id: string }>

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params

    const product = await prisma.product.findFirst({
      where: { OR: [{ slug: id }, { id }], isActive: true },
      include: {
        category: true,
        brand: true,
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          include: {
            values: {
              include: {
                attributeValue: {
                  select: {
                    id: true, value: true, attributeId: true,
                    attribute: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const base = transformProduct(product)

    // Build per-variant attribute map and collect unique attributes for the selector
    const attrMap = new Map<string, { id: string; name: string; values: Map<string, string> }>()
    const mappedVariants = product.variants.map((v) => {
      const attributeValueIds: Record<string, string> = {}
      for (const val of v.values) {
        const attrId = val.attributeValue.attributeId
        const attrName = val.attributeValue.attribute.name
        attributeValueIds[attrId] = val.attributeValue.id
        if (!attrMap.has(attrId)) attrMap.set(attrId, { id: attrId, name: attrName, values: new Map() })
        attrMap.get(attrId)!.values.set(val.attributeValue.id, val.attributeValue.value)
      }
      return { id: v.id, label: v.label, sku: v.sku, stock: v.stock, price: v.price ? Number(v.price) : null, attributeValueIds }
    })

    const variantAttributes = Array.from(attrMap.values()).map((attr) => ({
      id: attr.id,
      name: attr.name,
      values: Array.from(attr.values.entries()).map(([id, value]) => ({ id, value })),
    }))

    return NextResponse.json({
      ...base,
      categoryId: product.categoryId,
      brandId: product.brandId,
      comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
      isNew: product.isNew,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      variants: mappedVariants,
      variantAttributes,
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Error fetching product" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params
    const body = await request.json()

    type VariantInput = {
      id?: string
      sku?: string
      stock: number
      price?: number
      attributeValueIds: string[]
    }
    const incomingVariants: VariantInput[] = body.variants ?? []

    // Resolve labels from attributeValueIds
    let attributeValueMap: Record<string, string> = {}
    const allValueIds = [...new Set(incomingVariants.flatMap((v) => v.attributeValueIds ?? []))]
    if (allValueIds.length > 0) {
      const avs = await prisma.attributeValue.findMany({
        where: { id: { in: allValueIds } },
        select: { id: true, value: true },
      })
      attributeValueMap = Object.fromEntries(avs.map((av) => [av.id, av.value]))
    }

    // Existing variant IDs in DB
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId: id },
      select: { id: true, _count: { select: { orderItems: true } } },
    })

    const incomingIds = new Set(incomingVariants.filter((v) => v.id).map((v) => v.id!))
    const toDeactivate = existingVariants.filter((v) => !incomingIds.has(v.id) && v._count.orderItems > 0)
    const toDelete = existingVariants.filter((v) => !incomingIds.has(v.id) && v._count.orderItems === 0)

    // Product base update + variant mutations in one transaction
    const product = await prisma.$transaction(async (tx) => {
      // Deactivate variants that have orders but were removed
      if (toDeactivate.length > 0) {
        await tx.productVariant.updateMany({
          where: { id: { in: toDeactivate.map((v) => v.id) } },
          data: { isActive: false },
        })
      }

      // Delete variants with no orders
      if (toDelete.length > 0) {
        await tx.productVariantValue.deleteMany({
          where: { variantId: { in: toDelete.map((v) => v.id) } },
        })
        await tx.productVariant.deleteMany({
          where: { id: { in: toDelete.map((v) => v.id) } },
        })
      }

      // Upsert incoming variants
      for (const v of incomingVariants) {
        const ids = v.attributeValueIds ?? []
        const label = ids.map((avid) => attributeValueMap[avid] ?? "").filter(Boolean).join(" / ")

        if (v.id) {
          // Update existing
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              label: label || null,
              sku: v.sku || null,
              stock: v.stock ?? 0,
              price: v.price ?? null,
              isActive: true,
            },
          })
          // Replace values
          await tx.productVariantValue.deleteMany({ where: { variantId: v.id } })
          if (ids.length > 0) {
            await tx.productVariantValue.createMany({
              data: ids.map((attributeValueId) => ({ variantId: v.id!, attributeValueId })),
            })
          }
        } else {
          // Create new
          const created = await tx.productVariant.create({
            data: {
              productId: id,
              label: label || null,
              sku: v.sku || null,
              stock: v.stock ?? 0,
              price: v.price ?? null,
            },
          })
          if (ids.length > 0) {
            await tx.productVariantValue.createMany({
              data: ids.map((attributeValueId) => ({ variantId: created.id, attributeValueId })),
            })
          }
        }
      }

      // Calculate total stock from active variants (or use body.stock if no variants)
      const activeVariants = await tx.productVariant.findMany({
        where: { productId: id, isActive: true },
        select: { stock: true },
      })
      const totalStock = activeVariants.length > 0
        ? activeVariants.reduce((s, v) => s + v.stock, 0)
        : (body.stock ?? 0)

      return tx.product.update({
        where: { id },
        data: {
          name: body.name,
          slug: body.slug,
          description: body.description,
          price: body.price,
          comparePrice: body.comparePrice ?? null,
          stock: totalStock,
          images: body.images,
          isNew: body.isNew,
          isFeatured: body.isFeatured,
          isActive: body.isActive,
          categoryId: body.categoryId,
          brandId: body.brandId,
        },
        include: { category: true, brand: true },
      })
    })

    return NextResponse.json(transformProduct(product))
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Error updating product" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Error deleting product" }, { status: 500 })
  }
}
