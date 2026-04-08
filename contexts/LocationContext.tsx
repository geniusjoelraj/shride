import { Location } from '@/types'
import React, { createContext, useContext, useState } from 'react'

interface LocationContextType {
    source: Location | null
    destination: Location | null
    setSource: (location: Location | null) => void
    setDestination: (location: Location | null) => void
    clearLocations: () => void
}

const LocationContext = createContext<LocationContextType>({
    source: null,
    destination: null,
    setSource: () => { },
    setDestination: () => { },
    clearLocations: () => { },
})

export const useLocation = () => useContext(LocationContext)

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
    const [source, setSource] = useState<Location | null>(null)
    const [destination, setDestination] = useState<Location | null>(null)

    const clearLocations = () => {
        setSource(null)
        setDestination(null)
    }

    return (
        <LocationContext.Provider
            value={{
                source,
                destination,
                setSource,
                setDestination,
                clearLocations,
            }}
        >
            {children}
        </LocationContext.Provider>
    )
}
