'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import 'leaflet-defaulticon-compatibility'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const useMap = dynamic(() => import('react-leaflet').then(mod => mod.useMap), { ssr: false })

interface Aircraft {
  name: string
  charterCost: string
  charterCostPerHour: number
  emptyWeight: string
  maxWeight: string
  passengers: string
  storage: string
  cruiseSpeed: string
  range: string
  fuelUsage: string
  operatingCost: string
  operatingCostPerHour: number
  purchasePrice: string
  purchasePriceAmount: number
  yearlyCosts: string
  yearlyCostsAmount: number
  rangeKm: number
}

interface Airport {
  id: string
  ident: string
  type: string
  name: string
  latitude_deg: number
  longitude_deg: number
  elevation_ft: number
  continent: string
  iso_country: string
  iso_region: string
  municipality: string
  scheduled_service: string
  icao_code: string
  iata_code: string
  gps_code: string
  local_code: string
  home_link: string
  wikipedia_link: string
  keywords: string
}

const aircraft: Aircraft[] = [
  {
    name: "Cessna 172N",
    charterCost: "€200-300/hour",
    charterCostPerHour: 250,
    emptyWeight: "757 kg",
    maxWeight: "1157 kg",
    passengers: "3 + 1 pilot",
    storage: "54 kg baggage",
    cruiseSpeed: "185 km/h",
    range: "1040 km",
    fuelUsage: "34 L/hour",
    operatingCost: "€100/hour",
    operatingCostPerHour: 100,
    purchasePrice: "€100,000",
    purchasePriceAmount: 100000,
    yearlyCosts: "€25,000-35,000",
    yearlyCostsAmount: 30000,
    rangeKm: 1040
  }
]

const getAircraftSlug = (name: string) => {
  return name.replace(/\s+/g, '').toUpperCase()
}

const findAircraftBySlug = (slug: string) => {
  return aircraft.find(plane => getAircraftSlug(plane.name) === slug.toUpperCase())
}

const calculateBreakevenHours = (aircraft: Aircraft) => {
  // Breakeven calculation:
  // Find where: (hours * operating_cost) + yearly_costs < (charter_cost * hours)
  // At breakeven: (hours * operating_cost) + yearly_costs = (charter_cost * hours)
  // Rearranging: yearly_costs = (charter_cost * hours) - (operating_cost * hours)
  // yearly_costs = hours * (charter_cost - operating_cost)
  // hours = yearly_costs / (charter_cost - operating_cost)
  
  const costDifferencePerHour = aircraft.charterCostPerHour - aircraft.operatingCostPerHour
  if (costDifferencePerHour <= 0) return null // Never worth buying if operating costs >= charter costs
  
  // Note: Purchase price is a one-time cost, breakeven is based on yearly operating savings
  const breakevenHours = aircraft.yearlyCostsAmount / costDifferencePerHour
  return Math.round(breakevenHours)
}

// Component to handle map bounds fitting
const MapController = dynamic(
  () => import('react-leaflet').then(({ useMap }) => 
    ({ rangeKm, centerCoords }: { rangeKm: number, centerCoords: [number, number] }) => {
      const map = useMap()
      
      useEffect(() => {
        const loadLeaflet = async () => {
          const L = await import('leaflet')
          
          if (map && rangeKm && centerCoords) {
            // Calculate the bounds of the circle with 20% padding
            const rangeInMeters = rangeKm * 1000
            const paddingFactor = 1.2 // 20% padding
            const paddedRange = rangeInMeters * paddingFactor
            
            // Convert meters to degrees (approximate)
            const metersPerDegree = 111319.9 // meters per degree at equator
            const latDelta = paddedRange / metersPerDegree
            const lngDelta = paddedRange / (metersPerDegree * Math.cos(centerCoords[0] * Math.PI / 180))
            
            const bounds = L.latLngBounds([
              [centerCoords[0] - latDelta, centerCoords[1] - lngDelta],
              [centerCoords[0] + latDelta, centerCoords[1] + lngDelta]
            ])
            
            map.fitBounds(bounds)
          }
        }
        
        loadLeaflet()
      }, [map, rangeKm, centerCoords])
      
      return null
    }
  ),
  { ssr: false }
)

export default function PlanePage() {
  const params = useParams()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [airports, setAirports] = useState<Airport[]>([])
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null)
  const [airportSearch, setAirportSearch] = useState('')
  const [filteredAirports, setFilteredAirports] = useState<Airport[]>([])
  
  useEffect(() => {
    setIsClient(true)
    // Load airports from JSON
    fetch('/airports.json')
      .then(response => response.json())
      .then((airportData: Airport[]) => {
        setAirports(airportData)
        // Set Kiel Airport as default
        const kielAirport = airportData.find(a => a.icao_code === 'EDHK' || a.name.includes('Kiel'))
        if (kielAirport) {
          setSelectedAirport(kielAirport)
        } else {
          // Fallback to first German airport or create Kiel manually
          const germanAirport = airportData.find(a => a.iso_country === 'DE')
          setSelectedAirport(germanAirport || {
            id: '1',
            ident: 'EDHK',
            type: 'medium_airport',
            name: 'Kiel Airport',
            latitude_deg: 54.3792,
            longitude_deg: 10.1450,
            elevation_ft: 102,
            continent: 'EU',
            iso_country: 'DE',
            iso_region: 'DE-SH',
            municipality: 'Kiel',
            scheduled_service: 'no',
            icao_code: 'EDHK',
            iata_code: '',
            gps_code: 'EDHK',
            local_code: '',
            home_link: '',
            wikipedia_link: '',
            keywords: ''
          })
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (airportSearch.length > 2) {
      const filtered = airports.filter(airport => 
        airport.name.toLowerCase().includes(airportSearch.toLowerCase()) ||
        airport.icao_code.toLowerCase().includes(airportSearch.toLowerCase()) ||
        airport.iata_code.toLowerCase().includes(airportSearch.toLowerCase()) ||
        airport.municipality?.toLowerCase().includes(airportSearch.toLowerCase())
      ).slice(0, 10) // Show max 10 results
      setFilteredAirports(filtered)
    } else {
      setFilteredAirports([])
    }
  }, [airportSearch, airports])

  const aircraftSlug = params.name as string
  const selectedAircraft = findAircraftBySlug(aircraftSlug)
  const homebaseCoords: [number, number] = selectedAirport ? 
    [selectedAirport.latitude_deg, selectedAirport.longitude_deg] : 
    [54.3792, 10.1450] // Kiel fallback
  
  const breakevenHours = selectedAircraft ? calculateBreakevenHours(selectedAircraft) : null

  if (!selectedAircraft) {
    return (
      <div className="max-w-4xl mx-auto p-5 font-mono text-sm">
        <button 
          onClick={() => router.push('/')}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Back to Aircraft List
        </button>
        <h1 className="text-lg mb-5">Aircraft Not Found</h1>
        <p>The aircraft you&apos;re looking for doesn&apos;t exist in our database.</p>
      </div>
    )
  }


  return (
    <div className="max-w-6xl mx-auto p-5 font-mono text-sm">
      <button 
        onClick={() => router.push('/')}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Back to Aircraft List
      </button>
      
      <h1 className="text-lg mb-5">{selectedAircraft.name}</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-bold mb-2">Homebase Airport:</label>
        <div className="relative">
          <input
            type="text"
            value={airportSearch}
            onChange={(e) => setAirportSearch(e.target.value)}
            placeholder="Search airports (ICAO, name, city)..."
            className="w-full p-2 border border-gray-300 font-mono text-sm"
          />
          {filteredAirports.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 border-t-0 max-h-60 overflow-y-auto">
              {filteredAirports.map((airport) => (
                <div
                  key={airport.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    setSelectedAirport(airport)
                    setAirportSearch('')
                    setFilteredAirports([])
                  }}
                >
                  <div className="font-bold">{airport.name}</div>
                  <div className="text-gray-600">
                    {airport.icao_code} • {airport.municipality}, {airport.iso_country}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedAirport && (
          <div className="mt-2 text-sm text-gray-600">
            Selected: {selectedAirport.name} ({selectedAirport.icao_code})
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="border border-gray-300 p-5">
            <h2 className="text-base mb-4">Specifications</h2>
            
            <div className="space-y-2">
              <div><span className="inline-block w-48 font-bold">Cost to charter:</span>{selectedAircraft.charterCost}</div>
              <div><span className="inline-block w-48 font-bold">Empty weight:</span>{selectedAircraft.emptyWeight}</div>
              <div><span className="inline-block w-48 font-bold">Max takeoff weight:</span>{selectedAircraft.maxWeight}</div>
              <div><span className="inline-block w-48 font-bold">Passengers + pilot:</span>{selectedAircraft.passengers}</div>
              <div><span className="inline-block w-48 font-bold">Total storage:</span>{selectedAircraft.storage}</div>
              <div><span className="inline-block w-48 font-bold">Cruise speed:</span>{selectedAircraft.cruiseSpeed}</div>
              <div><span className="inline-block w-48 font-bold">Range:</span>{selectedAircraft.range}</div>
              <div><span className="inline-block w-48 font-bold">Fuel consumption:</span>{selectedAircraft.fuelUsage}</div>
              <div><span className="inline-block w-48 font-bold">Hourly operating cost:</span>{selectedAircraft.operatingCost}</div>
            </div>
          </div>

          <div className="border border-gray-300 p-5">
            <h2 className="text-base mb-4">Purchase Price</h2>
            
            <div className="space-y-2">
              <div><span className="inline-block w-48 font-bold">Purchase price:</span>{selectedAircraft.purchasePrice}</div>
            </div>
          </div>

          <div className="border border-gray-300 p-5">
            <h2 className="text-base mb-4">Ownership Analysis</h2>
            
            <div className="space-y-2">
              <div><span className="inline-block w-48 font-bold">Yearly costs:</span>{selectedAircraft.yearlyCosts}</div>
              <div><span className="inline-block w-48 font-bold">Breakeven hours:</span>
                {breakevenHours ? `${breakevenHours} hours/year` : 'N/A'}
              </div>
              {breakevenHours && (
                <div className="text-sm text-gray-600 mt-2">
                  Flying {breakevenHours}+ hours per year makes ownership more cost-effective than chartering.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border border-gray-300">
          <div className="p-3 border-b border-gray-200 font-bold">
            Range from {selectedAirport?.name || 'Kiel Airport'} ({selectedAirport?.icao_code || 'EDHK'})
          </div>
          <div className="h-96">
            {isClient && selectedAirport && (
              <MapContainer
                center={homebaseCoords}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
              >
                <MapController rangeKm={selectedAircraft.rangeKm} centerCoords={homebaseCoords} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={homebaseCoords}>
                  <Popup>{selectedAirport.name} ({selectedAirport.icao_code})</Popup>
                </Marker>
                <Circle
                  center={homebaseCoords}
                  radius={selectedAircraft.rangeKm * 1000}
                  pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                />
              </MapContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}