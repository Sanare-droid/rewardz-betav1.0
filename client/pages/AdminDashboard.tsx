import MobileLayout from "@/components/rewardz/MobileLayout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  limit,
  where,
  getDoc,
  Timestamp
} from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Shield,
  Search,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  Activity,
  DollarSign,
  MapPin
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Admin check - in production, use custom claims or server-side verification
const ADMIN_EMAILS = ['admin@rewardz.app', 'mzangasanare@gmail.com'];

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalReports: number;
  activeReports: number;
  reunitedPets: number;
  totalRewards: number;
  flaggedContent: number;
  pendingVerification: number;
}

interface Report {
  id: string;
  type: 'lost' | 'found';
  status: string;
  name: string;
  species: string;
  location: string;
  userId: string;
  userEmail?: string;
  createdAt: any;
  photoUrl?: string;
  verified?: boolean;
  flagged?: boolean;
  flagReason?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: any;
  status: 'active' | 'suspended' | 'banned';
  reportCount?: number;
  reunitedCount?: number;
}

export default function AdminDashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalReports: 0,
    activeReports: 0,
    reunitedPets: 0,
    totalRewards: 0,
    flaggedContent: 0,
    pendingVerification: 0
  });
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [flaggedReports, setFlaggedReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'flagged'>('all');
  
  // Analytics data
  const [analyticsData, setAnalyticsData] = useState({
    dailyReports: [] as any[],
    speciesDistribution: [] as any[],
    successRate: [] as any[],
    revenueData: [] as any[]
  });

  useEffect(() => {
    // Check admin access
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userData: User[] = [];
      let activeUserCount = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        const data = userDoc.data();
        const userReports = await getDocs(
          query(collection(db, 'reports'), where('userId', '==', userDoc.id))
        );
        const reunitedReports = userReports.docs.filter(
          doc => doc.data().status === 'reunited'
        ).length;
        
        // Check if user is active (logged in within 30 days)
        const lastActive = data.updatedAt || data.createdAt;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (lastActive?.toDate?.() > thirtyDaysAgo) {
          activeUserCount++;
        }
        
        userData.push({
          id: userDoc.id,
          name: data.name || 'Unknown',
          email: data.email || '',
          createdAt: data.createdAt,
          status: data.status || 'active',
          reportCount: userReports.size,
          reunitedCount: reunitedReports
        });
      }
      setUsers(userData);
      
      // Load reports
      const reportsSnapshot = await getDocs(
        query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100))
      );
      const reportData: Report[] = [];
      let activeReportCount = 0;
      let reunitedCount = 0;
      let totalRewardAmount = 0;
      let flaggedCount = 0;
      let pendingCount = 0;
      
      for (const reportDoc of reportsSnapshot.docs) {
        const data = reportDoc.data();
        
        // Get user email
        let userEmail = '';
        if (data.userId) {
          const userDoc = await getDoc(doc(db, 'users', data.userId));
          if (userDoc.exists()) {
            userEmail = userDoc.data().email || '';
          }
        }
        
        const report: Report = {
          id: reportDoc.id,
          type: data.type,
          status: data.status,
          name: data.name,
          species: data.species,
          location: data.location,
          userId: data.userId,
          userEmail,
          createdAt: data.createdAt,
          photoUrl: data.photoUrl,
          verified: data.verified,
          flagged: data.flagged,
          flagReason: data.flagReason
        };
        
        reportData.push(report);
        
        if (data.status === 'open') activeReportCount++;
        if (data.status === 'reunited') reunitedCount++;
        if (data.rewardAmount) totalRewardAmount += data.rewardAmount;
        if (data.flagged) flaggedCount++;
        if (!data.verified) pendingCount++;
      }
      
      setReports(reportData);
      setFlaggedReports(reportData.filter(r => r.flagged));
      
      // Set stats
      setStats({
        totalUsers: usersSnapshot.size,
        activeUsers: activeUserCount,
        totalReports: reportsSnapshot.size,
        activeReports: activeReportCount,
        reunitedPets: reunitedCount,
        totalRewards: totalRewardAmount,
        flaggedContent: flaggedCount,
        pendingVerification: pendingCount
      });
      
      // Generate analytics data
      generateAnalyticsData(reportData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error loading data",
        description: "Please refresh the page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAnalyticsData = (reports: Report[]) => {
    // Daily reports (last 7 days)
    const dailyData: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toLocaleDateString();
      dailyData[dateStr] = 0;
    }
    
    reports.forEach(report => {
      const date = report.createdAt?.toDate?.() || new Date(report.createdAt);
      const dateStr = date.toLocaleDateString();
      if (dailyData[dateStr] !== undefined) {
        dailyData[dateStr]++;
      }
    });
    
    const dailyReports = Object.entries(dailyData).map(([date, count]) => ({
      date: date.split('/')[1], // Just day
      count
    }));
    
    // Species distribution
    const speciesCount: Record<string, number> = {};
    reports.forEach(report => {
      speciesCount[report.species] = (speciesCount[report.species] || 0) + 1;
    });
    
    const speciesDistribution = Object.entries(speciesCount).map(([species, count]) => ({
      species,
      count
    }));
    
    // Success rate by month
    const successData: Record<string, { total: number; reunited: number }> = {};
    reports.forEach(report => {
      const date = report.createdAt?.toDate?.() || new Date(report.createdAt);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
      
      if (!successData[monthStr]) {
        successData[monthStr] = { total: 0, reunited: 0 };
      }
      
      successData[monthStr].total++;
      if (report.status === 'reunited') {
        successData[monthStr].reunited++;
      }
    });
    
    const successRate = Object.entries(successData).map(([month, data]) => ({
      month,
      rate: data.total > 0 ? Math.round((data.reunited / data.total) * 100) : 0
    }));
    
    setAnalyticsData({
      dailyReports,
      speciesDistribution,
      successRate,
      revenueData: [] // Would need payment data
    });
  };

  const handleVerifyReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        verified: true,
        verifiedAt: Timestamp.now(),
        verifiedBy: user?.uid
      });
      
      toast({
        title: "Report verified",
        description: "The report has been marked as verified"
      });
      
      loadDashboardData();
    } catch (error) {
      console.error('Error verifying report:', error);
      toast({
        title: "Error",
        description: "Failed to verify report",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      
      toast({
        title: "Report deleted",
        description: "The report has been permanently deleted"
      });
      
      setDeleteConfirm(null);
      loadDashboardData();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive"
      });
    }
  };

  const handleSuspendUser = async (userId: string, status: 'active' | 'suspended' | 'banned') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status,
        statusUpdatedAt: Timestamp.now(),
        statusUpdatedBy: user?.uid
      });
      
      toast({
        title: `User ${status}`,
        description: `User account has been ${status}`
      });
      
      loadDashboardData();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const exportData = () => {
    const csvData = reports.map(r => ({
      Type: r.type,
      Status: r.status,
      Name: r.name,
      Species: r.species,
      Location: r.location,
      Date: r.createdAt?.toDate?.().toLocaleDateString() || '',
      Verified: r.verified ? 'Yes' : 'No'
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rewardz-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <MobileLayout title="Admin Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Admin Dashboard">
      <div className="space-y-6 pb-20">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Dashboard
                </CardTitle>
                <CardDescription>
                  Manage users, reports, and platform settings
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={loadDashboardData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={exportData}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                  <p className="text-xs text-green-600">
                    {stats.activeUsers} active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <FileText className="h-8 w-8 text-purple-500" />
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.totalReports}</p>
                  <p className="text-xs text-muted-foreground">Reports</p>
                  <p className="text-xs text-green-600">
                    {stats.activeReports} active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.reunitedPets}</p>
                  <p className="text-xs text-muted-foreground">Reunited</p>
                  <p className="text-xs text-green-600">
                    {stats.totalReports > 0 
                      ? Math.round((stats.reunitedPets / stats.totalReports) * 100)
                      : 0}% success
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <DollarSign className="h-8 w-8 text-yellow-500" />
                <div className="text-right">
                  <p className="text-2xl font-bold">${stats.totalRewards}</p>
                  <p className="text-xs text-muted-foreground">Rewards</p>
                  <p className="text-xs text-orange-600">
                    {stats.flaggedContent} flagged
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">Daily Reports</TabsTrigger>
                <TabsTrigger value="species">Species</TabsTrigger>
                <TabsTrigger value="success">Success Rate</TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.dailyReports}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="species" className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.speciesDistribution}
                      dataKey="count"
                      nameKey="species"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {analyticsData.speciesDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="success" className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.successRate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="rate" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Content Moderation */}
        <Card>
          <CardHeader>
            <CardTitle>Content Moderation</CardTitle>
            <CardDescription>
              Review and moderate reported content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="reports">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reports">
                  Reports ({stats.pendingVerification})
                </TabsTrigger>
                <TabsTrigger value="users">
                  Users ({users.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reports" className="space-y-3">
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reports
                  .filter(r => {
                    if (filterType === 'pending' && r.verified) return false;
                    if (filterType === 'flagged' && !r.flagged) return false;
                    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .slice(0, 10)
                  .map(report => (
                    <Card key={report.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            {report.photoUrl && (
                              <img
                                src={report.photoUrl}
                                alt={report.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-semibold">{report.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {report.species} • {report.location}
                              </p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant={report.type === 'lost' ? 'destructive' : 'default'}>
                                  {report.type}
                                </Badge>
                                {report.verified && (
                                  <Badge variant="outline" className="text-green-600">
                                    Verified
                                  </Badge>
                                )}
                                {report.flagged && (
                                  <Badge variant="destructive">
                                    Flagged
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-1">
                            {!report.verified && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleVerifyReport(report.id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            
                            <AlertDialog
                              open={deleteConfirm === report.id}
                              onOpenChange={(open) => !open && setDeleteConfirm(null)}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteConfirm(report.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the report. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteReport(report.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="users" className="space-y-3">
                {users.slice(0, 10).map(user => (
                  <Card key={user.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                              {user.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {user.reportCount} reports • {user.reunitedCount} reunited
                            </span>
                          </div>
                        </div>
                        
                        <Select
                          value={user.status}
                          onValueChange={(v) => handleSuspendUser(user.id, v as any)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="banned">Banned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}