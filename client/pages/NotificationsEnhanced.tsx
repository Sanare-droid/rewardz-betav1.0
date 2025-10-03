import MobileLayout from "@/components/rewardz/MobileLayout";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification
} from "@/lib/notifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  BellOff, 
  MessageSquare, 
  Search, 
  Gift, 
  AlertCircle,
  Check,
  CheckCheck,
  Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

export default function NotificationsEnhanced() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'match' | 'message' | 'system'>('all');
  const [loading, setLoading] = useState(true);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Subscribe to notifications
    const unsub = subscribeToNotifications(
      user.uid,
      (notifs) => {
        setNotifications(notifs);
        setLoading(false);
      },
      (error) => {
        console.error('Notification subscription error:', error);
        toast({
          title: "Error loading notifications",
          description: "Please try refreshing the page",
          variant: "destructive"
        });
      }
    );

    setUnsubscribe(() => unsub);

    return () => {
      unsub();
    };
  }, [user, navigate]);

  const handleMarkRead = async (notificationId: string) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    
    try {
      await markAllNotificationsRead(user.uid);
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      toast({
        title: "All notifications marked as read",
        description: "Your notification inbox is now clear"
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive"
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead && notification.id) {
      await handleMarkRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match':
        return <Search className="h-5 w-5" />;
      case 'message':
        return <MessageSquare className="h-5 w-5" />;
      case 'reward':
        return <Gift className="h-5 w-5" />;
      case 'system':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'match':
        return 'text-green-600';
      case 'message':
        return 'text-blue-600';
      case 'reward':
        return 'text-yellow-600';
      case 'system':
        return 'text-gray-600';
      default:
        return 'text-primary';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loading) {
    return (
      <MobileLayout title="Notifications">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Notifications">
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to="/settings/notifications">
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-1 h-5 px-1" variant="destructive">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="match">Matches</TabsTrigger>
            <TabsTrigger value="message">Messages</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No notifications</p>
                  {filter === 'unread' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      You're all caught up!
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50 transition-colors",
                        !notification.isRead && "border-primary bg-primary/5"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-full bg-muted",
                            getNotificationColor(notification.type)
                          )}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className={cn(
                                  "font-semibold",
                                  !notification.isRead && "text-primary"
                                )}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                )}
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatTime(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                            
                            {notification.data && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {notification.data.reportName && (
                                  <Badge variant="outline">
                                    {notification.data.reportName}
                                  </Badge>
                                )}
                                {notification.data.matchScore && (
                                  <Badge variant="secondary">
                                    {notification.data.matchScore}% match
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            {notification.actionUrl && (
                              <Button
                                variant="link"
                                size="sm"
                                className="mt-2 p-0 h-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
                              >
                                View Details →
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}