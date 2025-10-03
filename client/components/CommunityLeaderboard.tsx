import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, TrendingUp, Users, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardUser {
  id: string;
  name: string;
  photoURL?: string;
  stats: {
    petsReunited: number;
    reportsCreated: number;
    successfulMatches: number;
    helpfulMessages: number;
    communityPoints: number;
  };
  badges: string[];
}

export default function CommunityLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // Calculate date filters
      const now = new Date();
      let startDate = new Date(0); // All time by default
      
      if (timeframe === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (timeframe === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get all users
      const usersQuery = query(collection(db, 'users'), limit(100));
      const usersSnapshot = await getDocs(usersQuery);
      
      const leaderboardData: LeaderboardUser[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Get user's reports
        const reportsQuery = timeframe === 'all' 
          ? query(collection(db, 'reports'), where('userId', '==', userDoc.id))
          : query(
              collection(db, 'reports'),
              where('userId', '==', userDoc.id),
              where('createdAt', '>=', startDate)
            );
        const reportsSnapshot = await getDocs(reportsQuery);
        
        // Count reunited pets
        const reunitedCount = reportsSnapshot.docs.filter(
          doc => doc.data().status === 'reunited'
        ).length;
        
        // Calculate stats (simplified for demo)
        const stats = {
          petsReunited: reunitedCount,
          reportsCreated: reportsSnapshot.size,
          successfulMatches: Math.floor(reunitedCount * 0.8), // Estimate
          helpfulMessages: Math.floor(Math.random() * 50), // Demo data
          communityPoints: 0
        };
        
        // Calculate community points
        stats.communityPoints = 
          stats.petsReunited * 100 +
          stats.reportsCreated * 10 +
          stats.successfulMatches * 50 +
          stats.helpfulMessages * 2;
        
        // Determine badges
        const badges: string[] = [];
        if (stats.petsReunited >= 10) badges.push('Hero');
        if (stats.petsReunited >= 5) badges.push('Guardian');
        if (stats.petsReunited >= 1) badges.push('Rescuer');
        if (stats.reportsCreated >= 20) badges.push('Reporter');
        if (stats.successfulMatches >= 5) badges.push('Matchmaker');
        if (stats.helpfulMessages >= 25) badges.push('Helper');
        
        leaderboardData.push({
          id: userDoc.id,
          name: userData.name || 'Anonymous',
          photoURL: userData.photoURL,
          stats,
          badges
        });
      }
      
      // Sort by community points
      leaderboardData.sort((a, b) => b.stats.communityPoints - a.stats.communityPoints);
      
      // Take top 20
      setUsers(leaderboardData.slice(0, 20));
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      
      // Load demo data
      setUsers(generateDemoData());
    } finally {
      setLoading(false);
    }
  };

  const generateDemoData = (): LeaderboardUser[] => {
    return [
      {
        id: '1',
        name: 'Sarah Johnson',
        photoURL: 'https://i.pravatar.cc/150?u=1',
        stats: {
          petsReunited: 12,
          reportsCreated: 45,
          successfulMatches: 10,
          helpfulMessages: 128,
          communityPoints: 2106
        },
        badges: ['Hero', 'Guardian', 'Rescuer', 'Reporter', 'Matchmaker']
      },
      {
        id: '2',
        name: 'Michael Chen',
        photoURL: 'https://i.pravatar.cc/150?u=2',
        stats: {
          petsReunited: 8,
          reportsCreated: 32,
          successfulMatches: 7,
          helpfulMessages: 95,
          communityPoints: 1470
        },
        badges: ['Guardian', 'Rescuer', 'Reporter', 'Matchmaker']
      },
      {
        id: '3',
        name: 'Emma Williams',
        photoURL: 'https://i.pravatar.cc/150?u=3',
        stats: {
          petsReunited: 6,
          reportsCreated: 28,
          successfulMatches: 5,
          helpfulMessages: 76,
          communityPoints: 1132
        },
        badges: ['Guardian', 'Rescuer', 'Matchmaker']
      },
      {
        id: '4',
        name: 'David Martinez',
        photoURL: 'https://i.pravatar.cc/150?u=4',
        stats: {
          petsReunited: 5,
          reportsCreated: 22,
          successfulMatches: 4,
          helpfulMessages: 61,
          communityPoints: 922
        },
        badges: ['Guardian', 'Rescuer']
      },
      {
        id: '5',
        name: 'Lisa Anderson',
        photoURL: 'https://i.pravatar.cc/150?u=5',
        stats: {
          petsReunited: 4,
          reportsCreated: 18,
          successfulMatches: 3,
          helpfulMessages: 43,
          communityPoints: 736
        },
        badges: ['Rescuer', 'Helper']
      }
    ];
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'border-yellow-500 bg-yellow-50';
    if (rank === 2) return 'border-gray-400 bg-gray-50';
    if (rank === 3) return 'border-orange-600 bg-orange-50';
    return '';
  };

  const getBadgeColor = (badge: string) => {
    const colors: Record<string, string> = {
      'Hero': 'bg-purple-600',
      'Guardian': 'bg-blue-600',
      'Rescuer': 'bg-green-600',
      'Reporter': 'bg-yellow-600',
      'Matchmaker': 'bg-pink-600',
      'Helper': 'bg-indigo-600'
    };
    return colors[badge] || 'bg-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Community Heroes
              </CardTitle>
              <CardDescription>
                Recognizing our top contributors who help reunite lost pets
              </CardDescription>
            </div>
            <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
              <TabsList>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {/* Top 3 Podium */}
          {users.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {/* 2nd Place */}
              <div className="order-1 pt-8">
                <Card className={cn("border-2", getRankColor(2))}>
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(2)}
                    </div>
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarImage src={users[1].photoURL} />
                      <AvatarFallback>{users[1].name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm">{users[1].name}</p>
                    <p className="text-xs text-muted-foreground">
                      {users[1].stats.communityPoints} pts
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* 1st Place */}
              <div className="order-2">
                <Card className={cn("border-2", getRankColor(1))}>
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(1)}
                    </div>
                    <Avatar className="h-20 w-20 mx-auto mb-2">
                      <AvatarImage src={users[0].photoURL} />
                      <AvatarFallback>{users[0].name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{users[0].name}</p>
                    <p className="text-sm text-muted-foreground">
                      {users[0].stats.communityPoints} pts
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* 3rd Place */}
              <div className="order-3 pt-8">
                <Card className={cn("border-2", getRankColor(3))}>
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(3)}
                    </div>
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarImage src={users[2].photoURL} />
                      <AvatarFallback>{users[2].name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm">{users[2].name}</p>
                    <p className="text-xs text-muted-foreground">
                      {users[2].stats.communityPoints} pts
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Full Leaderboard */}
          <div className="space-y-2">
            {users.slice(3).map((user, index) => (
              <Card key={user.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 text-center">
                      {getRankIcon(index + 4)}
                    </div>
                    
                    <Avatar>
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <p className="font-semibold">{user.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.badges.slice(0, 3).map(badge => (
                          <Badge
                            key={badge}
                            variant="secondary"
                            className={cn("text-xs text-white", getBadgeColor(badge))}
                          >
                            {badge}
                          </Badge>
                        ))}
                        {user.badges.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.badges.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold">{user.stats.communityPoints}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t">
                    <div className="text-center">
                      <Heart className="h-4 w-4 mx-auto text-red-500" />
                      <p className="text-xs font-semibold">{user.stats.petsReunited}</p>
                      <p className="text-[10px] text-muted-foreground">Reunited</p>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="h-4 w-4 mx-auto text-blue-500" />
                      <p className="text-xs font-semibold">{user.stats.reportsCreated}</p>
                      <p className="text-[10px] text-muted-foreground">Reports</p>
                    </div>
                    <div className="text-center">
                      <Award className="h-4 w-4 mx-auto text-green-500" />
                      <p className="text-xs font-semibold">{user.stats.successfulMatches}</p>
                      <p className="text-[10px] text-muted-foreground">Matches</p>
                    </div>
                    <div className="text-center">
                      <Users className="h-4 w-4 mx-auto text-purple-500" />
                      <p className="text-xs font-semibold">{user.stats.helpfulMessages}</p>
                      <p className="text-[10px] text-muted-foreground">Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}