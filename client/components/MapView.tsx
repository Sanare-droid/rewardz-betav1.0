import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Search, Filter } from 'lucide-react';
import type { Report } from '@/shared/types';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow,
});

// Custom icons for lost and found pets
const lostIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDMyIDQwIj4KICA8cGF0aCBmaWxsPSIjZWY0NDQ0IiBkPSJNMTYgMEMxMCAwIDUgNSA1IDExYzAgOCAxMSAyOSAxMSAyOXMxMS0yMSAxMS0yOUMyNyA1IDIyIDAgMTYgMHptMCAxNWMtMiAwLTQtMi00LTRzMi00IDQtNCA0IDIgNCA0LTIgNC00IDR6Ii8+Cjwvc3ZnPg==',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
  shadowUrl: iconShadow,
  shadowSize: [41, 41],
  shadowAnchor: [12, 41]
});

const foundIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDMyIDQwIj4KICA8cGF0aCBmaWxsPSIjMTBiOTgxIiBkPSJNMTYgMEMxMCAwIDUgNSA1IDExYzAgOCAxMSAyOSAxMSAyOXMxMS0yMSAxMS0yOUMyNyA1IDIyIDAgMTYgMHptMCAxNWMtMiAwLTQtMi00LTRzMi00IDQtNCA0IDIgNCA0LTIgNC00IDR6Ii8+Cjwvc3ZnPg==',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
  shadowUrl: iconShadow,
  shadowSize: [41, 41],
  shadowAnchor: [12, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjMzE3OGY2IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiLz4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

interface MapViewProps {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
  showUserLocation?: boolean;
  onReportClick?: (report: Report) => void;
  className?: string;
  showControls?: boolean;
  showSearch?: boolean;
  filterType?: 'all' | 'lost' | 'found';
}

// Component to handle map centering
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

// Component to add locate control
function LocationControl() {
  const map = useMap();
  
  useEffect(() => {
    const locateControl = L.control({ position: 'topright' });
    
    locateControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.innerHTML = `
        <a href="#" title="Find my location" style="
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          cursor: pointer;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
          </svg>
        </a>
      `;
      
      div.onclick = (e) => {
        e.preventDefault();
        map.locate({ setView: true, maxZoom: 15 });
      };
      
      return div;
    };
    
    locateControl.addTo(map);
    
    return () => {
      locateControl.remove();
    };
  }, [map]);
  
  return null;
}

export default function MapView({
  reports,
  center = [51.505, -0.09],
  zoom = 13,
  showUserLocation = true,
  onReportClick,
  className = '',
  showControls = true,
  showSearch = false,
  filterType = 'all'
}: MapViewProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          if (!center || (center[0] === 51.505 && center[1] === -0.09)) {
            setMapCenter(loc);
          }
        },
        (error) => {
          console.error('Location error:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  }, [showUserLocation, center]);

  // Filter reports based on type and location
  const visibleReports = reports.filter(report => {
    if (filterType !== 'all' && report.type !== filterType) return false;
    
    // Use public coordinates if available, otherwise use actual coordinates
    const lat = report.pubLat ?? report.lat;
    const lon = report.pubLon ?? report.lon;
    
    return lat && lon;
  });

  // Group nearby reports for clustering
  const groupReports = (reports: Report[], threshold = 0.001) => {
    const groups: { center: [number, number]; reports: Report[] }[] = [];
    
    reports.forEach(report => {
      const lat = report.pubLat ?? report.lat;
      const lon = report.pubLon ?? report.lon;
      if (!lat || !lon) return;
      
      let added = false;
      for (const group of groups) {
        const [glat, glon] = group.center;
        if (Math.abs(glat - lat) < threshold && Math.abs(glon - lon) < threshold) {
          group.reports.push(report);
          // Update center to be average
          const totalLat = group.reports.reduce((sum, r) => sum + (r.pubLat ?? r.lat ?? 0), 0);
          const totalLon = group.reports.reduce((sum, r) => sum + (r.pubLon ?? r.lon ?? 0), 0);
          group.center = [totalLat / group.reports.length, totalLon / group.reports.length];
          added = true;
          break;
        }
      }
      
      if (!added) {
        groups.push({
          center: [lat, lon],
          reports: [report]
        });
      }
    });
    
    return groups;
  };

  const reportGroups = groupReports(visibleReports);

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full rounded-lg"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={mapCenter} zoom={mapZoom} />
        
        {showControls && <LocationControl />}
        
        {/* User location marker */}
        {userLocation && showUserLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Report markers */}
        {reportGroups.map((group, index) => {
          if (group.reports.length === 1) {
            const report = group.reports[0];
            return (
              <Marker
                key={report.id}
                position={group.center}
                icon={report.type === 'lost' ? lostIcon : foundIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedReport(report);
                    onReportClick?.(report);
                  }
                }}
              >
                <Popup>
                  <ReportPopup report={report} />
                </Popup>
              </Marker>
            );
          } else {
            // Cluster marker
            return (
              <CircleMarker
                key={`cluster-${index}`}
                center={group.center}
                radius={20}
                fillColor={group.reports.some(r => r.type === 'lost') ? '#ef4444' : '#10b981'}
                fillOpacity={0.7}
                color="white"
                weight={2}
                eventHandlers={{
                  click: () => {
                    // Zoom in on cluster
                    mapRef.current?.setView(group.center, mapRef.current.getZoom() + 2);
                  }
                }}
              >
                <Popup>
                  <div className="space-y-2">
                    <p className="font-semibold">{group.reports.length} pets in this area</p>
                    <div className="space-y-1">
                      {group.reports.slice(0, 5).map(report => (
                        <div key={report.id} className="text-sm">
                          <Badge variant={report.type === 'lost' ? 'destructive' : 'default'} className="text-xs">
                            {report.type}
                          </Badge>
                          <span className="ml-2">{report.name}</span>
                        </div>
                      ))}
                      {group.reports.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          and {group.reports.length - 5} more...
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        mapRef.current?.setView(group.center, mapRef.current.getZoom() + 2);
                      }}
                    >
                      Zoom In
                    </Button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          }
        })}
      </MapContainer>
      
      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 z-[1000] space-y-2">
          <Card className="bg-white/95 backdrop-blur">
            <CardContent className="p-2">
              <div className="flex gap-2">
                <Badge variant={filterType === 'all' ? 'default' : 'outline'}>
                  All ({reports.length})
                </Badge>
                <Badge 
                  variant={filterType === 'lost' ? 'destructive' : 'outline'}
                  className="cursor-pointer"
                >
                  Lost ({reports.filter(r => r.type === 'lost').length})
                </Badge>
                <Badge 
                  variant={filterType === 'found' ? 'default' : 'outline'}
                  className="cursor-pointer bg-green-600"
                >
                  Found ({reports.filter(r => r.type === 'found').length})
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Selected Report Card */}
      {selectedReport && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] max-w-sm mx-auto">
          <Card className="bg-white/95 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {selectedReport.photoUrl && (
                  <img
                    src={selectedReport.photoUrl}
                    alt={selectedReport.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedReport.type === 'lost' ? 'destructive' : 'default'}>
                      {selectedReport.type}
                    </Badge>
                    <h3 className="font-semibold">{selectedReport.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedReport.species} - {selectedReport.breed}
                  </p>
                  <p className="text-sm mt-1">{selectedReport.location}</p>
                  {selectedReport.rewardAmount && (
                    <p className="text-sm font-semibold text-primary mt-1">
                      Reward: ${selectedReport.rewardAmount}
                    </p>
                  )}
                  <Button size="sm" className="mt-2" asChild>
                    <Link to={`/report/${selectedReport.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ReportPopup({ report }: { report: Report }) {
  return (
    <div className="min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={report.type === 'lost' ? 'destructive' : 'default'}>
          {report.type}
        </Badge>
        <span className="font-semibold">{report.name}</span>
      </div>
      
      {report.photoUrl && (
        <img
          src={report.photoUrl}
          alt={report.name}
          className="w-full h-32 object-cover rounded mb-2"
        />
      )}
      
      <div className="space-y-1 text-sm">
        <p><strong>Species:</strong> {report.species}</p>
        <p><strong>Breed:</strong> {report.breed}</p>
        {report.color && <p><strong>Color:</strong> {report.color}</p>}
        <p><strong>Location:</strong> {report.location}</p>
        {report.rewardAmount && (
          <p className="text-primary font-semibold">
            Reward: ${report.rewardAmount}
          </p>
        )}
      </div>
      
      <Button size="sm" className="w-full mt-3" asChild>
        <Link to={`/report/${report.id}`}>View Full Report</Link>
      </Button>
    </div>
  );
}