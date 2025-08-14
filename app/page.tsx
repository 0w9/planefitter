'use client'

import { useRouter } from 'next/navigation'
import { ThemeToggle } from './components/ThemeToggle'

interface Aircraft {
  name: string
  charterCost: string
  emptyWeight: string
  maxWeight: string
  passengers: string
  storage: string
  cruiseSpeed: string
  range: string
  fuelUsage: string
  operatingCost: string
  rangeKm: number
}

const aircraft: Aircraft[] = [
  {
    name: "Cessna 172N",
    charterCost: "€200-300/hour",
    emptyWeight: "757 kg",
    maxWeight: "1157 kg",
    passengers: "3 + 1 pilot",
    storage: "54 kg baggage",
    cruiseSpeed: "185 km/h",
    range: "1040 km",
    fuelUsage: "34 L/hour",
    operatingCost: "€150-200/hour",
    rangeKm: 1040
  },
  {
    name: "VL3",
    charterCost: "€180-250/hour",
    emptyWeight: "315 kg",
    maxWeight: "600 kg",
    passengers: "1 + 1 pilot",
    storage: "20 kg baggage",
    cruiseSpeed: "240 km/h",
    range: "1200 km",
    fuelUsage: "18 L/hour",
    operatingCost: "€80/hour",
    rangeKm: 1200
  }
]

const getAircraftSlug = (name: string) => {
  return name.replace(/\s+/g, '').toUpperCase()
}

export default function Home() {
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto p-5 font-mono text-sm">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-lg">Aircraft Database</h1>
        <ThemeToggle />
      </div>
      
      <div className="border border-gray-300 dark:border-gray-600 mb-5">
        {aircraft.map((plane, index) => (
          <div
            key={index}
            className="p-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => router.push(`/planes/${getAircraftSlug(plane.name)}`)}
          >
            {plane.name}
          </div>
        ))}
      </div>
    </div>
  )
}
