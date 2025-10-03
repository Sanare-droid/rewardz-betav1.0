import MobileLayout from "@/components/rewardz/MobileLayout";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { toPng, toJpeg } from "html-to-image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Download, 
  Share2, 
  Printer, 
  Eye,
  MapPin,
  Phone,
  DollarSign,
  Calendar,
  Info
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { Report } from "@/shared/types";

export default function PosterEnhanced() {
  const { id } = useParams();
  const posterRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [posterStyle, setPosterStyle] = useState<'classic' | 'modern' | 'simple'>('modern');
  const [includeQR, setIncludeQR] = useState(true);
  const [customMessage, setCustomMessage] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (id) {
      loadReport();
    } else {
      // Demo data if no ID
      setReport({
        id: 'demo',
        type: 'lost',
        name: 'Max',
        species: 'Dog',
        breed: 'Golden Retriever',
        color: 'Golden',
        location: 'Central Park, New York',
        photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600',
        rewardAmount: 500,
        createdAt: new Date(),
        userId: 'demo',
        status: 'open',
        keywords: []
      } as Report);
      setLoading(false);
    }
  }, [id]);

  const loadReport = async () => {
    if (!id) return;

    try {
      const reportDoc = await getDoc(doc(db, 'reports', id));
      
      if (reportDoc.exists()) {
        setReport({ id: reportDoc.id, ...reportDoc.data() } as Report);
      } else {
        toast({
          title: "Report not found",
          description: "This report may have been deleted",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        title: "Error loading report",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPoster = async (format: 'png' | 'jpg' = 'png') => {
    if (!posterRef.current) return;

    try {
      const dataUrl = format === 'png' 
        ? await toPng(posterRef.current, { quality: 1, pixelRatio: 2 })
        : await toJpeg(posterRef.current, { quality: 0.95, pixelRatio: 2 });
      
      const link = document.createElement('a');
      link.download = `${report?.type}-${report?.name}-poster.${format}`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Poster downloaded",
        description: "The poster has been saved to your device"
      });
    } catch (error) {
      console.error('Error downloading poster:', error);
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const sharePoster = async () => {
    const url = `${window.location.origin}/report/${report?.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${report?.type === 'lost' ? 'Lost' : 'Found'} ${report?.species}: ${report?.name}`,
          text: `Help find ${report?.name}! ${report?.rewardAmount ? `$${report?.rewardAmount} reward offered.` : ''}`,
          url
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Share this link to spread the word"
      });
    }
  };

  const printPoster = () => {
    window.print();
  };

  if (loading) {
    return (
      <MobileLayout title="Create Poster">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  if (!report) {
    return (
      <MobileLayout title="Create Poster">
        <div className="text-center py-8">
          <p>Report not found</p>
        </div>
      </MobileLayout>
    );
  }

  const posterUrl = `${window.location.origin}/report/${report.id}`;

  return (
    <MobileLayout title="Create Poster">
      <div className="space-y-4 pb-20">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Poster Settings</CardTitle>
            <CardDescription>
              Customize and download a poster to help spread the word
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="style">Poster Style</Label>
              <Select value={posterStyle} onValueChange={(v) => setPosterStyle(v as any)}>
                <SelectTrigger id="style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="simple">Simple</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="phone">Contact Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Your phone number"
              />
            </div>
            
            <div>
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add any additional information..."
                rows={2}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="qr"
                checked={includeQR}
                onChange={(e) => setIncludeQR(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="qr" className="cursor-pointer">
                Include QR code for easy scanning
              </Label>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                {showPreview ? 'Hide' : 'Preview'}
              </Button>
              <Button onClick={printPoster} variant="outline">
                <Printer className="h-4 w-4" />
              </Button>
              <Button onClick={sharePoster} variant="outline">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => downloadPoster('png')} className="flex-1">
                <Download className="h-4 w-4 mr-1" />
                Download PNG
              </Button>
              <Button onClick={() => downloadPoster('jpg')} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-1" />
                Download JPG
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Poster Preview */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Poster Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div ref={posterRef} className={`bg-white p-8 ${getPosterStyles(posterStyle)}`}>
                  <PosterContent
                    report={report}
                    style={posterStyle}
                    includeQR={includeQR}
                    contactPhone={contactPhone}
                    customMessage={customMessage}
                    posterUrl={posterUrl}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hidden print version */}
      <div className="hidden print:block">
        <div ref={posterRef} className="bg-white p-8">
          <PosterContent
            report={report}
            style={posterStyle}
            includeQR={includeQR}
            contactPhone={contactPhone}
            customMessage={customMessage}
            posterUrl={posterUrl}
          />
        </div>
      </div>
    </MobileLayout>
  );
}

function PosterContent({ 
  report, 
  style, 
  includeQR, 
  contactPhone,
  customMessage,
  posterUrl 
}: {
  report: Report;
  style: 'classic' | 'modern' | 'simple';
  includeQR: boolean;
  contactPhone: string;
  customMessage: string;
  posterUrl: string;
}) {
  const isLost = report.type === 'lost';
  
  if (style === 'modern') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className={`text-5xl font-black uppercase tracking-wider ${
            isLost ? 'text-red-600' : 'text-green-600'
          }`}>
            {isLost ? 'MISSING' : 'FOUND'}
          </div>
          {report.rewardAmount && isLost && (
            <div className="text-3xl font-bold text-yellow-600 mt-2">
              ${report.rewardAmount} REWARD
            </div>
          )}
        </div>
        
        {/* Photo */}
        {report.photoUrl && (
          <div className="relative">
            <img
              src={report.photoUrl}
              alt={report.name}
              className="w-full h-96 object-cover rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 rounded-b-lg">
              <h2 className="text-4xl font-bold text-white">{report.name}</h2>
              <p className="text-xl text-white/90">
                {report.species} • {report.breed}
              </p>
            </div>
          </div>
        )}
        
        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-gray-600">Color/Markings</p>
            <p className="text-lg">{report.color || 'Not specified'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">
              {isLost ? 'Last Seen' : 'Found At'}
            </p>
            <p className="text-lg">{report.location}</p>
          </div>
        </div>
        
        {customMessage && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-700">{customMessage}</p>
          </div>
        )}
        
        {/* Contact & QR */}
        <div className="border-t pt-6">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <p className="text-2xl font-bold mb-2">
                {isLost ? 'If Found, Please Contact:' : 'Is This Your Pet?'}
              </p>
              {contactPhone && (
                <p className="text-xl flex items-center gap-2 mb-2">
                  <Phone className="h-5 w-5" />
                  {contactPhone}
                </p>
              )}
              <p className="text-sm text-gray-600">
                Scan QR code or visit:
              </p>
              <p className="text-sm font-mono text-blue-600 break-all">
                {posterUrl}
              </p>
            </div>
            
            {includeQR && (
              <div className="bg-white p-2 border-2 border-black rounded">
                <QRCodeSVG value={posterUrl} size={120} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  if (style === 'simple') {
    return (
      <div className="text-center space-y-4">
        <h1 className={`text-6xl font-bold ${isLost ? 'text-red-600' : 'text-green-600'}`}>
          {isLost ? 'LOST PET' : 'FOUND PET'}
        </h1>
        
        {report.photoUrl && (
          <img
            src={report.photoUrl}
            alt={report.name}
            className="w-64 h-64 object-cover mx-auto rounded"
          />
        )}
        
        <div className="text-2xl">
          <p className="font-bold">{report.name}</p>
          <p>{report.species} - {report.breed}</p>
          <p className="text-xl mt-2">{report.location}</p>
        </div>
        
        {report.rewardAmount && isLost && (
          <p className="text-3xl font-bold text-yellow-600">
            REWARD: ${report.rewardAmount}
          </p>
        )}
        
        {includeQR && (
          <div className="flex justify-center">
            <QRCodeSVG value={posterUrl} size={100} />
          </div>
        )}
        
        {contactPhone && (
          <p className="text-xl font-bold">Call: {contactPhone}</p>
        )}
      </div>
    );
  }
  
  // Classic style
  return (
    <div className="border-8 border-double border-black p-6 space-y-4">
      <div className="text-center border-b-4 border-black pb-4">
        <h1 className="text-5xl font-serif font-bold">
          {isLost ? '★ LOST PET ★' : '★ FOUND PET ★'}
        </h1>
        {report.rewardAmount && isLost && (
          <p className="text-2xl mt-2">REWARD OFFERED</p>
        )}
      </div>
      
      {report.photoUrl && (
        <img
          src={report.photoUrl}
          alt={report.name}
          className="w-full h-64 object-cover border-4 border-black"
        />
      )}
      
      <div className="space-y-2 text-lg">
        <p><strong>NAME:</strong> {report.name}</p>
        <p><strong>TYPE:</strong> {report.species} - {report.breed}</p>
        <p><strong>COLOR:</strong> {report.color || 'See photo'}</p>
        <p><strong>{isLost ? 'LAST SEEN' : 'FOUND'}:</strong> {report.location}</p>
      </div>
      
      {customMessage && (
        <p className="italic">{customMessage}</p>
      )}
      
      <div className="border-t-4 border-black pt-4 text-center">
        <p className="text-xl font-bold mb-2">
          {isLost ? 'IF FOUND, PLEASE CONTACT' : 'TO CLAIM, PLEASE CONTACT'}
        </p>
        {contactPhone && <p className="text-2xl">{contactPhone}</p>}
        
        {includeQR && (
          <div className="mt-4 flex justify-center">
            <QRCodeSVG value={posterUrl} size={80} />
          </div>
        )}
      </div>
    </div>
  );
}

function getPosterStyles(style: string): string {
  switch (style) {
    case 'modern':
      return 'font-sans';
    case 'simple':
      return 'font-sans';
    case 'classic':
      return 'font-serif bg-yellow-50';
    default:
      return '';
  }
}