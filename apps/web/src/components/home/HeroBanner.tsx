import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { HeroBannerCarousel } from "./HeroBannerCarousel"

const getSlides = unstable_cache(
  async () => {
    try {
      return await prisma.heroSlide.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      })
    } catch {
      return []
    }
  },
  ["hero-slides"],
  { revalidate: 300, tags: ["hero-slides"] }
)

export async function HeroBanner() {
  const slides = await getSlides()
  return <HeroBannerCarousel slides={slides} />
}
