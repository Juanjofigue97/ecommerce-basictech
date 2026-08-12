import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { transformProduct } from "@/lib/transformers"
import { requireAdmin } from "@/lib/api-auth"
import { auth } from "@/lib/auth"

type Params = Promise<{ id: string }>

// Wholesale pricing is a decision reserved to Administrador sessions.
// Non-admins get their wholesalePrice input silently dropped (defense in
// depth — the field isn't even shown in their admin UI), never a 400.
function resolveWholesalePrice(raw: unknown): { value?: number | null; error?: string } {
  if (raw === undefined) return {}
  if (raw === null) return { value: null }
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) {
    return { error: "El precio mayorista debe ser un número positivo" }
  }
  return { value: raw }
}

// Cost is a decision reserved to Administrador sessions, same as
// wholesalePrice — it reveals margin. Non-admins get their cost input
// silently dropped, never a 400.
function resolveCost(raw: unknown): { value?: number | null; error?: string } {
  if (raw === undefined) return {}
  if (raw === null) return { value: null }
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) {
    return { error: "El costo debe ser un número positivo" }
  }
  return { value: raw }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Soft check: this endpoint stays publicly accessible, but only an
    // Administrador session gets wholesalePrice/cost in the payload.
    const session = await auth()
    const includeWholesalePrice = session?.user?.roleName === "Administrador"
    const includeCost = session?.user?.roleName === "Administrador"

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

    const totalStock = product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + v.stock, 0)
      : product.stock

    return NextResponse.json({
      ...base,
      stock: totalStock,
      categoryId: product.categoryId,
      brandId: product.brandId,
      comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
      wholesalePrice: includeWholesalePrice
        ? (product.wholesalePrice != null ? Number(product.wholesalePrice) : undefined)
        : undefined,
      cost: includeCost
        ? (product.cost != null ? Number(product.cost) : undefined)
        : undefined,
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
  const { session, response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const isAdministrador = session?.user?.roleName === "Administrador"

    let wholesalePriceData: { wholesalePrice?: number | null } = {}
    if (isAdministrador) {
      const resolved = resolveWholesalePrice(body.wholesalePrice)
      if (resolved.error) {
        return NextResponse.json({ error: resolved.error }, { status: 400 })
      }
      // PUT is a full-object replace (the edit form always resends every
      // field it loaded) — mirror comparePrice's existing convention below
      // and collapse "omitted" into an explicit clear, same as that field.
      wholesalePriceData = { wholesalePrice: resolved.value ?? null }
    }

    let costData: { cost?: number | null } = {}
    if (isAdministrador) {
      const resolved = resolveCost(body.cost)
      if (resolved.error) {
        return NextResponse.json({ error: resolved.error }, { status: 400 })
      }
      costData = { cost: resolved.value ?? null }
    }

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
          ...wholesalePriceData,
          ...costData,
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
  const { response: authError } = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Error deleting product" }, { status: 500 })
  }
}
