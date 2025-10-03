import MobileLayout from "@/components/rewardz/MobileLayout";
import MapView from "@/components/MapView";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MapPin, List, Map } from "lucide-react";
import type { Report } from "@/shared/types";
import AlertListItem from "@/components/rewardz/AlertListItem";
import { useNavigate } from "react-router-dom";

export default function AlertsMapEnhanced() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [radiusKm, setRadiusKm] = useState(10);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setUserLocation(loc);
          setMapCenter(loc);
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }

    // Subscribe to reports
    const baseQuery = filterType === 'all' 
      ? query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'reports'),
          where('type', '==', filterType),
          orderBy('createdAt', 'desc')
        );

    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      const data: Report[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Report));
      
      setReports(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterType]);

  // Filter reports based on search and filters
  const filteredReports = reports.filter(report => {
    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        report.name?.toLowerCase().includes(query) ||
        report.species?.toLowerCase().includes(query) ||
        report.breed?.toLowerCase().includes(query) ||
        report.location?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    // Species filter
    if (speciesFilter !== 'all' && report.species !== speciesFilter) {
      return false;
    }

    // Distance filter (if user location available)
    if (userLocation && radiusKm < 50) {
      const lat = report.pubLat ?? report.lat;
      const lon = report.pubLon ?? report.lon;
      
      if (lat && lon) {
        const distance = calculateDistance(
          userLocation[0],
          userLocation[1],
          lat,
          lon
        );
        
        if (distance > radiusKm) return false;
      }
    }

    return true;
  });

  // Calculate distance between two points
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Get unique species for filter
  const uniqueSpecies = Array.from(new Set(reports.map(r => r.species).filter(Boolean)));

  if (loading) {
    return (
      <MobileLayout title="Alerts Map">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Alerts Map">
      <div className="h-[calc(100vh-4rem)]">
        {/* Header Controls */}
        <Card className="mb-4">
          <CardContent className="p-3">
            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, species, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All species</SelectItem>
                  {uniqueSpecies.map(species => (
                    <SelectItem key={species} value={species}>
                      {species}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={radiusKm.toString()} onValueChange={(v) => setRadiusKm(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Within 5 km</SelectItem>
                  <SelectItem value="10">Within 10 km</SelectItem>
                  <SelectItem value="25">Within 25 km</SelectItem>
                  <SelectItem value="50">Within 50 km</SelectItem>
                  <SelectItem value="100">All distances</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setViewMode('map')}
              >
                <Map className="h-4 w-4 mr-1" />
                Map View
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-1" />
                List View
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-2 mt-3">
              <Badge variant="outline">
                Total: {filteredReports.length}
              </Badge>
              <Badge variant="destructive">
                Lost: {filteredReports.filter(r => r.type === 'lost').length}
              </Badge>
              <Badge className="bg-green-600">
                Found: {filteredReports.filter(r => r.type === 'found').length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="h-[calc(100%-12rem)]">
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Alerts</TabsTrigger>
              <TabsTrigger value="lost">Lost Pets</TabsTrigger>
              <TabsTrigger value="found">Found Pets</TabsTrigger>
            </TabsList>

            <TabsContent value={filterType} className="h-[calc(100%-3rem)] mt-4">
              {viewMode === 'map' ? (
                <MapView
                  reports={filteredReports}
                  center={mapCenter}
                  zoom={12}
                  showUserLocation={true}
                  onReportClick={(report) => navigate(`/report/${report.id}`)}
                  className="h-full rounded-lg"
                  showControls={true}
                  filterType={filterType}
                />
              ) : (
                <div className="space-y-3 overflow-y-auto h-full pb-4">
                  {filteredReports.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                          No alerts found in this area
                        </p>
                        <Button 
                          className="mt-4" 
                          onClick={() => {
                            setSearchQuery('');
                            setSpeciesFilter('all');
                            setRadiusKm(50);
                          }}
                        >
                          Clear Filters
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredReports.map(report => (
                      <div key={report.id} onClick={() => navigate(`/report/${report.id}`)}>
                        <AlertListItem
                          type={report.type}
                          name={report.name}
                          species={report.species}
                          breed={report.breed}
                          location={report.location}
                          reward={report.rewardAmount}
                          image={report.photoUrl}
                          distance={
                            userLocation && report.lat && report.lon
                              ? calculateDistance(
                                  userLocation[0],
                                  userLocation[1],
                                  report.pubLat ?? report.lat,
                                  report.pubLon ?? report.lon
                                )
                              : undefined
                          }
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
}