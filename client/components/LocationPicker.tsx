import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { geocode, reverseGeocode } from '@/lib/geo';
import { toast } from '@/components/ui/use-toast';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow,
});

interface LocationPickerProps {
  value?: { lat: number; lon: number; address?: string };
  onChange: (location: { lat: number; lon: number; address: string }) => void;
  placeholder?: string;
  className?: string;
}

// Map click handler component
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({
  value,
  onChange,
  placeholder = "Search for a location or click on the map",
  className = ""
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    value ? [value.lat, value.lon] : [51.505, -0.09]
  );
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lon: number;
    address: string;
  } | null>(value || null);
  const [showMap, setShowMap] = useState(false);

  // Get user's current location on mount
  useEffect(() => {
    if (!value && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const center: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setMapCenter(center);
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  }, [value]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const result = await geocode(searchQuery);
      if (result) {
        const address = await reverseGeocode(result.lat, result.lon) || searchQuery;
        const location = {
          lat: result.lat,
          lon: result.lon,
          address
        };
        
        setSelectedLocation(location);
        setMapCenter([result.lat, result.lon]);
        onChange(location);
        setShowMap(true);
        
        toast({
          title: "Location found",
          description: address
        });
      } else {
        toast({
          title: "Location not found",
          description: "Please try a different search term",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  // Handle map click
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    try {
      const address = await reverseGeocode(lat, lng) || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      const location = {
        lat,
        lon: lng,
        address
      };
      
      setSelectedLocation(location);
      setSearchQuery(address);
      onChange(location);
      
      toast({
        title: "Location selected",
        description: address
      });
    } catch (error) {
      console.error('Reverse geocode error:', error);
      const location = {
        lat,
        lon: lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      };
      
      setSelectedLocation(location);
      onChange(location);
    }
  }, [onChange]);

  // Use current location
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          const address = await reverseGeocode(lat, lng) || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          const location = {
            lat,
            lon: lng,
            address
          };
          
          setSelectedLocation(location);
          setSearchQuery(address);
          setMapCenter([lat, lng]);
          onChange(location);
          setShowMap(true);
          
          toast({
            title: "Current location selected",
            description: address
          });
        } catch (error) {
          console.error('Reverse geocode error:', error);
        }
      },
      (error) => {
        toast({
          title: "Location error",
          description: "Could not get your current location",
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className={className}>
      {/* Search Controls */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={placeholder}
              className="pl-9"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? 'Searching...' : 'Search'}
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={useCurrentLocation}
            className="flex-1"
          >
            <Navigation className="h-4 w-4 mr-1" />
            Use Current Location
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMap(!showMap)}
            className="flex-1"
          >
            <MapPin className="h-4 w-4 mr-1" />
            {showMap ? 'Hide Map' : 'Show Map'}
          </Button>
        </div>
        
        {selectedLocation && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Selected Location:</p>
                  <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Map */}
      {showMap && (
        <div className="h-64 rounded-lg overflow-hidden border">
          <MapContainer
            center={mapCenter}
            zoom={13}
            className="h-full w-full"
            key={`${mapCenter[0]}-${mapCenter[1]}`} // Force re-render on center change
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler onLocationSelect={handleMapClick} />
            
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lon]} />
            )}
          </MapContainer>
        </div>
      )}
      
      {!showMap && !selectedLocation && (
        <div className="h-32 rounded-lg border-2 border-dashed flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Click "Show Map" to select a location
            </p>
          </div>
        </div>
      )}
    </div>
  );
}