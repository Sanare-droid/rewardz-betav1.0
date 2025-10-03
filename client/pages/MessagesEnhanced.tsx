import MobileLayout from "@/components/rewardz/MobileLayout";
import { MessageThread } from "@/components/MessageThread";
import { useUser } from "@/context/UserContext";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Thread {
  reportId: string;
  reportTitle: string;
  reportType: 'lost' | 'found';
  lastMessage?: {
    content: string;
    userId: string;
    userName: string;
    createdAt: any;
    isRead: boolean;
  };
  otherUserId?: string;
  otherUserName?: string;
  otherUserPhoto?: string;
  unreadCount: number;
}

export default function MessagesEnhanced() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('report');
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadThreads();
  }, [user]);
  
  useEffect(() => {
    // If a specific report is requested, load it
    if (reportId && threads.length > 0) {
      const thread = threads.find(t => t.reportId === reportId);
      if (thread) {
        selectThread(thread);
      }
    }
  }, [reportId, threads]);
  
  const loadThreads = async () => {
    if (!user) return;
    
    try {
      const threadMap = new Map<string, Thread>();
      
      // Get reports where user is the owner
      const myReportsQuery = query(
        collection(db, "reports"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      
      const myReportsSnap = await getDocs(myReportsQuery);
      
      for (const reportDoc of myReportsSnap.docs) {
        const reportData = reportDoc.data();
        
        // Get messages for this report
        const messagesQuery = query(
          collection(db, "reports", reportDoc.id, "messages"),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        
        const messagesSnap = await getDocs(messagesQuery);
        
        if (!messagesSnap.empty) {
          const lastMessage = messagesSnap.docs[0].data();
          
          // Count unread messages
          const unreadQuery = query(
            collection(db, "reports", reportDoc.id, "messages"),
            where("userId", "!=", user.uid),
            where("isRead", "==", false)
          );
          const unreadSnap = await getDocs(unreadQuery);
          
          threadMap.set(reportDoc.id, {
            reportId: reportDoc.id,
            reportTitle: reportData.name || `${reportData.species} - ${reportData.breed}`,
            reportType: reportData.type,
            lastMessage: {
              content: lastMessage.content,
              userId: lastMessage.userId,
              userName: lastMessage.userName,
              createdAt: lastMessage.createdAt,
              isRead: lastMessage.isRead
            },
            otherUserId: lastMessage.userId !== user.uid ? lastMessage.userId : undefined,
            otherUserName: lastMessage.userId !== user.uid ? lastMessage.userName : undefined,
            unreadCount: unreadSnap.size
          });
        }
      }
      
      // Try to get reports where user has sent messages
      try {
        const messagesGroupQuery = query(
          collectionGroup(db, "messages"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(100)
        );
        
        const messagesGroupSnap = await getDocs(messagesGroupQuery);
        
        for (const msgDoc of messagesGroupSnap.docs) {
          const reportId = msgDoc.ref.parent.parent?.id;
          if (!reportId || threadMap.has(reportId)) continue;
          
          // Get the report details
          const reportDoc = await getDoc(doc(db, "reports", reportId));
          if (!reportDoc.exists()) continue;
          
          const reportData = reportDoc.data();
          
          // Get last message for this report
          const messagesQuery = query(
            collection(db, "reports", reportId, "messages"),
            orderBy("createdAt", "desc"),
            limit(1)
          );
          
          const lastMsgSnap = await getDocs(messagesQuery);
          if (!lastMsgSnap.empty) {
            const lastMessage = lastMsgSnap.docs[0].data();
            
            // Count unread
            const unreadQuery = query(
              collection(db, "reports", reportId, "messages"),
              where("userId", "!=", user.uid),
              where("isRead", "==", false)
            );
            const unreadSnap = await getDocs(unreadQuery);
            
            threadMap.set(reportId, {
              reportId: reportId,
              reportTitle: reportData.name || `${reportData.species} - ${reportData.breed}`,
              reportType: reportData.type,
              lastMessage: {
                content: lastMessage.content,
                userId: lastMessage.userId,
                userName: lastMessage.userName,
                createdAt: lastMessage.createdAt,
                isRead: lastMessage.isRead
              },
              otherUserId: reportData.userId,
              otherUserName: reportData.userName || 'User',
              unreadCount: unreadSnap.size
            });
          }
        }
      } catch (error) {
        console.log('CollectionGroup query not available, using fallback');
      }
      
      // Convert map to array and sort by last message time
      const threadsArray = Array.from(threadMap.values()).sort((a, b) => {
        const aTime = a.lastMessage?.createdAt?.seconds || 0;
        const bTime = b.lastMessage?.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      
      setThreads(threadsArray);
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const selectThread = async (thread: Thread) => {
    setSelectedThread(thread);
    
    // Load full report details
    try {
      const reportDoc = await getDoc(doc(db, "reports", thread.reportId));
      if (reportDoc.exists()) {
        setCurrentReport({ id: reportDoc.id, ...reportDoc.data() });
      }
    } catch (error) {
      console.error('Error loading report:', error);
    }
  };
  
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  if (loading) {
    return (
      <MobileLayout title="Messages">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }
  
  // Mobile view - show thread or list
  if (selectedThread) {
    return (
      <MobileLayout title="Messages" back>
        <div className="h-[calc(100vh-8rem)]">
          {/* Thread Header */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedThread(null)}
                  className="lg:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {selectedThread.reportTitle}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant={selectedThread.reportType === 'lost' ? 'destructive' : 'default'}>
                      {selectedThread.reportType}
                    </Badge>
                    {selectedThread.otherUserName && (
                      <span className="ml-2">with {selectedThread.otherUserName}</span>
                    )}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/report/${selectedThread.reportId}`}>View Report</Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
          
          {/* Message Thread */}
          <MessageThread
            reportId={selectedThread.reportId}
            recipientId={selectedThread.otherUserId}
            recipientName={selectedThread.otherUserName}
            className="h-[calc(100%-7rem)]"
          />
        </div>
      </MobileLayout>
    );
  }
  
  return (
    <MobileLayout title="Messages">
      <div className="space-y-4">
        {threads.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Messages will appear here when you start conversations about pet reports
              </p>
              <Button className="mt-4" asChild>
                <Link to="/alerts">Browse Reports</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              {threads.length} conversation{threads.length !== 1 ? 's' : ''}
            </div>
            
            {threads.map((thread) => (
              <Card
                key={thread.reportId}
                className={cn(
                  "cursor-pointer hover:bg-muted/50 transition-colors",
                  thread.unreadCount > 0 && "border-primary"
                )}
                onClick={() => selectThread(thread)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={thread.otherUserPhoto} />
                      <AvatarFallback>
                        {thread.otherUserName ? getInitials(thread.otherUserName) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="font-semibold truncate">
                            {thread.reportTitle}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={thread.reportType === 'lost' ? 'destructive' : 'default'}
                              className="text-xs"
                            >
                              {thread.reportType}
                            </Badge>
                            {thread.otherUserName && (
                              <span className="text-xs text-muted-foreground">
                                {thread.otherUserName}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {formatTime(thread.lastMessage?.createdAt)}
                          </p>
                          {thread.unreadCount > 0 && (
                            <Badge className="mt-1" variant="destructive">
                              {thread.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {thread.lastMessage && (
                        <p className={cn(
                          "text-sm truncate",
                          thread.unreadCount > 0 ? "font-medium" : "text-muted-foreground"
                        )}>
                          {thread.lastMessage.userId === user?.uid && "You: "}
                          {thread.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </MobileLayout>
  );
}