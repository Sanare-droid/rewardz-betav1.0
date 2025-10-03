import MobileLayout from "@/components/rewardz/MobileLayout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Search, 
  Plus, 
  Trash2, 
  Bell, 
  BellOff, 
  Edit,
  MapPin,
  Calendar,
  Filter
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { SPECIES_OPTIONS } from "@/lib/options";

interface SavedSearch {
  id: string;
  name: string;
  species?: string;
  breed?: string;
  location?: string;
  radius?: number;
  type?: 'all' | 'lost' | 'found';
  notificationsEnabled: boolean;
  createdAt: any;
  updatedAt?: any;
  lastChecked?: any;
  matchCount?: number;
}

export default function SavedSearchesEnhanced() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Form state
  const [searchName, setSearchName] = useState("");
  const [searchSpecies, setSearchSpecies] = useState("all");
  const [searchBreed, setSearchBreed] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchRadius, setSearchRadius] = useState("10");
  const [searchType, setSearchType] = useState<'all' | 'lost' | 'found'>('all');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Subscribe to saved searches
    const searchesRef = collection(db, 'users', user.uid, 'savedSearches');
    const q = query(searchesRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: SavedSearch[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SavedSearch));
      
      setSearches(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  const resetForm = () => {
    setSearchName("");
    setSearchSpecies("all");
    setSearchBreed("");
    setSearchLocation("");
    setSearchRadius("10");
    setSearchType('all');
    setNotificationsEnabled(true);
    setEditingSearch(null);
  };

  const handleSaveSearch = async () => {
    if (!user || !searchName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a name for your search",
        variant: "destructive"
      });
      return;
    }

    try {
      const searchData = {
        name: searchName.trim(),
        species: searchSpecies !== 'all' ? searchSpecies : undefined,
        breed: searchBreed.trim() || undefined,
        location: searchLocation.trim() || undefined,
        radius: searchLocation.trim() ? Number(searchRadius) : undefined,
        type: searchType,
        notificationsEnabled,
        matchCount: 0
      };

      if (editingSearch) {
        // Update existing search
        await updateDoc(
          doc(db, 'users', user.uid, 'savedSearches', editingSearch.id),
          {
            ...searchData,
            updatedAt: serverTimestamp()
          }
        );
        
        toast({
          title: "Search updated",
          description: "Your saved search has been updated"
        });
      } else {
        // Create new search
        await addDoc(
          collection(db, 'users', user.uid, 'savedSearches'),
          {
            ...searchData,
            createdAt: serverTimestamp()
          }
        );
        
        toast({
          title: "Search saved",
          description: "You'll be notified when matching pets are reported"
        });
      }

      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving search:', error);
      toast({
        title: "Error",
        description: "Failed to save search",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'savedSearches', searchId));
      
      toast({
        title: "Search deleted",
        description: "Your saved search has been removed"
      });
      
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: "Error",
        description: "Failed to delete search",
        variant: "destructive"
      });
    }
  };

  const toggleNotifications = async (searchId: string, enabled: boolean) => {
    if (!user) return;

    try {
      await updateDoc(
        doc(db, 'users', user.uid, 'savedSearches', searchId),
        {
          notificationsEnabled: enabled,
          updatedAt: serverTimestamp()
        }
      );
      
      toast({
        title: enabled ? "Notifications enabled" : "Notifications disabled",
        description: enabled 
          ? "You'll be notified of matching pets"
          : "You won't receive notifications for this search"
      });
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  };

  const runSearch = (search: SavedSearch) => {
    // Build search URL parameters
    const params = new URLSearchParams();
    if (search.species) params.set('species', search.species);
    if (search.breed) params.set('breed', search.breed);
    if (search.location) params.set('location', search.location);
    if (search.radius) params.set('radius', search.radius.toString());
    if (search.type && search.type !== 'all') params.set('type', search.type);
    
    navigate(`/search?${params.toString()}`);
  };

  const editSearch = (search: SavedSearch) => {
    setEditingSearch(search);
    setSearchName(search.name);
    setSearchSpecies(search.species || 'all');
    setSearchBreed(search.breed || '');
    setSearchLocation(search.location || '');
    setSearchRadius(search.radius?.toString() || '10');
    setSearchType(search.type || 'all');
    setNotificationsEnabled(search.notificationsEnabled);
    setShowAddDialog(true);
  };

  if (loading) {
    return (
      <MobileLayout title="Saved Searches">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Saved Searches">
      <div className="space-y-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Saved Searches</CardTitle>
                <CardDescription>
                  Get notified when pets matching your criteria are reported
                </CardDescription>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => resetForm()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Search
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSearch ? 'Edit Saved Search' : 'Create Saved Search'}
                    </DialogTitle>
                    <DialogDescription>
                      Set up criteria to automatically monitor for matching pets
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="name">Search Name *</Label>
                      <Input
                        id="name"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        placeholder="e.g., Orange cats near me"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="type">Alert Type</Label>
                      <Select value={searchType} onValueChange={(v) => setSearchType(v as any)}>
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All alerts</SelectItem>
                          <SelectItem value="lost">Lost pets only</SelectItem>
                          <SelectItem value="found">Found pets only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="species">Species</Label>
                      <Select value={searchSpecies} onValueChange={setSearchSpecies}>
                        <SelectTrigger id="species">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any species</SelectItem>
                          {SPECIES_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="breed">Breed (Optional)</Label>
                      <Input
                        id="breed"
                        value={searchBreed}
                        onChange={(e) => setSearchBreed(e.target.value)}
                        placeholder="e.g., Persian, Labrador"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location (Optional)</Label>
                      <Input
                        id="location"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        placeholder="e.g., New York, Central Park"
                      />
                    </div>
                    
                    {searchLocation && (
                      <div>
                        <Label htmlFor="radius">Search Radius</Label>
                        <Select value={searchRadius} onValueChange={setSearchRadius}>
                          <SelectTrigger id="radius">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">Within 5 km</SelectItem>
                            <SelectItem value="10">Within 10 km</SelectItem>
                            <SelectItem value="25">Within 25 km</SelectItem>
                            <SelectItem value="50">Within 50 km</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notifications"
                        checked={notificationsEnabled}
                        onCheckedChange={setNotificationsEnabled}
                      />
                      <Label htmlFor="notifications">
                        Send notifications for new matches
                      </Label>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveSearch}>
                      {editingSearch ? 'Update Search' : 'Save Search'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>

        {/* Saved Searches List */}
        {searches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-2">No saved searches yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a saved search to get notified when matching pets are reported
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {searches.map(search => (
              <Card key={search.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{search.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">
                          {search.type === 'all' ? 'All alerts' : 
                           search.type === 'lost' ? 'Lost pets' : 'Found pets'}
                        </Badge>
                        {search.species && (
                          <Badge variant="secondary">{search.species}</Badge>
                        )}
                        {search.breed && (
                          <Badge variant="secondary">{search.breed}</Badge>
                        )}
                        {search.location && (
                          <Badge variant="secondary">
                            <MapPin className="h-3 w-3 mr-1" />
                            {search.location} ({search.radius}km)
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleNotifications(search.id, !search.notificationsEnabled)}
                    >
                      {search.notificationsEnabled ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created {new Date(search.createdAt?.seconds * 1000 || search.createdAt).toLocaleDateString()}
                    </span>
                    {search.matchCount !== undefined && (
                      <span>{search.matchCount} matches</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => runSearch(search)}
                    >
                      <Search className="h-4 w-4 mr-1" />
                      Run Search
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editSearch(search)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog 
                      open={deleteConfirmId === search.id}
                      onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirmId(search.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Saved Search?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{search.name}" and you won't receive
                            notifications for this search anymore.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSearch(search.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}