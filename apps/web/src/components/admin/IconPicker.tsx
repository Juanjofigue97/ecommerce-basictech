"use client"

import { useState } from "react"
import * as Icons from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Search } from "lucide-react"

const AVAILABLE_ICONS: { name: string; label: string }[] = [
  // General / Retail
  { name: "Package", label: "Paquete" },
  { name: "ShoppingBag", label: "Bolsa" },
  { name: "Tag", label: "Etiqueta" },
  { name: "Gift", label: "Regalo" },
  { name: "Star", label: "Estrella" },
  { name: "Box", label: "Caja" },
  { name: "Gem", label: "Joya" },
  { name: "Percent", label: "Descuento" },
  // Ropa / Moda
  { name: "Shirt", label: "Ropa" },
  { name: "Watch", label: "Reloj" },
  { name: "Glasses", label: "Lentes" },
  { name: "Backpack", label: "Mochila" },
  { name: "Footprints", label: "Calzado" },
  { name: "Crown", label: "Corona" },
  // Electrónica
  { name: "Laptop", label: "Laptop" },
  { name: "Monitor", label: "Monitor" },
  { name: "Smartphone", label: "Celular" },
  { name: "Headphones", label: "Auriculares" },
  { name: "Camera", label: "Cámara" },
  { name: "Tv", label: "Televisor" },
  { name: "Cpu", label: "CPU" },
  { name: "HardDrive", label: "Disco" },
  { name: "Printer", label: "Impresora" },
  { name: "Gamepad2", label: "Videojuego" },
  // Hogar
  { name: "Home", label: "Hogar" },
  { name: "Sofa", label: "Muebles" },
  { name: "Lamp", label: "Lámpara" },
  { name: "Bath", label: "Baño" },
  { name: "Bed", label: "Cama" },
  { name: "Flower2", label: "Jardín" },
  // Deportes / Fitness
  { name: "Dumbbell", label: "Fitness" },
  { name: "Bike", label: "Ciclismo" },
  { name: "Trophy", label: "Trofeo" },
  { name: "Tent", label: "Camping" },
  { name: "Waves", label: "Natación" },
  // Alimentación
  { name: "Utensils", label: "Comida" },
  { name: "Coffee", label: "Café" },
  { name: "Pizza", label: "Pizza" },
  { name: "Apple", label: "Frutas" },
  { name: "Wine", label: "Bebidas" },
  { name: "Sandwich", label: "Snacks" },
  // Libros / Educación
  { name: "Book", label: "Libros" },
  { name: "GraduationCap", label: "Educación" },
  { name: "Pen", label: "Papelería" },
  // Música / Arte
  { name: "Music", label: "Música" },
  { name: "Film", label: "Cine" },
  { name: "Palette", label: "Arte" },
  { name: "Mic", label: "Micrófono" },
  // Salud / Belleza
  { name: "Heart", label: "Salud" },
  { name: "Scissors", label: "Belleza" },
  { name: "Sparkles", label: "Cuidado" },
  { name: "Pill", label: "Farmacia" },
  // Automotriz / Herramientas
  { name: "Car", label: "Autos" },
  { name: "Wrench", label: "Herramientas" },
  { name: "Fuel", label: "Combustible" },
  { name: "Hammer", label: "Construcción" },
  // Mascotas
  { name: "PawPrint", label: "Mascotas" },
  { name: "Fish", label: "Peces" },
  // Viajes
  { name: "Plane", label: "Viajes" },
  { name: "MapPin", label: "Destinos" },
  { name: "Luggage", label: "Equipaje" },
]

type LucideIconName = keyof typeof Icons

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = Icons[name as LucideIconName] as React.ComponentType<{ className?: string }> | undefined
  if (!Icon) return <Icons.Package className={className} />
  return <Icon className={className} />
}

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = AVAILABLE_ICONS.filter(
    (icon) =>
      icon.label.toLowerCase().includes(search.toLowerCase()) ||
      icon.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-3"
        >
          <DynamicIcon name={value} className="h-4 w-4 shrink-0" />
          <span className="text-sm">{value || "Seleccionar ícono"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ícono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="grid grid-cols-6 gap-1 max-h-56 overflow-y-auto">
          {filtered.map((icon) => (
            <button
              key={icon.name}
              type="button"
              title={icon.label}
              onClick={() => {
                onChange(icon.name)
                setOpen(false)
                setSearch("")
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md p-2 text-xs hover:bg-muted transition-colors",
                value === icon.name && "bg-primary text-primary-foreground hover:bg-primary"
              )}
            >
              <DynamicIcon name={icon.name} className="h-4 w-4" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-6 py-4 text-center text-sm text-muted-foreground">
              Sin resultados
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
