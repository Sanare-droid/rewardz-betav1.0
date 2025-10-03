import MobileLayout from "@/components/rewardz/MobileLayout";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, MapPin, Calendar, Info } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { updateMatchStatus } from "@/lib/matching";
import { toast } from "@/components/ui/use-toast";

interface ReportData {
  id: string;
  name: string;
  species: string;
  breed: string;
  color?: string;
  location: string;
  photoUrl?: string;
  userId: string;
  createdAt: any;
  type: 'lost' | 'found';
}

export default function Match() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const lostReportId = searchParams.get('lost');
  const foundReportId = searchParams.get('found');
  const matchId = searchParams.get('matchId');
  
  const [lostReport, setLostReport] = useState<ReportData | null>(null);
  const [foundReport, setFoundReport] = useState<ReportData | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadMatchData();
  }, [lostReportId, foundReportId, matchId]);

  const loadMatchData = async () => {
    if (!lostReportId || !foundReportId) {
      // If no IDs provided, show demo data
      setLostReport({
        id: '1',
        name: 'Simba',
        species: 'Cat',
        breed: 'Persian',
        color: 'Orange',
        location: 'Argwings Kodhek Road',
        photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
        userId: 'demo',
        createdAt: new Date(),
        type: 'lost'
      });
      setFoundReport({
        id: '2',
        name: 'Unknown',
        species: 'Cat',
        breed: 'Persian Mix',
        color: 'Orange/White',
        location: 'Kilimani Area',
        photoUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400',
        userId: 'demo2',
        createdAt: new Date(),
        type: 'found'
      });
      setMatchData({
        score: 85,
        confidence: 'high',
        reasons: [
          'Same species: Cat',
          'Similar breed: Persian',
          'Found very close to lost location (< 500m)',
          'Similar colors',
          'Found within 3 days'
        ],
        status: 'pending'
      });
      setLoading(false);
      return;
    }

    try {
      // Load both reports
      const [lostDoc, foundDoc] = await Promise.all([
        getDoc(doc(db, 'reports', lostReportId)),
        getDoc(doc(db, 'reports', foundReportId))
      ]);

      if (!lostDoc.exists() || !foundDoc.exists()) {
        toast({
          title: "Reports not found",
          description: "One or both reports no longer exist",
          variant: "destructive"
        });
        navigate('/alerts');
        return;
      }

      setLostReport({ id: lostDoc.id, ...lostDoc.data() } as ReportData);
      setFoundReport({ id: foundDoc.id, ...foundDoc.data() } as ReportData);

      // Load match data if matchId provided
      if (matchId) {
        const matchDoc = await getDoc(
          doc(db, 'reports', lostReportId, 'matches', matchId)
        );
        if (matchDoc.exists()) {
          setMatchData(matchDoc.data());
        }
      }
    } catch (error) {
      console.error('Error loading match data:', error);
      toast({
        title: "Error loading match",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMatch = async () => {
    if (!user || !matchId) {
      // Demo mode
      toast({
        title: "Match accepted!",
        description: "Congratulations on the reunion! 🎉"
      });
      navigate('/confirm-reunion');
      return;
    }
    
    setProcessing(true);
    try {
      // Update match status
      const reportId = lostReport?.userId === user.uid ? lostReportId! : foundReportId!;
      await updateMatchStatus(reportId, matchId, 'accepted');
      
      // Update both reports to reunited status
      await Promise.all([
        updateDoc(doc(db, 'reports', lostReportId!), {
          status: 'reunited',
          reunitedAt: new Date()
        }),
        updateDoc(doc(db, 'reports', foundReportId!), {
          status: 'reunited',
          reunitedAt: new Date()
        })
      ]);
      
      toast({
        title: "Match accepted!",
        description: "Congratulations on the reunion! 🎉"
      });
      
      navigate('/confirm-reunion');
    } catch (error) {
      console.error('Error accepting match:', error);
      toast({
        title: "Error",
        description: "Failed to accept match",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectMatch = async () => {
    if (!user || !matchId) {
      toast({
        title: "Match rejected",
        description: "We'll keep looking for other matches"
      });
      navigate('/alerts');
      return;
    }
    
    setProcessing(true);
    try {
      const reportId = lostReport?.userId === user.uid ? lostReportId! : foundReportId!;
      await updateMatchStatus(reportId, matchId, 'rejected');
      
      toast({
        title: "Match rejected",
        description: "We'll keep looking for other matches"
      });
      
      navigate('/alerts');
    } catch (error) {
      console.error('Error rejecting match:', error);
      toast({
        title: "Error",
        description: "Failed to reject match",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Match Details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  if (!lostReport || !foundReport) {
    return (
      <MobileLayout title="Match Details">
        <div className="text-center py-8">
          <p>Match data not found</p>
          <Button asChild className="mt-4">
            <Link to="/alerts">Back to Alerts</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const isOwner = user && (lostReport.userId === user.uid || foundReport.userId === user.uid);
  const confidence = matchData?.confidence || 'medium';
  const score = matchData?.score || 0;
  const reasons = matchData?.reasons || [];

  return (
    <MobileLayout title="Potential Match Found!" back>
      <div className="space-y-4 pb-20">
        {/* Match Score Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className={`text-5xl font-bold ${
                confidence === 'high' ? 'text-green-600' :
                confidence === 'medium' ? 'text-yellow-600' :
                'text-orange-600'
              }`}>
                {score}%
              </div>
            </div>
            <CardTitle>Match Confidence: {confidence.toUpperCase()}</CardTitle>
            <CardDescription>
              We found a potential match between these two pets
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Lost Pet Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="destructive" className="mb-2">LOST</Badge>
                <CardTitle>{lostReport.name}</CardTitle>
                <CardDescription>
                  {lostReport.species} - {lostReport.breed}
                </CardDescription>
              </div>
              {lostReport.photoUrl && (
                <img
                  src={lostReport.photoUrl}
                  alt={lostReport.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {lostReport.color && (
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span>Color: {lostReport.color}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>Last seen: {lostReport.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Reported: {new Date(lostReport.createdAt?.seconds * 1000 || lostReport.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full mt-3">
              <Link to={`/report/${lostReport.id}`}>View Full Report</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Found Pet Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge className="mb-2 bg-green-600">FOUND</Badge>
                <CardTitle>{foundReport.name || 'Unknown Name'}</CardTitle>
                <CardDescription>
                  {foundReport.species} - {foundReport.breed}
                </CardDescription>
              </div>
              {foundReport.photoUrl && (
                <img
                  src={foundReport.photoUrl}
                  alt={foundReport.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {foundReport.color && (
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span>Color: {foundReport.color}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>Found at: {foundReport.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Found: {new Date(foundReport.createdAt?.seconds * 1000 || foundReport.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full mt-3">
              <Link to={`/report/${foundReport.id}`}>View Full Report</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Match Reasons */}
        {reasons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Why We Think It's a Match</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {reasons.map((reason: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">{reason}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {(!matchData?.status || matchData?.status === 'pending') && (
          <Card>
            <CardHeader>
              <CardTitle>Is This Your Pet?</CardTitle>
              <CardDescription>
                Please review the information carefully and let us know if this is a match
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={handleAcceptMatch}
                disabled={processing}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Yes, This is a Match!
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleRejectMatch}
                disabled={processing}
              >
                <XCircle className="w-4 h-4 mr-2" />
                No, Not a Match
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Contact Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Options</CardTitle>
            <CardDescription>
              Get in touch to verify this match
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link to={`/owner/${lostReport.userId}`}>
                Contact Lost Pet Owner
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to={`/owner/${foundReport.userId}`}>
                Contact Found Pet Reporter
              </Link>
            </Button>
          </CardContent>
        </Card>

        {matchData?.status && matchData.status !== 'pending' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Badge variant={matchData.status === 'accepted' ? 'default' : 'secondary'}>
                  Match {matchData.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}