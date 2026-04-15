import React, { useState, useEffect, useRef } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Message, Chat } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';

interface ChatWindowProps {
  chatId: string;
  recipientName: string;
  recipientPhoto?: string;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, recipientName, recipientPhoto, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setIsLoading(false);
      
      // Scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        chatId,
        senderId: auth.currentUser.uid,
        text,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}/messages`);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white/20">
            <AvatarImage src={recipientPhoto} />
            <AvatarFallback>{recipientName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-bold text-sm">{recipientName}</h4>
            <p className="text-[10px] opacity-80">Online</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === auth.currentUser?.uid;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                    isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-900 rounded-tl-none'
                  }`}>
                    <p>{msg.text}</p>
                    <p className={`text-[10px] mt-1 opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                      {msg.createdAt ? format(new Date((msg.createdAt as any).seconds * 1000), 'HH:mm') : '...'}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-2">
        <Button type="button" variant="ghost" size="icon" className="rounded-full text-slate-400">
          <ImageIcon className="w-5 h-5" />
        </Button>
        <Input 
          placeholder="Type a message..." 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 rounded-full border-slate-200 focus:ring-indigo-500"
        />
        <Button type="submit" size="icon" className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};
