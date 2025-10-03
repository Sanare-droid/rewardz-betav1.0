import MobileLayout from "@/components/rewardz/MobileLayout";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Trash2, Save, X, Upload, MapPin } from "lucide-react";
import { geocode, obfuscateCoordinates } from "@/lib/geo";
import { SPECIES_OPTIONS, breedsFor } from "@/lib/options";

interface ReportData {
  id: string;
  type: 'lost' | 'found';
  status: 'open' | 'closed' | 'reunited';
  name: string;
  species: string;
  breed: string;
  color?: string;
  markings?: string;
  microchipId?: string;
  lastSeen?: string;
  dateFound?: string;
  location: string;
  lat?: number;
  lon?: number;
  rewardAmount?: number;
  photoUrl?: string;
  userId: string;
  createdAt: any;
  updatedAt?: any;
}

export default function EditReportEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [color, setColor] = useState("");
  const [markings, setMarkings] = useState("");
  const [microchipId, setMicrochipId] = useState("");
  const [lastSeen, setLastSeen] = useState("");
  const [location, setLocation] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [status, setStatus] = useState<'open' | 'closed' | 'reunited'>('open');
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id || !user) {
      navigate('/alerts');
      return;
    }
    
    loadReport();
  }, [id, user]);
  
  const loadReport = async () => {
    if (!id) return;
    
    try {
      const reportDoc = await getDoc(doc(db, 'reports', id));
      
      if (!reportDoc.exists()) {
        toast({
          title: "Report not found",
          description: "This report may have been deleted",
          variant: "destructive"
        });
        navigate('/alerts');
        return;
      }
      
      const data = reportDoc.data() as ReportData;
      
      // Check ownership
      if (data.userId !== user?.uid) {
        toast({
          title: "Access denied",
          description: "You can only edit your own reports",
          variant: "destructive"
        });
        navigate(`/report/${id}`);
        return;
      }
      
      setReport({ id: reportDoc.id, ...data });
      
      // Populate form fields
      setName(data.name || "");
      setSpecies(data.species || "");
      setBreed(data.breed || "");
      setColor(data.color || "");
      setMarkings(data.markings || "");
      setMicrochipId(data.microchipId || "");
      setLastSeen(data.lastSeen || data.dateFound || "");
      setLocation(data.location || "");
      setRewardAmount(data.rewardAmount?.toString() || "");
      setStatus(data.status || 'open');
      setPhotoPreview(data.photoUrl || null);
      
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        title: "Error loading report",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setNewPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };
  
  const handleSave = async () => {
    if (!report || !user || !id) return;
    
    // Validation
    if (!name.trim() || !species || !location.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    
    try {
      let photoUrl = report.photoUrl;
      
      // Upload new photo if provided
      if (newPhoto) {
        const photoRef = ref(storage, `reports/${id}/${Date.now()}_${newPhoto.name}`);
        const uploadResult = await uploadBytes(photoRef, newPhoto);
        photoUrl = await getDownloadURL(uploadResult.ref);
        
        // Delete old photo if it exists
        if (report.photoUrl) {
          try {
            const oldPhotoRef = ref(storage, report.photoUrl);
            await deleteObject(oldPhotoRef);
          } catch (error) {
            console.log('Could not delete old photo:', error);
          }
        }
      }
      
      // Geocode location if changed
      let coords = { lat: report.lat, lon: report.lon };
      if (location !== report.location) {
        const geocodeResult = await geocode(location);
        if (geocodeResult) {
          coords = geocodeResult;
        }
      }
      
      // Prepare update data
      const updateData = {
        name: name.trim(),
        species,
        breed: breed.trim(),
        color: color.trim(),
        markings: markings.trim(),
        microchipId: microchipId.trim(),
        lastSeen: report.type === 'lost' ? lastSeen.trim() : undefined,
        dateFound: report.type === 'found' ? lastSeen.trim() : undefined,
        location: location.trim(),
        lat: coords.lat,
        lon: coords.lon,
        pubLat: coords.lat ? obfuscateCoordinates(coords.lat, coords.lon).lat : null,
        pubLon: coords.lon ? obfuscateCoordinates(coords.lat!, coords.lon!).lon : null,
        rewardAmount: rewardAmount ? parseFloat(rewardAmount) : null,
        photoUrl,
        status,
        updatedAt: serverTimestamp()
      };
      
      // Update report
      await updateDoc(doc(db, 'reports', id), updateData);
      
      toast({
        title: "Report updated",
        description: "Your changes have been saved"
      });
      
      navigate(`/report/${id}`);
      
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Error saving changes",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!report || !user || !id) return;
    
    setDeleting(true);
    
    try {
      // Delete photo from storage if exists
      if (report.photoUrl) {
        try {
          const photoRef = ref(storage, report.photoUrl);
          await deleteObject(photoRef);
        } catch (error) {
          console.log('Could not delete photo:', error);
        }
      }
      
      // Delete report document
      await deleteDoc(doc(db, 'reports', id));
      
      toast({
        title: "Report deleted",
        description: "Your report has been permanently deleted"
      });
      
      navigate('/alerts');
      
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Error deleting report",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };
  
  if (loading) {
    return (
      <MobileLayout title="Edit Report">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }
  
  if (!report) {
    return (
      <MobileLayout title="Edit Report">
        <div className="text-center py-8">
          <p>Report not found</p>
          <Button className="mt-4" onClick={() => navigate('/alerts')}>
            Back to Alerts
          </Button>
        </div>
      </MobileLayout>
    );
  }
  
  return (
    <MobileLayout title="Edit Report" back>
      <div className="space-y-4 pb-20">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Report Status</CardTitle>
            <CardDescription>
              Current status: <Badge variant={status === 'open' ? 'default' : status === 'reunited' ? 'success' : 'secondary'}>
                {status}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open - Still searching</SelectItem>
                <SelectItem value="closed">Closed - No longer searching</SelectItem>
                <SelectItem value="reunited">Reunited - Pet found!</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        {/* Pet Information */}
        <Card>
          <CardHeader>
            <CardTitle>Pet Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Pet Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter pet name"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="species">Species *</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger id="species">
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIES_OPTIONS.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="Enter breed"
                  list="breeds"
                />
                <datalist id="breeds">
                  {breedsFor(species).map(b => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>
            
            <div>
              <Label htmlFor="color">Color/Pattern</Label>
              <Input
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g., Orange tabby, Black and white"
              />
            </div>
            
            <div>
              <Label htmlFor="markings">Distinguishing Features</Label>
              <Textarea
                id="markings"
                value={markings}
                onChange={(e) => setMarkings(e.target.value)}
                placeholder="Any unique markings or features"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="microchip">Microchip ID</Label>
              <Input
                id="microchip"
                value={microchipId}
                onChange={(e) => setMicrochipId(e.target.value)}
                placeholder="If microchipped"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle>Location Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="location">
                <MapPin className="w-4 h-4 inline mr-1" />
                {report.type === 'lost' ? 'Last Seen Location' : 'Found Location'} *
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter address or area"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="date">
                {report.type === 'lost' ? 'Date/Time Last Seen' : 'Date/Time Found'}
              </Label>
              <Input
                id="date"
                type="datetime-local"
                value={lastSeen}
                onChange={(e) => setLastSeen(e.target.value)}
              />
            </div>
            
            {report.type === 'lost' && (
              <div>
                <Label htmlFor="reward">Reward Amount ($)</Label>
                <Input
                  id="reward"
                  type="number"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  placeholder="Optional reward amount"
                  min="0"
                  step="10"
                />
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Photo */}
        <Card>
          <CardHeader>
            <CardTitle>Photo</CardTitle>
            <CardDescription>
              Update the pet's photo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {photoPreview && (
              <div className="mb-4">
                <img
                  src={photoPreview}
                  alt="Pet"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            
            <Label htmlFor="photo" className="cursor-pointer">
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {newPhoto ? newPhoto.name : 'Click to upload new photo'}
                </p>
              </div>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </Label>
          </CardContent>
        </Card>
        
        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/report/${id}`)}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Report
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your report
                  and all associated data including messages and matches.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground"
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </MobileLayout>
  );
}