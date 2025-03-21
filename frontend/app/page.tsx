'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { Thread, Message } from '../types';


const Home: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [threadId, setThreadId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializationRef = useRef<boolean>(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    // Guard against multiple initializations
    if (initializationRef.current) return;
    initializationRef.current = true;
    
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        
        // Check if userId and threadId exist in localStorage
        const storedUserId = localStorage.getItem('userId');
        const storedThreadId = localStorage.getItem('threadId');
        
        if (storedUserId && storedThreadId) {
          setUserId(storedUserId);
          setThreadId(storedThreadId);
          await fetchMessages(storedUserId, storedThreadId);
        } else {
          const defaultUserId = '1';
          setUserId(defaultUserId);
          localStorage.setItem('userId', defaultUserId);
          await createNewThread(defaultUserId);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeChat();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);
  
  // Connect to WebSocket when threadId changes
  useEffect(() => {
    if (!threadId || !userId) return;
    
    const wsKey = `${userId}:${threadId}`;
    const lastWsKey = socketRef.current?.url?.split('/ws/')[1];
    
    if (lastWsKey === wsKey && socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    connectWebSocket(userId, threadId);
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [threadId, userId]);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Connect to WebSocket with retry logic
  const connectWebSocket = (userId: string, threadId: string) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const wsUrl = `${apiUrl?.replace(/^http/, 'ws')}/ws/${userId}/${threadId}`;
    socketRef.current = new WebSocket(wsUrl);
    
    socketRef.current.onopen = () => {
      console.log('WebSocket connection established');
      setIsSocketConnected(true);
    };
    
    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newMessage: Message = {
          content: data.content,
          sender: 'bot',
          created_at: new Date(data.created_at || Date.now()),
        };
        setMessages(prevMessages => [...prevMessages, newMessage]);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsSocketConnected(false);
    };
    
    socketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
      setIsSocketConnected(false);
      
      setTimeout(() => {
        if (userId && threadId) {
          connectWebSocket(userId, threadId);
        }
      }, 1000);
    };
  };
  
  const createNewThread = async (userId: string) => {
    try {
      const response = await fetch(`${apiUrl}/user/${userId}/thread`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create thread: ${response.status}`);
      }
      
      const data: Thread = await response.json();
      localStorage.setItem('threadId', data.id.toString());
      setThreadId(data.id.toString());
      
      setMessages([{
        content: "Welcome to the Hello Patient chatbot! How can I assist you today?",
        sender: 'bot',
        created_at: new Date(),
      }]);      
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };
  

  const fetchMessages = async (userId: string, threadId: string) => {
    try {
      const response = await fetch(`${apiUrl}/user/${userId}/${threadId}/messages`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Thread not found, creating a new one');
          localStorage.removeItem('threadId');
          await createNewThread(userId);
          return;
        }
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const formattedMessages: Message[] = data.map((msg: any) => ({
          content: msg.content,
          sender: msg.sender,
          created_at: new Date(msg.created_at || Date.now()),
        }));
          
        setMessages(formattedMessages);
      } else {
        console.error('Invalid message data format:', data);
        setMessages([]);
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  const sendMessage = () => {
    if (newMessage.trim() === '') return;
    if (!threadId) {
      console.error('No thread ID available');
      return;
    }
    
    if (!isSocketConnected) {
      connectWebSocket(userId, threadId);
      setTimeout(() => sendMessage(), 1000);
      return;
    }
    
    setIsSending(true);
    
    const userMessage: Message = {
      content: newMessage,
      sender: 'user',
      created_at: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const messageData = {
        content: newMessage
      };
      
      try {
        socketRef.current.send(JSON.stringify(messageData));
      } catch (error) {
        console.error('Error sending message:', error);
      }
      
      setNewMessage('');
    } else {
      console.error('WebSocket is not connected');
      connectWebSocket(userId, threadId);
    }
    
    setIsSending(false);
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const resetChat = async () => {
    if (confirm('Are you sure you want to start a new conversation?')) {
      localStorage.removeItem('threadId');
      setMessages([]);
      setIsLoading(true);
      
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      try {
        await createNewThread(userId);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Hello Patient</h1>
        <Button variant="outline" size="sm" onClick={resetChat} disabled={isLoading}>
          New Chat
        </Button>
      </div>
      
      {/* Fixed height card with scrollable content */}
      <Card className="mb-4" style={{ height: 'calc(100vh - 160px)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <CardContent className="p-4">
              {messages.length === 0 ? (
                <div className="flex justify-center items-center h-24 text-gray-400">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${index}-${message.created_at.getTime()}`}
                    className={`flex mb-4 ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className="flex items-start max-w-[80%]">
                      {message.sender === 'bot' && (
                        <Avatar className="mr-2 mt-0.5">
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col">
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100'
                          }`}
                        >
                          {message.content}
                        </div>
                        <span className="text-xs text-gray-500 mt-1 px-1">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                      {message.sender === 'user' && (
                        <Avatar className="ml-2 mt-0.5">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </CardContent>
          </ScrollArea>
        )}
      </Card>
      
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1"
          disabled={isLoading || isSending}
        />
        <Button 
          onClick={sendMessage} 
          size="icon" 
          disabled={isLoading || isSending || newMessage.trim() === ''}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {!isSocketConnected && !isLoading && (
        <div className="text-red-500 text-xs mt-2 text-center">
          Connection lost. Reconnecting...
        </div>
      )}
    </div>
  );
};

export default Home;