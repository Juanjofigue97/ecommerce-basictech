import { prisma } from "@/lib/prisma"
import { HeroBannerCarousel } from "./HeroBannerCarousel"

export async function HeroBanner() {
  const slides = await prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  })

  return <HeroBannerCarousel slides={slides} />
}
