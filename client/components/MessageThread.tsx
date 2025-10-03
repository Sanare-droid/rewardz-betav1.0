import { useEffect, useState, useRef, KeyboardEvent } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUser } from '@/context/UserContext';
import { formatDistanceToNow } from 'date-fns';
import { Send, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: any;
  isRead: boolean;
  readAt?: any;
}

interface MessageThreadProps {
  reportId: string;
  recipientId?: string;
  recipientName?: string;
  className?: string;
}

export function MessageThread({ 
  reportId, 
  recipientId,
  recipientName,
  className 
}: MessageThreadProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (!reportId || !user) return;
    
    // Subscribe to messages
    const messagesRef = collection(db, 'reports', reportId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      const messagesToMarkRead: string[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          ...data
        } as Message);
        
        // Track messages that need to be marked as read
        if (data.userId !== user.uid && !data.isRead) {
          messagesToMarkRead.push(doc.id);
        }
      });
      
      setMessages(msgs);
      setLoading(false);
      
      // Mark messages as read
      messagesToMarkRead.forEach(async (msgId) => {
        try {
          await updateDoc(
            doc(db, 'reports', reportId, 'messages', msgId),
            {
              isRead: true,
              readAt: serverTimestamp()
            }
          );
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });
      
      // Scroll to bottom on new messages
      setTimeout(scrollToBottom, 100);
    });
    
    // Subscribe to typing indicators
    const typingRef = collection(db, 'reports', reportId, 'typing');
    const typingQuery = query(typingRef, where('userId', '!=', user.uid));
    
    const typingUnsub = onSnapshot(typingQuery, (snapshot) => {
      setOtherUserTyping(!snapshot.empty);
    });
    
    return () => {
      unsubscribe();
      typingUnsub();
    };
  }, [reportId, user]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleTyping = async () => {
    if (!user || !reportId) return;
    
    if (!isTyping) {
      setIsTyping(true);
      try {
        // Add typing indicator
        const typingRef = await addDoc(
          collection(db, 'reports', reportId, 'typing'),
          {
            userId: user.uid,
            userName: user.name,
            timestamp: serverTimestamp()
          }
        );
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Remove typing indicator after 3 seconds
        typingTimeoutRef.current = setTimeout(async () => {
          try {
            await updateDoc(doc(db, 'reports', reportId, 'typing', typingRef.id), {
              timestamp: null
            });
          } catch {}
          setIsTyping(false);
        }, 3000);
      } catch (error) {
        console.error('Error setting typing indicator:', error);
      }
    }
  };
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;
    
    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    try {
      await addDoc(collection(db, 'reports', reportId, 'messages'), {
        userId: user.uid,
        userName: user.name,
        userPhoto: user.photoURL,
        content: messageContent,
        createdAt: serverTimestamp(),
        isRead: false
      });
      
      // Create notification for recipient if they exist
      if (recipientId && recipientId !== user.uid) {
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: recipientId,
            type: 'message',
            title: 'New Message',
            message: `${user.name} sent you a message about a pet report`,
            reportId: reportId,
            senderId: user.uid,
            isRead: false,
            createdAt: serverTimestamp(),
            actionUrl: `/messages?report=${reportId}`
          });
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };
  
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    handleTyping();
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
      <div className={cn("flex justify-center items-center h-64", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet</p>
              <p className="text-sm mt-2">Send a message to start the conversation</p>
            </div>
          )}
          
          {messages.map((msg) => {
            const isOwnMessage = msg.userId === user?.uid;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  isOwnMessage ? "justify-end" : "justify-start"
                )}
              >
                {!isOwnMessage && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.userPhoto} />
                    <AvatarFallback>{getInitials(msg.userName)}</AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2",
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1">{msg.userName}</p>
                  )}
                  <p className="break-words">{msg.content}</p>
                  <div className={cn(
                    "flex items-center gap-1 mt-1",
                    isOwnMessage ? "justify-end" : "justify-start"
                  )}>
                    <p className="text-xs opacity-70">
                      {formatMessageTime(msg.createdAt)}
                    </p>
                    {isOwnMessage && (
                      <span className="text-xs opacity-70">
                        {msg.isRead ? (
                          <CheckCheck className="w-3 h-3 inline" />
                        ) : (
                          <Check className="w-3 h-3 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
                
                {isOwnMessage && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback>{getInitials(user?.name || 'User')}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          
          {otherUserTyping && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>...</AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={recipientName ? `Message ${recipientName}...` : "Type a message..."}
            disabled={sending || !user}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending || !user}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}