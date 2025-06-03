// app/(dashboard)/dashboard/messages/page.tsx
'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { UserProfile, Message } from '@/types';
import { User } from '@supabase/supabase-js';
import { Send, User as UserIcon, AlertCircle, MessageCircle, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';

type MessageWithSenderReceiver = Message & {
  sender: Pick<UserProfile, 'id' | 'name' | 'profile_picture'> | null;
  receiver: Pick<UserProfile, 'id' | 'name' | 'profile_picture'> | null;
};

export default function MessagesPage() {
  const supabase = createSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<Pick<UserProfile, 'id' | 'name' | 'profile_picture' | 'email'>[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithSenderReceiver[]>([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');


  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
    };
    fetchCurrentUser();
  }, [supabase]);

  // Fetch all users (potential conversation partners)
  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      const { data, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, profile_picture')
        .neq('id', currentUser.id); // Exclude current user

      if (usersError) {
        console.error('Error fetching users:', usersError);
        setError('Could not load users.');
        setAllUsers([]);
      } else {
        setAllUsers(data || []);
      }
      setIsLoadingUsers(false);
    };
    fetchUsers();
  }, [currentUser, supabase]);

  // Fetch messages when a conversation is selected
  const fetchMessages = useCallback(async (partnerId: string) => {
    if (!currentUser) return;
    setIsLoadingMessages(true);
    setError(null);

    const { data, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (id, name, profile_picture),
        receiver:receiver_id (id, name, profile_picture)
      `)
      .or(`(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`)
      .order('sent_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      setError('Could not load messages for this conversation.');
      setMessages([]);
    } else {
      setMessages(data as MessageWithSenderReceiver[] || []);
      // Mark messages as read (basic implementation)
      // This should ideally be more robust, perhaps an RPC or specific endpoint
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', currentUser.id)
        .eq('sender_id', partnerId)
        .eq('is_read', false);
    }
    setIsLoadingMessages(false);
  }, [currentUser, supabase]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
    }
  }, [selectedUserId, fetchMessages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedUserId || !newMessageContent.trim()) return;

    const tempMessageId = `temp-${Date.now()}`; // For optimistic update

    const newMessage: Partial<MessageWithSenderReceiver> = {
      id: tempMessageId,
      sender_id: currentUser.id,
      receiver_id: selectedUserId,
      content: newMessageContent.trim(),
      sent_at: new Date().toISOString(),
      is_read: false,
      sender: { // Optimistic sender info
        id: currentUser.id,
        name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'You',
        profile_picture: currentUser.user_metadata?.profile_picture || null,
      },
      receiver: allUsers.find(u => u.id === selectedUserId) || null,
    };

    setMessages(prev => [...prev, newMessage as MessageWithSenderReceiver]);
    setNewMessageContent('');

    const { error: sendError } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: selectedUserId,
        content: newMessage.content,
      });

    if (sendError) {
      console.error('Error sending message:', sendError);
      setError('Failed to send message.');
      // Revert optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempMessageId));
    } else {
      // Optionally re-fetch messages to confirm, or rely on subscription for real-time
      // For now, optimistic update is considered sufficient for this step
    }
  };

  const filteredUsers = allUsers.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (!currentUser && !isLoadingUsers) { // Added !isLoadingUsers to wait for user fetch
    return <div className="p-6 text-center text-slate-600">Please log in to view messages.</div>;
  }

  if (isLoadingUsers && !currentUser) { // Initial loading state for current user
      return (
          <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
              <svg className="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          </div>
      );
  }


  return (
    <div className="flex h-[calc(100vh-8rem)]"> {/* Adjust height based on Navbar/header */}
      {/* Left Column: Conversation List */}
      <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">Conversations</h2>
           <div className="relative mt-2">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-8 border border-slate-300 rounded-md text-sm"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>
        <div className="overflow-y-auto flex-grow">
          {isLoadingUsers ? (
            <p className="p-4 text-sm text-slate-500">Loading users...</p>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`p-3 hover:bg-amber-100 cursor-pointer border-b border-slate-100 ${selectedUserId === user.id ? 'bg-amber-200' : ''}`}
              >
                <div className="flex items-center">
                  {user.profile_picture ? (
                     <Image src={user.profile_picture} alt={user.name || user.email || 'User'} width={40} height={40} className="rounded-full mr-3 object-cover"/>
                  ) : (
                    <UserIcon size={24} className="text-slate-500 mr-3 p-1 bg-slate-200 rounded-full" />
                  )}
                  <div>
                    <p className="font-medium text-slate-700 text-sm">{user.name || user.email?.split('@')[0]}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-slate-500">No users found.</p>
          )}
        </div>
      </div>

      {/* Right Column: Message Panel */}
      <div className="w-2/3 flex flex-col bg-white">
        {selectedUserId ? (
          <>
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">
                Chat with {allUsers.find(u => u.id === selectedUserId)?.name || allUsers.find(u => u.id === selectedUserId)?.email?.split('@')[0] || 'Selected User'}
              </h3>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-100">
              {isLoadingMessages ? (
                <p className="text-sm text-slate-500 text-center">Loading messages...</p>
              ) : messages.length > 0 ? (
                messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md p-3 rounded-xl shadow ${
                      msg.sender_id === currentUser?.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender_id === currentUser?.id ? 'text-amber-100' : 'text-slate-400'} text-right`}>
                        {format(parseISO(msg.sent_at), 'p')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-10">
                    <MessageCircle size={48} className="mx-auto text-slate-400 mb-2"/>
                    <p>No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50 flex items-center">
              <input
                type="text"
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                disabled={isLoadingMessages}
              />
              <button type="submit" className="ml-3 p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-md transition" disabled={!newMessageContent.trim() || isLoadingMessages}>
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-500 bg-slate-50 p-4">
            <MessageCircle size={64} className="mb-4 text-slate-400"/>
            <p className="text-lg">Select a conversation to start messaging.</p>
            <p className="text-sm">Or search for a user to chat with.</p>
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-100 text-red-700 text-sm flex items-center">
            <AlertCircle size={18} className="mr-2"/> {error}
          </div>
        )}
      </div>
    </div>
  );
}
