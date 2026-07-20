import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Paperclip, 
  ArrowLeft, 
  Check, 
  CheckCheck, 
  User as UserIcon,
  Smile,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Video,
  Info,
  Play,
  Mic,
  Pin,
  Camera,
  X,
  Trash2
} from 'lucide-react';
import { Language, User } from '../types';
import ClickableAvatar from './ClickableAvatar';
import {
  isSupabaseConfigured,
  supabase,
  dbGetConversations,
  dbGetOrCreatePrivateConversation,
  dbFindUserByContact,
  dbSendMessage,
  dbMarkMessagesAsSeen,
  dbUploadVoiceMessage,
  dbDeleteConversation,
  dbClearAllConversations,
  matchesUserQuery
} from '../utils/supabaseClient';
import { 
  AppAvatar, 
  AppButton, 
  AppCard, 
  AppInput, 
  AppSearchBar, 
  AppSkeleton, 
  AppEmptyState,
  AppLoader,
  AppDivider 
} from './ui';

interface Message {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
  timestamp: number;
  status?: 'sending' | 'delivered';
  isSeen?: boolean;
  attachment?: {
    type: 'image' | 'file';
    name: string;
    url: string;
  };
  voice?: {
    url: string;
    duration: number;
    size?: number;
    waveformData?: number[];
    uploadStatus?: string;
  };
}

interface Conversation {
  id?: string;
  contact: string;
  recipientId?: string;
  lastSeen?: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  timestamp: number;
  unreadCount: number;
  isOnline: boolean;
  messages: Message[];
}

interface ChatModuleProps {
  user: User;
  currentLanguage: Language;
  currentPath: string;
  navigate: (path: string, paramId?: string) => void;
}

// Default initial conversations to populate localStorage
const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    contact: '0321-5551234',
    name: 'Malik Shakeel',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
    lastMessage: 'Assalam-o-Alaikum! G bhai, aap ka suit tayyar ho gya hai. Aap jb chahein le skte hain.',
    time: '10:30 AM',
    timestamp: Date.now() - 30 * 60 * 1000,
    unreadCount: 2,
    isOnline: true,
    messages: [
      {
        id: 'm1_1',
        sender: 'me',
        text: 'Bhai, mera tailor suit kb tk tayyar ho ga?',
        time: '10:15 AM',
        timestamp: Date.now() - 45 * 60 * 1000,
      },
      {
        id: 'm1_2',
        sender: 'them',
        text: 'Assalam-o-Alaikum! G bhai, aap ka suit tayyar ho gya hai. Aap jb chahein le skte hain.',
        time: '10:30 AM',
        timestamp: Date.now() - 30 * 60 * 1000,
      }
    ]
  },
  {
    contact: '0344-1234567',
    name: 'Ayesha Siddiqui',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    lastMessage: 'Thank you for inquiring about the medical camp. It starts at 9 AM this Sunday.',
    time: 'Yesterday',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        id: 'm2_1',
        sender: 'me',
        text: 'Hello, free medical camp me pediatric doctors honge?',
        time: 'Yesterday 3:45 PM',
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
      },
      {
        id: 'm2_2',
        sender: 'them',
        text: 'Thank you for inquiring about the medical camp. It starts at 9 AM this Sunday.',
        time: 'Yesterday 4:00 PM',
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
      }
    ]
  },
  {
    contact: '0345-1234567',
    name: 'Chaudhary Kamran',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
    lastMessage: 'Bhai, tubewell thik ho gya hai. Paani subah 6 baje aa jaye ga.',
    time: '2 days ago',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    unreadCount: 0,
    isOnline: true,
    messages: [
      {
        id: 'm3_1',
        sender: 'me',
        text: 'Kamran bhai, paani ka kya masla chal rha hai Street 4 me?',
        time: '2 days ago',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000,
      },
      {
        id: 'm3_2',
        sender: 'them',
        text: 'Bhai, tubewell thik ho gya hai. Paani subah 6 baje aa jaye ga.',
        time: '2 days ago',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      }
    ]
  },
  {
    contact: '0315-9876543',
    name: 'Waseem Akram',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120',
    lastMessage: 'Bike ki price final 90,000 ho jaye gi. Agr lena hai to btaein.',
    time: '3 days ago',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        id: 'm4_1',
        sender: 'me',
        text: 'Waseem bhai, motorcycle available hai? Aur final price kya hai?',
        time: '3 days ago',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000,
      },
      {
        id: 'm4_2',
        sender: 'them',
        text: 'Bike ki price final 90,000 ho jaye gi. Agr lena hai to btaein.',
        time: '3 days ago',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
      }
    ]
  }
];

// Helper to map name to mock contact phone number in offline mode
const resolveMockContact = (cParam: string): string => {
  if (!cParam) return cParam;
  if (/^[0-9\-\+]+$/.test(cParam.replace(/\s/g, ''))) return cParam;
  
  const lowerName = cParam?.toLowerCase();
  if (lowerName.includes('shakeel')) return '0321-5551234';
  if (lowerName.includes('ayesha') || lowerName.includes('siddiqui')) return '0344-1234567';
  if (lowerName.includes('kamran')) return '0345-1234567';
  if (lowerName.includes('waseem') || lowerName.includes('akram')) return '0315-9876543';
  return cParam;
};

const VoiceMessageBubble = ({
  msg,
  isMe,
  currentlyPlayingMsgId,
  setCurrentlyPlayingMsgId,
  activeAudioElement,
  setActiveAudioElement,
  handleRetryVoiceUpload
}: {
  msg: any;
  isMe: boolean;
  currentlyPlayingMsgId: string | null;
  setCurrentlyPlayingMsgId: (id: string | null) => void;
  activeAudioElement: HTMLAudioElement | null;
  setActiveAudioElement: (audio: HTMLAudioElement | null) => void;
  handleRetryVoiceUpload: (id: string, url: string, d: number, s: number) => void;
}) => {
  const isPlaying = currentlyPlayingMsgId === msg.id;
  const [currentTime, setCurrentTime] = useState(0);
  const [localAudio, setLocalAudio] = useState<HTMLAudioElement | null>(null);

  // Stop playback if another message starts playing
  useEffect(() => {
    if (!isPlaying && localAudio) {
      localAudio.pause();
      setCurrentTime(0);
    }
  }, [isPlaying, localAudio]);

  // Register and clean up audio event listeners
  useEffect(() => {
    const audio = localAudio;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setCurrentlyPlayingMsgId(null);
      setActiveAudioElement(null);
      setCurrentTime(0);
    };
    const onPause = () => {
      setCurrentlyPlayingMsgId(prev => (prev === msg.id ? null : prev));
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.pause();
    };
  }, [localAudio, msg.id]);

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying && activeAudioElement) {
      activeAudioElement.pause();
      setCurrentlyPlayingMsgId(null);
      return;
    }

    // Stop current audio if playing
    if (activeAudioElement) {
      activeAudioElement.pause();
    }

    try {
      // Cache-aware URL resolver
      let playUrl = msg.voice.url;
      try {
        const cache = await caches.open('dh-voice-cache');
        const cachedResponse = await cache.match(msg.voice.url);
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          playUrl = URL.createObjectURL(blob);
        } else {
          // fetch and cache asynchronously
          fetch(msg.voice.url).then(res => {
            cache.put(msg.voice.url, res);
          }).catch(err => console.warn("Cache background fetch error:", err));
        }
      } catch (err) {
        console.warn("Service Cache error:", err);
      }

      const audio = new Audio(playUrl);
      setLocalAudio(audio);

      await audio.play();
      setActiveAudioElement(audio);
      setCurrentlyPlayingMsgId(msg.id);
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = msg.voice.duration > 0 ? (currentTime / msg.voice.duration) * 100 : 0;

  // Waveform visualization placeholder bar counts
  const barCount = 18;

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-2xl bg-slate-50 border border-slate-100 max-w-xs shadow-xs min-w-[210px]">
      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-0 cursor-pointer shadow-xs transition-colors ${
          isPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#2563eb] text-white hover:bg-blue-600'
        }`}
      >
        {isPlaying ? (
          <span className="flex gap-0.5 justify-center items-center">
            <span className="w-1 h-3.5 bg-white rounded-xs" />
            <span className="w-1 h-3.5 bg-white rounded-xs" />
          </span>
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      {/* Progress & Waveform container */}
      <div className="flex-1 space-y-1">
        {/* Animated Visual Waveform Bars */}
        <div className="flex items-end gap-[2px] h-6 px-1 select-none">
          {Array.from({ length: barCount }).map((_, idx) => {
            const isFilled = (idx / barCount) * 100 <= progressPercent;
            const heights = [30, 45, 60, 35, 20, 50, 70, 40, 25, 45, 65, 55, 30, 50, 35, 20, 40, 30];
            const heightVal = heights[idx % heights.length];
            return (
              <span 
                key={idx} 
                style={{ height: `${heightVal}%` }} 
                className={`w-[3px] rounded-xs transition-colors duration-100 ${
                  isFilled ? 'bg-[#2563eb]' : 'bg-slate-300'
                }`}
              />
            );
          })}
        </div>

        {/* Duration tracking timer */}
        <div className="flex justify-between text-[8px] text-slate-400 font-extrabold px-0.5 select-none">
          <span>{formatDuration(isPlaying ? currentTime : 0)}</span>
          <span>{formatDuration(msg.voice.duration)}</span>
        </div>
      </div>

      {/* Retry Upload indicator */}
      {msg.voice.uploadStatus === 'failed' && (
        <button
          onClick={() => handleRetryVoiceUpload(msg.id, msg.voice.url, msg.voice.duration, msg.voice.size || 0)}
          className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 border-0 cursor-pointer text-[9px] font-black"
          title="Retry upload"
        >
          🔄
        </button>
      )}

      {/* Upload Status Shimmer */}
      {msg.voice.uploadStatus === 'uploading' && (
        <span className="w-2.5 h-2.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" title="Uploading..." />
      )}
    </div>
  );
};

export default function ChatModule({
  user,
  currentLanguage,
  currentPath,
  navigate
}: ChatModuleProps) {
  const isEn = currentLanguage === 'en';
  const [inputText, setInputText] = useState('');
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const latestActiveContactRef = useRef<string | null>(null);

  const [onlineUsers, setOnlineUsers] = useState<{ [userId: string]: { online_at: string } }>({});
  const [typingUsers, setTypingUsers] = useState<{ [conversationId: string]: { [userId: string]: boolean } }>({});
  const isCurrentlyTypingRef = useRef(false);
  const presenceChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);
  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // === NEW CHAT FEATURES STATE ===
  // 1. Attachments & Camera
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraPhotoUrl, setCameraPhotoUrl] = useState<string | null>(null);
  const [cameraPhotoBlob, setCameraPhotoBlob] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 2. Voice Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // 3. Emoji Picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const NATIVE_EMOJIS = ['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'];
  const inputRef = useRef<HTMLInputElement>(null);
  // ===============================

  const formatLastSeen = (lastSeen?: string | number): string => {

    if (!lastSeen) return isEn ? 'offline' : 'آف لائن';
    const date = new Date(lastSeen);
    if (isNaN(date.getTime())) return String(lastSeen);
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return isEn ? 'Just now' : 'ابھی ابھی';
    if (diffMins < 60) return isEn ? `${diffMins}m ago` : `${diffMins} منٹ پہلے`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return isEn ? `${diffHours}h ago` : `${diffHours} گھنٹے پہلے`;
    
    return date.toLocaleDateString();
  };

  const mergeLocalAndDbChats = (dbChats: Conversation[]): Conversation[] => {
    let localChats: Conversation[] = [];
    const saved = localStorage.getItem('dhoke_connect_chats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          localChats = parsed;
        }
      } catch {}
    }

    const merged = [...dbChats];
    
    localChats.forEach((lc) => {
      // Find if there is a real database conversation with the same recipient or name
      const dbMatchIndex = merged.findIndex(mc => 
        mc.id === lc.contact || 
        mc.contact === lc.contact ||
        (mc.recipientId && lc.recipientId && mc.recipientId === lc.recipientId) ||
        (mc.name?.toLowerCase() === lc.name?.toLowerCase())
      );
      
      if (dbMatchIndex !== -1) {
        // Merge the messages from local storage mock conversation into the database conversation
        const dbConv = merged[dbMatchIndex];
        const mergedMessages = [...dbConv.messages];
        
        // Add local messages that are not already in the db conversation
        lc.messages.forEach((lm: any) => {
          const alreadyExists = mergedMessages.some(dm => 
            dm.id === lm.id || 
            (dm.text === lm.text && Math.abs(dm.timestamp - lm.timestamp) < 5000)
          );
          if (!alreadyExists) {
            mergedMessages.push(lm);
          }
        });
        
        // Sort merged messages by timestamp ascending
        mergedMessages.sort((a, b) => a.timestamp - b.timestamp);
        
        merged[dbMatchIndex] = {
          ...dbConv,
          messages: mergedMessages,
          // Keep the newer last message info
          lastMessage: mergedMessages.length > 0 ? mergedMessages[mergedMessages.length - 1].text : dbConv.lastMessage,
          timestamp: mergedMessages.length > 0 ? mergedMessages[mergedMessages.length - 1].timestamp : dbConv.timestamp
        };
      } else {
        // If no matching real conversation, add the local/mock conversation as standalone
        merged.push(lc);
      }
    });
    
    return merged.sort((a, b) => b.timestamp - a.timestamp);
  };

  const isChatMatch = (c: Conversation, targetContactId: string | null): boolean => {
    if (!targetContactId) return false;
    if (c.contact === targetContactId || c.id === targetContactId) return true;
    
    // Fallback: match by name for mock conversations if targetContactId is a UUID
    const nameParam = new URLSearchParams(window.location.search).get('name');
    if (nameParam && targetContactId && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(targetContactId)) {
      const isMock = !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(c.contact);
      if (isMock && c.name?.toLowerCase() === nameParam?.toLowerCase()) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    latestActiveContactRef.current = activeContact;
  }, [activeContact]);

  const handleUserInputChange = (text: string) => {
    setInputText(text);

    if (!isSupabaseConfigured || !supabase || !activeContact) return;

    if (!isCurrentlyTypingRef.current) {
      isCurrentlyTypingRef.current = true;
      if (presenceChannelRef.current) {
        presenceChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: user.id,
            conversationId: activeContact,
            isTyping: true
          }
        }).catch((err: any) => {
          console.error("Presence update failed", err);
        });
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isCurrentlyTypingRef.current = false;
      if (presenceChannelRef.current) {
        presenceChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: user.id,
            conversationId: activeContact,
            isTyping: false
          }
        }).catch((err: any) => {
          console.error("Presence update failed", err);
        });
      }
    }, 3000);
  };

  const [isListLoading, setIsListLoading] = useState(true);
  const [currentlyPlayingMsgId, setCurrentlyPlayingMsgId] = useState<string | null>(null);
  const [activeAudioElement, setActiveAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleRetryVoiceUpload = async (id: string, url: string, d: number, s: number) => {
    try {
      console.log("[CHAT]", "Retrying voice upload", id);
      const res = await fetch(url);
      const blob = await res.blob();
      const uploadUrl = await dbUploadVoiceMessage(user.id!, activeContact!, blob);
      if (uploadUrl) {
        // Update database message
        const { error } = await supabase.from('messages').update({ media_url: uploadUrl, upload_status: 'uploaded' }).eq('id', id);
        if (error) throw error;
        // Update local state
        setConversations(prev => prev.map(c => {
          if (c.id === activeContact) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === id ? { ...m, voice: { ...m.voice!, url: uploadUrl, uploadStatus: 'uploaded' } } : m)
            };
          }
          return c;
        }));
        console.log("[CHAT]", "Voice upload retry successful");
      }
    } catch (err) {
      console.error("[CHAT ERROR]", "Retry voice upload failed", err);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'people' | 'conversations' | 'messages' | 'groups' | 'unread'>('all');
  const [searchResults, setSearchResults] = useState<{
    people: any[];
    conversations: any[];
    messages: any[];
  }>({ people: [], conversations: [], messages: [] });
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('dh_chat_recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [jumpToMessageId, setJumpToMessageId] = useState<string | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(tempSearchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [tempSearchQuery]);

  // Jump to message scroll helper
  useEffect(() => {
    if (activeContact && jumpToMessageId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`chat-msg-${jumpToMessageId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const bubble = el.querySelector('div:not(.rounded-hidden)');
          if (bubble) {
            bubble.classList.add('animate-pulse-highlight');
            setTimeout(() => {
              bubble.classList.remove('animate-pulse-highlight');
              setJumpToMessageId(null);
            }, 2500);
          }
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [activeContact, jumpToMessageId]);

  // Search execution logic
  useEffect(() => {
    if (searchQuery?.trim().length < 2) {
      setSearchResults({ people: [], conversations: [], messages: [] });
      return;
    }

    const query = searchQuery?.trim();
    setIsSearchLoading(true);

    // Save search query to history (limit 10)
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s?.toLowerCase() !== query?.toLowerCase());
      const updated = [query, ...filtered]?.slice(0, 10);
      localStorage.setItem('dh_chat_recent_searches', JSON.stringify(updated));
      return updated;
    });

    async function executeSearch() {
      const localPeople = [
        { id: '0321-5551234', name: 'Malik Shakeel', contact: '0321-5551234', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120' },
        { id: '0344-1234567', name: 'Ayesha Siddiqui', contact: '0344-1234567', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120' },
        { id: '0345-1234567', name: 'Chaudhary Kamran', contact: '0345-1234567', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120' },
        { id: '0315-9876543', name: 'Waseem Akram', contact: '0315-9876543', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120' }
      ]
        .filter(p => matchesUserQuery({ name: p.name, contact: p.contact }, query))
        ?.slice(0, 20);

      const localConvs = conversations.filter(c => 
        c.name?.toLowerCase().includes(query?.toLowerCase()) || 
        c.lastMessage?.toLowerCase().includes(query?.toLowerCase())
      )?.slice(0, 20);

      const localMsgs = conversations.flatMap(c => 
        c.messages.filter(m => m.text?.toLowerCase().includes(query?.toLowerCase()))
        .map(m => ({
          id: m.id,
          text: m.text,
          time: m.time,
          timestamp: m.timestamp,
          conversationId: c.id || c.contact,
          conversationName: c.name,
          senderName: m.sender === 'me' ? 'Me' : c.name,
          senderAvatar: c.avatar
        }))
      )?.slice(0, 30);

      if (!isSupabaseConfigured || !supabase) {
        setSearchResults({
          people: localPeople,
          conversations: localConvs,
          messages: localMsgs
        });
        setIsSearchLoading(false);
        return;
      }

      try {
        const { data: dbPeople } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_photo, mobileNumber')
          .or(`full_name.ilike.%${query}%,username.ilike.%${query}%,mobileNumber.ilike.%${query}%,contactNumber.ilike.%${query}%`)
          .limit(20);

        const mappedPeople = (dbPeople || []).map((p: any) => ({
          id: p.user_id,
          name: p.full_name,
          avatar: p.profile_photo || undefined,
          contact: p.mobileNumber
        }));

        const mappedConvs = conversations.filter(c => 
          c.name?.toLowerCase().includes(query?.toLowerCase()) || 
          c.lastMessage?.toLowerCase().includes(query?.toLowerCase())
        )?.slice(0, 20);

        const { data: dbMessages } = await supabase
          .from('messages')
          .select(`
            id,
            message_text,
            created_at,
            conversation_id,
            sender_id
          `)
          .ilike('message_text', `%${query}%`)
          .order('created_at', { ascending: false })
          .limit(30);

        const mappedMsgs = (dbMessages || []).map((m: any) => {
          const parentConv = conversations.find(c => c.id === m.conversation_id);
          const isMe = m.sender_id === user.id;
          
          return {
            id: m.id,
            text: m.message_text,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(m.created_at).getTime(),
            conversationId: m.conversation_id,
            conversationName: parentConv?.name || 'Discussion Group',
            senderName: isMe ? 'Me' : (parentConv?.name || 'Them'),
            senderAvatar: parentConv?.avatar
          };
        });

        setSearchResults({
          people: mappedPeople,
          conversations: mappedConvs,
          messages: mappedMsgs
        });
      } catch (err) {
        console.warn("Exception in executeSearch:", err);
        setSearchResults({
          people: localPeople,
          conversations: localConvs,
          messages: localMsgs
        });
      } finally {
        setIsSearchLoading(false);
      }
    }

    executeSearch();
  }, [searchQuery, conversations, user.id, isSupabaseConfigured]);

  const highlightMatch = (text: string, queryStr: string) => {
    if (!queryStr?.trim()) return text;
    const parts = text?.split(new RegExp(`(${queryStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part?.toLowerCase() === queryStr?.toLowerCase() 
            ? <mark key={i} className="bg-yellow-200 text-slate-900 rounded-xs px-0.5 font-bold">{part}</mark>
            : part
        )}
      </span>
    );
  };

  // Load conversations from Supabase (or localStorage fallback)
  useEffect(() => {
    setIsListLoading(true);
    if (!isSupabaseConfigured || !user.id) {
      const saved = localStorage.getItem('dhoke_connect_chats');
      let loadedConversations: Conversation[] = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedConversations = parsed;
          } else {
            loadedConversations = INITIAL_CONVERSATIONS;
          }
        } catch (e) {
          loadedConversations = INITIAL_CONVERSATIONS;
        }
      } else {
        loadedConversations = INITIAL_CONVERSATIONS;
      }

      // Check URL parameters on mount to preload click-to-chat profile immediately
      const params = new URLSearchParams(window.location.search);
      const contactParam = params.get('contact');
      const nameParam = params.get('name');
      const avatarParam = params.get('avatar');

      if (contactParam && nameParam) {
        const resolvedContact = resolveMockContact(contactParam);
        const exists = loadedConversations.some(c => c.contact === resolvedContact);
        if (!exists) {
          const newConv: Conversation = {
            contact: resolvedContact,
            name: nameParam,
            avatar: avatarParam || undefined,
            lastMessage: isEn ? 'Click to start conversation' : 'بات چیت شروع کرنے کے لیے کلک کریں',
            time: 'Just now',
            timestamp: Date.now(),
            unreadCount: 0,
            isOnline: Math.random() > 0.4,
            messages: []
          };
          loadedConversations = [newConv, ...loadedConversations];
        }
      }

      setConversations(loadedConversations);
      localStorage.setItem('dhoke_connect_chats', JSON.stringify(loadedConversations));
      setIsListLoading(false);
      return;
    }

    async function loadRealChats() {
      try {
        const fetched = await dbGetConversations(user.id!);
        if (fetched && fetched.length > 0) {
          setConversations(mergeLocalAndDbChats(fetched));
        } else {
          setConversations(mergeLocalAndDbChats([]));
        }
      } finally {
        setIsListLoading(false);
      }
    }
    loadRealChats();
  }, [user.id]);

  // Real-time message subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user.id) return;

    const channel = supabase
      .channel(`chat-messages-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async (payload) => {
        const newMsg = payload.new;
        
        // Update local state without full reload
        setConversations(prev => {
          const exists = prev.some(c => c.id === newMsg.conversation_id);
          if (!exists) {
            // Load list in background if conversation is brand new
            dbGetConversations(user.id!).then(refreshed => setConversations(mergeLocalAndDbChats(refreshed)));
            return prev;
          }

          return prev.map(c => {
            if (c.id === newMsg.conversation_id) {
              const isMe = newMsg.sender_id === user.id;
              const mappedMsg: Message = {
                id: newMsg.id,
                sender: isMe ? 'me' : 'them',
                text: newMsg.message_text,
                time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date(newMsg.created_at).getTime(),
                status: 'delivered',
                isSeen: newMsg.is_seen,
                voice: newMsg.message_type === 'voice' && newMsg.media_url ? {
                  url: newMsg.media_url,
                  duration: newMsg.media_duration || 0,
                  size: newMsg.media_size,
                  waveformData: newMsg.waveform_data ? (typeof newMsg.waveform_data === 'string' ? JSON.parse(newMsg.waveform_data) : newMsg.waveform_data) : undefined,
                  uploadStatus: newMsg.upload_status || 'uploaded'
                } : undefined,
                attachment: (newMsg.message_type === 'image' || newMsg.message_type === 'file') && newMsg.media_url ? {
                  type: newMsg.message_type,
                  name: newMsg.message_text,
                  url: newMsg.media_url
                } : undefined
              };

              if (newMsg.message_type === 'image') {
                console.log("[CHAT IMAGE]", "Receiver mapping image:", mappedMsg.attachment?.url);
              }

              const alreadyExists = c.messages.some(m => m.id === newMsg.id);
              const updatedMessages = alreadyExists ? c.messages : [...c.messages, mappedMsg];
              const currentActiveContact = latestActiveContactRef.current;

              return {
                ...c,
                lastMessage: newMsg.message_text,
                time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date(newMsg.created_at).getTime(),
                unreadCount: (!isMe && currentActiveContact !== c.id) ? c.unreadCount + 1 : c.unreadCount,
                messages: updatedMessages
              };
            }
            return c;
          }).sort((a, b) => b.timestamp - a.timestamp);
        });

        // If the new message is in the active conversation and from the other user, mark as read
        const currentActiveContact = latestActiveContactRef.current;
        if (currentActiveContact && newMsg.conversation_id === currentActiveContact && newMsg.sender_id !== user.id) {
          try {
            const success = await dbMarkMessagesAsSeen(currentActiveContact, user.id!);
            if (!success) {
              console.error("Unread update failed");
            }
          } catch (err) {
            console.error("Unread update failed", err);
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const updatedMsg = payload.new;
        setConversations(prev => {
          return prev.map(c => {
            if (c.id === updatedMsg.conversation_id) {
              const updatedMessages = c.messages.map(m => {
                if (m.id === updatedMsg.id) {
                  return {
                    ...m,
                    isSeen: updatedMsg.is_seen
                  };
                }
                return m;
              });
              return {
                ...c,
                messages: updatedMessages
              };
            }
            return c;
          });
        });
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || err) {
          console.error("Realtime subscription failed", err || status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  // Mark active contact messages as read when activeContact changes
  useEffect(() => {
    if (!isSupabaseConfigured || !activeContact || !user.id) return;
    
    async function markRead() {
      try {
        const success = await dbMarkMessagesAsSeen(activeContact!, user.id!);
        if (success) {
          // Refresh conversations to reset unreadCount badge in UI
          const refreshed = await dbGetConversations(user.id!);
          setConversations(mergeLocalAndDbChats(refreshed));
        } else {
          console.error("Unread update failed");
        }
      } catch (err) {
        console.error("Unread update failed", err);
      }
    }
    markRead();
  }, [activeContact, user.id]);

  // 1. Sync active contact from URL query param (Supabase Mode)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user.id) return;

    const params = new URLSearchParams(window.location.search);
    const contactParam = params.get('contact');
    if (!contactParam) {
      setActiveContact(null);
      return;
    }

    async function resolveContactToConversation() {
      try {
        setIsListLoading(true);
        let targetConversationId = null;

        // Check if contactParam is a valid UUID
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(contactParam!);

        if (isUuid) {
          // Check if this is an existing conversation ID in the database
          const { data: convData, error: convError } = await supabase!
            .from('conversations')
            .select('id')
            .eq('id', contactParam)
            .limit(1);

          if (!convError && convData && convData.length > 0) {
            targetConversationId = convData[0].id;
          } else {
            // Not a conversation ID, treat it as a recipient user_id UUID
            const convId = await dbGetOrCreatePrivateConversation(user.id!, contactParam!);
            if (convId) {
              targetConversationId = convId;
            }
          }
        } else {
          // It is a name/contact string. We need to resolve it to a target user_id first.
          let targetUserId = null;
          
          // 1. Try to find by mobileNumber, email, username
          const foundUserId = await dbFindUserByContact(contactParam!);
          if (foundUserId) {
            targetUserId = foundUserId;
          } else {
            // 2. Try exact full_name match (case-insensitive)
            const { data: profile1 } = await supabase!
              .from('profiles')
              .select('user_id')
              .ilike('full_name', contactParam!)
              .limit(1);
            if (profile1 && profile1.length > 0) {
              targetUserId = profile1[0].user_id;
            } else {
              // 3. Try partial full_name match (e.g. first name only like 'saad')
              const { data: profile2 } = await supabase!
                .from('profiles')
                .select('user_id')
                .ilike('full_name', `%${contactParam}%`)
                .neq('user_id', user.id!) // exclude self
                .limit(1);
              if (profile2 && profile2.length > 0) {
                targetUserId = profile2[0].user_id;
              }
            }
          }

          if (targetUserId) {
            // Get or create conversation ID
            const convId = await dbGetOrCreatePrivateConversation(user.id!, targetUserId);
            if (convId) {
              targetConversationId = convId;
            }
          }
        }

        if (targetConversationId) {
          // Refresh conversations list to include new conversations immediately
           const refreshed = await dbGetConversations(user.id!);
           setConversations(mergeLocalAndDbChats(refreshed));
          
          if (activeContact !== targetConversationId) {
            setActiveContact(targetConversationId);
            
            const nameParam = params.get('name') || contactParam;
            const avatarParam = params.get('avatar') || '';
            const newUrl = `/chat/detail?contact=${encodeURIComponent(targetConversationId)}&name=${encodeURIComponent(nameParam)}${avatarParam ? `&avatar=${encodeURIComponent(avatarParam)}` : ''}`;
            window.history.replaceState({}, '', newUrl);
          }
        } else {
          // Fallback: If not found in Supabase (e.g. mock users like "Anas"), treat as local/mock conversation
          const nameParam = params.get('name');
          const avatarParam = params.get('avatar');
          const resolvedContact = resolveMockContact(contactParam!);
          const existingConv = conversations.find(c => c.contact === resolvedContact);

          if (nameParam || existingConv) {
            setActiveContact(resolvedContact);
            const exists = conversations.some(c => c.contact === resolvedContact);
            if (!exists && nameParam) {
              const newConv: Conversation = {
                contact: resolvedContact,
                name: nameParam,
                avatar: avatarParam || undefined,
                lastMessage: isEn ? 'Click to start conversation' : 'بات چیت شروع کرنے کے لیے کلک کریں',
                time: 'Just now',
                timestamp: Date.now(),
                unreadCount: 0,
                isOnline: Math.random() > 0.4,
                messages: []
              };
              setConversations(prev => [newConv, ...prev]);
            }
          } else {
            setActiveContact(null);
          }
        }
      } catch (err) {
        console.error("Error in resolveContactToConversation:", err);
        setActiveContact(null);
      } finally {
        setIsListLoading(false);
      }
    }
    
    resolveContactToConversation();
  }, [window.location.search, currentPath, user.id, isSupabaseConfigured]);

  // 2. Sync active contact from URL query param (LocalStorage Mode Fallback)
  useEffect(() => {
    if (isSupabaseConfigured && supabase) return;

    const params = new URLSearchParams(window.location.search);
    const contactParam = params.get('contact');
    if (!contactParam) {
      setActiveContact(null);
      return;
    }

    const resolvedContact = resolveMockContact(contactParam);
    setActiveContact(resolvedContact);

    // Handle query params containing new contact information
    const nameParam = params.get('name');
    const avatarParam = params.get('avatar');
    
    if (nameParam) {
      const exists = conversations.some(c => c.contact === resolvedContact);
      if (!exists) {
        const newConv: Conversation = {
          contact: resolvedContact,
          name: nameParam,
          avatar: avatarParam || undefined,
          lastMessage: isEn ? 'Click to start conversation' : 'بات چیت شروع کرنے کے لیے کلک کریں',
          time: 'Just now',
          timestamp: Date.now(),
          unreadCount: 0,
          isOnline: Math.random() > 0.4,
          messages: []
        };
        const updated = [newConv, ...conversations];
        setConversations(updated);
        localStorage.setItem('dhoke_connect_chats', JSON.stringify(updated));
      }
    }

    // Mark unread as read
    markAsRead(resolvedContact);
  }, [window.location.search, currentPath, conversations.length, isSupabaseConfigured]);

  // Presence & Broadcast (Online Status & Typing Indicator)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user.id) return;

    const presenceChannel = supabase
      .channel('online-presence', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

    presenceChannelRef.current = presenceChannel;

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const online: { [userId: string]: { online_at: string } } = {};
        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          if (presences && presences.length > 0) {
            online[key] = { online_at: presences[0].online_at || new Date().toISOString() };
          }
        });
        setOnlineUsers(online);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, conversationId, isTyping } = payload.payload;
        setTypingUsers(prev => {
          const convTyping = prev[conversationId] || {};
          return {
            ...prev,
            [conversationId]: {
              ...convTyping,
              [userId]: isTyping
            }
          };
        });
      })
      .subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') {
          try {
            await presenceChannel.track({
              online_at: new Date().toISOString()
            });
          } catch (e) {
            console.error("Presence update failed", e);
          }
        }
        if (status === 'CHANNEL_ERROR' || err) {
          console.error("Realtime subscription failed", err || status);
        }
      });

    // Track tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        presenceChannel.track({ online_at: new Date().toISOString() }).catch((err) => {
          console.error("Presence update failed", err);
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (presenceChannelRef.current) {
        presenceChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: user.id,
            conversationId: latestActiveContactRef.current || '',
            isTyping: false
          }
        }).catch(() => {});
      }
      supabase.removeChannel(presenceChannel);
    };
  }, [user.id]);

  // Expose total unread count to global window so navigation badges can display it
  useEffect(() => {
    // Do not dispatch while the conversation list is still loading from Supabase.
    // Dispatching 0 during the loading phase would incorrectly clear the badge
    // before the real data arrives.
    if (isListLoading) return;
    const getUnreadCount = () => {
      return conversations.reduce((acc, c) => acc + c.unreadCount, 0);
    };
    (window as any).getUnreadCount = getUnreadCount;
    // Dispatch a custom event to alert AppShell that unread count has changed
    window.dispatchEvent(new CustomEvent('unread-count-changed', { detail: getUnreadCount() }));
  }, [conversations, isListLoading]);

  // Expose dynamic openChat function globally so existing modules can invoke it directly
  useEffect(() => {
    const openChat = async (contact: string, name: string, avatar?: string, firstMessage?: string) => {
      const resolvedContact = resolveMockContact(contact);
      if (!isSupabaseConfigured || !user.id) {
        // LocalStorage Fallback logic
        setConversations(prev => {
          const exists = prev.some(c => c.contact === resolvedContact);
          let updated = [...prev];
          if (!exists) {
            const newConv: Conversation = {
              contact: resolvedContact,
              name,
              avatar: avatar || undefined,
              lastMessage: firstMessage || (isEn ? 'Click to start conversation' : 'بات چیت شروع کرنے کے لیے کلک کریں'),
              time: 'Just now',
              timestamp: Date.now(),
              unreadCount: 0,
              isOnline: true,
              messages: firstMessage ? [{
                id: `m-first-${Date.now()}`,
                sender: 'me',
                text: firstMessage,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now()
              }] : []
            };
            updated = [newConv, ...prev];
          }
          updated = updated.map(c => c.contact === resolvedContact ? { ...c, unreadCount: 0 } : c);
          localStorage.setItem('dhoke_connect_chats', JSON.stringify(updated));
          return updated;
        });

        const url = `/chat/detail?contact=${encodeURIComponent(resolvedContact)}&name=${encodeURIComponent(name)}${avatar ? `&avatar=${encodeURIComponent(avatar)}` : ''}`;
        window.history.pushState({}, '', url);
        window.dispatchEvent(new Event('popstate'));
        return;
      }

      // Supabase logic
      try {
        let conversationId = contact;
        // Check if contact is a conversation ID in current list
        let exists = conversations.some(c => c.id === contact);
        let wasCreated = false;
        
        if (!exists) {
          // It's not a conversation ID, check if it's a user ID or contact string
          let targetUserId = contact;
          const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(contact);
          
          if (!isUuid) {
            const foundUserId = await dbFindUserByContact(contact);
            if (foundUserId) {
              targetUserId = foundUserId;
            } else {
              // Case-insensitive exact match
              const { data: p1 } = await supabase!
                .from('profiles')
                .select('user_id')
                .ilike('full_name', contact)
                .limit(1);
              if (p1 && p1.length > 0) {
                targetUserId = p1[0].user_id;
              } else {
                // Partial first-name match
                const { data: p2 } = await supabase!
                  .from('profiles')
                  .select('user_id')
                  .ilike('full_name', `%${contact}%`)
                  .neq('user_id', user.id!)
                  .limit(1);
                targetUserId = (p2 && p2.length > 0) ? p2[0].user_id : '';
              }
            }
          }
          
          // Get or create conversation ID
          if (targetUserId) {
            const convId = await dbGetOrCreatePrivateConversation(user.id!, targetUserId);
            if (convId) {
              conversationId = convId;
              wasCreated = true;
            }
          }
        }

        // If firstMessage is passed, send it automatically if chat was just created or is empty
        if (firstMessage && firstMessage?.trim()) {
          const existingConv = conversations.find(c => c.id === conversationId);
          const hasMessages = existingConv && existingConv.messages && existingConv.messages.length > 0;
          if (!hasMessages || wasCreated) {
            await dbSendMessage(conversationId, user.id!, firstMessage?.trim(), 'text');
          }
        }

        // Refresh conversation list from Supabase
        const refreshed = await dbGetConversations(user.id!);
        setConversations(mergeLocalAndDbChats(refreshed));

        // Navigate
        const url = `/chat/detail?contact=${encodeURIComponent(conversationId)}&name=${encodeURIComponent(name)}${avatar ? `&avatar=${encodeURIComponent(avatar)}` : ''}`;
        window.history.pushState({}, '', url);
        window.dispatchEvent(new Event('popstate'));
      } catch (err) {
        console.error("Error in openChat:", err);
      }
    };
    (window as any).openChat = openChat;
    console.log('[TRACE] window.openChat registered. user.id:', user.id);
  }, [isEn, user.id, conversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContact, conversations, isTyping]);

  const markAsRead = (contact: string) => {
    setConversations(prev => {
      const updated = prev.map(c => 
        c.contact === contact ? { ...c, unreadCount: 0 } : c
      );
      localStorage.setItem('dhoke_connect_chats', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectConversation = (conv: Conversation) => {
    markAsRead(conv.contact);
    const url = `/chat/detail?contact=${encodeURIComponent(conv.contact)}&name=${encodeURIComponent(conv.name)}${conv.avatar ? `&avatar=${encodeURIComponent(conv.avatar)}` : ''}`;
    window.history.pushState({}, '', url);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleBackToList = () => {
    window.history.pushState({}, '', '/chat');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText?.trim() || !activeContact) return;

    // Reset typing indicator states on send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isCurrentlyTypingRef.current) {
      isCurrentlyTypingRef.current = false;
      if (presenceChannelRef.current) {
        presenceChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: user.id,
            conversationId: activeContact,
            isTyping: false
          }
        }).catch(() => {});
      }
    }

    const currentMsgText = inputText?.trim();
    setInputText('');

    if (!isSupabaseConfigured || !user.id || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(activeContact)) {
      // LocalStorage Fallback logic
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newMsg: Message = {
        id: `m-sent-${Date.now()}`,
        sender: 'me',
        text: currentMsgText,
        time: timeStr,
        timestamp: Date.now()
      };

      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.contact === activeContact) {
            return {
              ...c,
              lastMessage: currentMsgText,
              time: timeStr,
              timestamp: Date.now(),
              messages: [...c.messages, newMsg]
            };
          }
          return c;
        });
        localStorage.setItem('dhoke_connect_chats', JSON.stringify(updated));
        return updated;
      });

      // Simulate smart reply after 1.5 seconds
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyText = getSimulatedReply(activeContact, currentMsgText);
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const replyMsg: Message = {
          id: `m-recv-${Date.now()}`,
          sender: 'them',
          text: replyText,
          time: replyTime,
          timestamp: Date.now()
        };

        setConversations(prev => {
          const updated = prev.map(c => {
            if (c.contact === activeContact) {
              return {
                ...c,
                lastMessage: replyText,
                time: replyTime,
                timestamp: Date.now(),
                messages: [...c.messages, replyMsg]
              };
            }
            return c;
          });
          localStorage.setItem('dhoke_connect_chats', JSON.stringify(updated));
          return updated;
        });
      }, 1500);
      return;
    }

    // Supabase logic
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(activeContact);
    if (!isUuid) {
      const error = new Error(`Cannot send message: activeContact "${activeContact}" is not a valid UUID conversation ID`);
      console.error("[CHAT ERROR]", error);
      return;
    }

    try {
      // Write to database first before modifying UI state
      const dbMsg = await dbSendMessage(activeContact, user.id!, currentMsgText, 'text');
      if (dbMsg) {
        const now = new Date(dbMsg.created_at);
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const newMsg: Message = {
          id: dbMsg.id,
          sender: 'me',
          text: dbMsg.message_text,
          time: timeStr,
          timestamp: now.getTime(),
          status: 'delivered'
        };

        setConversations(prev => {
          return prev.map(c => {
            if (isChatMatch(c, activeContact)) {
              return {
                ...c,
                lastMessage: currentMsgText,
                time: timeStr,
                timestamp: now.getTime(),
                messages: [...c.messages, newMsg]
              };
            }
            return c;
          }).sort((a, b) => b.timestamp - a.timestamp);
        });
        console.log("[CHAT]", "Text message sent successfully");
      } else {
        const error = new Error("dbSendMessage returned null message response");
        console.error("[CHAT ERROR]", error);
      }
    } catch (err) {
      console.error("[CHAT ERROR]", err);
    }
  };

  // Simulated context-aware reply generator
  const getSimulatedReply = (contact: string, userMsg: string): string => {
    const msg = userMsg?.toLowerCase();
    
    // Malik Shakeel replies
    if (contact === '0321-5551234') {
      if (msg.includes('shukriya') || msg.includes('thanks') || msg.includes('thank')) {
        return isEn ? "You're welcome! Feel free to visit the shop anytime before 9:00 PM." : "خوش آمدید! رات 9 بجے سے پہلے کسی بھی وقت دکان تشریف لے آئیں۔";
      }
      if (msg.includes('price') || msg.includes('kya rate') || msg.includes('stitching') || msg.includes('silo')) {
        return isEn ? "Simple suit stitching starts from 1,200 PKR. Designer suit stitching rates are slightly higher." : "سادہ سوٹ کی سلائی 1200 روپے سے شروع ہوتی ہے۔ ڈیزائنر سوٹس کے ریٹس مختلف ہیں۔";
      }
      return isEn ? "Ji bilkul, main check kar k aap ko mazeed update bhejta hun. JazakAllah!" : "جی بالکل، میں چیک کر کے آپ کو مزید اپڈیٹ بھیجتا ہوں۔ جزاک اللہ!";
    }

    // Ayesha Siddiqui replies
    if (contact === '0344-1234567') {
      if (msg.includes('timing') || msg.includes('kab') || msg.includes('time')) {
        return isEn ? "The medical camp runs from 9:00 AM to 4:00 PM this Sunday." : "میڈیکل کیمپ اس اتوار صبح 9:00 بجے سے شام 4:00 بجے تک چلے گا۔";
      }
      return isEn ? "Aap camp me direct tashreef layein, parchi counter se registration free hai." : "آپ کیمپ میں ڈائریکٹ تشریف لائیں، پرچی کاؤنٹر سے رجسٹریشن بالکل فری ہے۔";
    }

    // Chaudhary Kamran replies
    if (contact === '0345-1234567') {
      if (msg.includes('pani') || msg.includes('water') || msg.includes('motor')) {
        return isEn ? "Pani ka pressure subah 6 se 8 baje tk full ho ga. Apni tanki pehle check kr lein." : "پانی کا پریشر صبح 6 سے 8 بجے تک فل ہوگا۔ اپنی ٹینکی پہلے ہی چیک کر لیں۔";
      }
      return isEn ? "Ji thik hai, main municipal office se mazeed confirm kr k btata hun." : "جی ٹھیک ہے، میں میونسپل آفس سے مزید تصدیق کر کے بتاتا ہوں۔";
    }

    // Default generic response
    return isEn 
      ? "Thank you for your message. I am currently out but will reply shortly. JazakAllah!"
      : "پیغام بھیجنے کا شکریہ۔ میں ابھی مصروف ہوں، تھوڑی دیر میں جواب دوں گا۔ جزاک اللہ!";
  };

  // === REAL ATTACHMENT HANDLER ===
  const handleAttachmentClick = () => {
    if (!activeContact) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeContact || !user.id || !isSupabaseConfigured) return;
    
    const file = e.target.files[0];
    e.target.value = ''; // Reset
    
    console.log("[CHAT IMAGE]", "Selected file:", file.name, file.type);
    
    const isImage = file.type.startsWith('image/');
    const type = isImage ? 'image' : 'file';

    setIsUploadingAttachment(true);
    console.log("[CHAT IMAGE]", "Upload started");
    
    try {
      // 1. Upload to Supabase Storage
      const { dbUploadChatAttachment } = await import('../utils/supabaseClient');
      const uploadRes = await dbUploadChatAttachment(user.id, activeContact, file, file.name);
      
      if (!uploadRes) {
        throw new Error("Attachment upload failed");
      }

      console.log("[CHAT IMAGE]", "Message object before saving:", {
        activeContact,
        senderId: user.id,
        text: file.name,
        type,
        mediaUrl: uploadRes.url,
        mediaSize: uploadRes.size
      });

      // 2. Send Message
      const dbMsg = await dbSendMessage(activeContact, user.id, file.name, type, uploadRes.url, undefined, uploadRes.size);
      
      if (dbMsg) {
        const now = new Date(dbMsg.created_at);
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const newMsg: Message = {
          id: dbMsg.id,
          sender: 'me',
          text: file.name,
          time: timeStr,
          timestamp: now.getTime(),
          status: 'delivered',
          attachment: {
            type,
            name: file.name,
            url: uploadRes.url
          }
        };

        console.log("[CHAT IMAGE]", "Message object after saving:", newMsg);

        setConversations(prev => prev.map(c => {
          if (isChatMatch(c, activeContact)) {
            return {
              ...c,
              lastMessage: isImage ? '📷 Photo' : '📎 Attachment',
              time: timeStr,
              timestamp: now.getTime(),
              messages: [...c.messages, newMsg]
            };
          }
          return c;
        }).sort((a, b) => b.timestamp - a.timestamp));

        console.log("[CHAT IMAGE]", "Attachment handled successfully");
      } else {
        throw new Error("dbSendMessage returned null attachment response");
      }
    } catch (err) {
      console.error("[CHAT IMAGE]", err);
    } finally {
      setIsUploadingAttachment(false);
    }
  };
  // ================================

  // === CAMERA & VOICE LOGIC ===
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("[CHAT ERROR]", "Camera permission denied or not available", err);
      // Fallback to file input
      if (fileInputRef.current) fileInputRef.current.click();
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
    }
    setCameraStream(null);
    setShowCamera(false);
    setCameraPhotoUrl(null);
    setCameraPhotoBlob(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCameraPhotoBlob(blob);
        setCameraPhotoUrl(url);
      }
    }, 'image/jpeg', 0.85);
  };

  const sendCapturedPhoto = async () => {
    if (!cameraPhotoBlob || !activeContact || !user.id || !isSupabaseConfigured) return;
    
    const file = new File([cameraPhotoBlob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    setIsUploadingAttachment(true);
    closeCamera(); // Close UI immediately for better UX
    
    try {
      const { dbUploadChatAttachment } = await import('../utils/supabaseClient');
      const uploadRes = await dbUploadChatAttachment(user.id, activeContact, file, file.name);
      
      if (!uploadRes) throw new Error("Camera image upload failed");

      const dbMsg = await dbSendMessage(activeContact, user.id, '📷 Photo', 'image', uploadRes.url, undefined, uploadRes.size);
      
      if (dbMsg) {
        const now = new Date(dbMsg.created_at);
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsg: Message = {
          id: dbMsg.id, sender: 'me', text: '📷 Photo', time: timeStr, timestamp: now.getTime(), status: 'delivered',
          attachment: { type: 'image', name: file.name, url: uploadRes.url }
        };
        setConversations(prev => prev.map(c => isChatMatch(c, activeContact) ? {
          ...c, lastMessage: '📷 Photo', time: timeStr, timestamp: now.getTime(), messages: [...c.messages, newMsg]
        } : c).sort((a, b) => b.timestamp - a.timestamp));
        console.log("[CHAT]", "Camera image sent successfully");
      }
    } catch (err) {
      console.error("[CHAT ERROR]", err);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setVoiceBlob(audioBlob);
        setVoicePreviewUrl(URL.createObjectURL(audioBlob));
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("[CHAT ERROR]", "Mic permission denied or not available", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setVoiceBlob(null);
    setVoicePreviewUrl(null);
    setRecordingDuration(0);
  };

  const sendVoiceMessage = async () => {
    if (!voiceBlob || !activeContact || !user.id || !isSupabaseConfigured) return;
    
    setIsUploadingAttachment(true);
    const audioBlobToUpload = voiceBlob;
    const dur = recordingDuration;
    
    cancelRecording(); // Reset UI
    
    try {
      const uploadUrl = await dbUploadVoiceMessage(user.id, activeContact, audioBlobToUpload);
      if (!uploadUrl) throw new Error("Voice upload failed");
      
      const dbMsg = await dbSendMessage(activeContact, user.id, '🎤 Voice Message', 'voice', uploadUrl, dur, audioBlobToUpload.size);
      
      if (dbMsg) {
        const now = new Date(dbMsg.created_at);
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsg: Message = {
          id: dbMsg.id, sender: 'me', text: '🎤 Voice Message', time: timeStr, timestamp: now.getTime(), status: 'delivered',
          voice: { url: uploadUrl, duration: dur, size: audioBlobToUpload.size, uploadStatus: 'uploaded' }
        };
        setConversations(prev => prev.map(c => isChatMatch(c, activeContact) ? {
          ...c, lastMessage: '🎤 Voice Message', time: timeStr, timestamp: now.getTime(), messages: [...c.messages, newMsg]
        } : c).sort((a, b) => b.timestamp - a.timestamp));
        console.log("[CHAT]", "Voice message sent successfully");
      }
    } catch (err) {
      console.error("[CHAT ERROR]", err);
    } finally {
      setIsUploadingAttachment(false);
    }
  };
  // ==========================

  // Filter conversations based on search input
  const filteredConversations = conversations.filter(c => 
    c.name?.toLowerCase().includes(searchQuery?.toLowerCase()) || 
    c.contact.includes(searchQuery) ||
    c.lastMessage?.toLowerCase().includes(searchQuery?.toLowerCase())
  );

  const activeConv = conversations.find(c => isChatMatch(c, activeContact));

  const t = {
    en: {
      messages: "Messages",
      searchPlaceholder: "Search conversations...",
      noChats: "No conversations found",
      typeMessage: "Type a message...",
      online: "Active now",
      offline: "Offline",
      selectChat: "Select a chat to view discussion details",
      attachment: "Attachment",
      back: "Back",
      placeholder: "Start your communication securely"
    },
    ur: {
      messages: "پیغامات",
      searchPlaceholder: "بات چیت تلاش کریں...",
      noChats: "کوئی چیٹ نہیں ملی",
      typeMessage: "پیغام ٹائپ کریں...",
      online: "آن لائن",
      offline: "آف لائن",
      selectChat: "گفتگو دیکھنے کے لیے کسی چیٹ کا انتخاب کریں",
      attachment: "منسلک کریں",
      back: "واپس",
      placeholder: "محفوظ طریقے سے اپنی بات چیت شروع کریں"
    }
  };

  const renderConversationCard = (conv: Conversation, isPinned = false) => {
    const isSelected = activeContact === conv.contact;
    const hasUnread = conv.unreadCount > 0;
    return (
      <div
        key={conv.contact}
        onClick={() => handleSelectConversation(conv)}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors relative ${
          isSelected 
            ? 'bg-[#E9EDEF]' 
            : 'bg-white hover:bg-[#F5F6F6]'
        }`}
        id={`conversation-card-${conv.contact}`}
      >
        {/* Avatar with Online indicator */}
        <div className="relative shrink-0 select-none">
          <ClickableAvatar 
            userId={conv.recipientId || conv.contact}
            name={conv.name}
            avatar={conv.avatar}
            size={48}
          />
        </div>

        {/* Message Metadata */}
        <div className="flex-1 min-w-0 border-b border-[#F0F2F5] pb-3 -mb-3">
          <div className="flex justify-between items-baseline mb-0.5">
            <h4 className="font-semibold text-[#111B21] text-base truncate">
              {conv.name}
            </h4>
            <span className={`text-xs whitespace-nowrap ml-2 ${hasUnread ? 'text-[#25D366] font-medium' : 'text-[#667781]'}`}>
              {conv.time}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            {(() => {
              const convTyping = typingUsers[conv.id || ''] || {};
              const isOtherTyping = Object.keys(convTyping).some(uid => uid !== user.id && convTyping[uid] === true);
              
              return (
                <p className={`text-sm truncate flex-1 ${hasUnread ? 'text-[#111B21] font-medium' : 'text-[#667781]'}`}>
                  {isOtherTyping ? (
                    <span className="text-[#25D366] font-medium animate-pulse">
                      {isEn ? 'typing...' : 'ٹائپ کر رہا ہے...'}
                    </span>
                  ) : (
                    conv.lastMessage
                  )}
                </p>
              );
            })()}
            
            <div className="flex items-center gap-1.5 shrink-0">
              {isPinned && (
                <Pin className="w-3.5 h-3.5 text-[#8696A0] rotate-45" />
              )}
              {/* Unread Count Badge */}
              {hasUnread && (
                <span className="bg-[#25D366] text-white text-[11px] font-bold rounded-full min-w-[20px] h-[20px] px-1 flex items-center justify-center leading-none shadow-sm">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currentT = isEn ? t.en : t.ur;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md h-[calc(100vh-140px)] flex overflow-hidden relative" id="chat-module-container">
      
      {/* LEFT COLUMN: CHAT LIST (Hidden on mobile if activeContact is open) */}
      <div className={`w-full md:w-[300px] lg:w-[320px] border-r border-slate-100 flex flex-col shrink-0 ${activeContact ? 'hidden md:flex' : 'flex'}`} id="chat-list-column">
        
        {/* WhatsApp-style Header Area */}
        <div className="bg-[#F0F2F5] pt-4 pb-2 px-4 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#111B21]">
              {currentT.messages}
            </h2>
            <div className="flex items-center gap-4 text-[#54656F]">
              {conversations.length > 0 && (
                <button
                  onClick={async () => {
                    if (confirm(isEn ? "Are you sure you want to delete all conversations?" : "کیا آپ تمام گفتگو حذف کرنا چاہتے ہیں؟")) {
                      if (isSupabaseConfigured && user.id) {
                        await dbClearAllConversations(user.id);
                      }
                      setConversations([]);
                      localStorage.setItem('dhoke_connect_chats', JSON.stringify([]));
                      setActiveContact(null);
                      window.history.pushState({}, '', '/chat');
                      window.dispatchEvent(new Event('popstate'));
                    }
                  }}
                  className="p-2 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer border-0 bg-transparent text-[#54656F]"
                  title={isEn ? "Clear All" : "تمام حذف کریں"}
                >
                  <Trash2 size={20} />
                </button>
              )}
              <div className="p-2 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer">
                <MoreVertical size={20} />
              </div>
            </div>
          </div>
          
          {/* WhatsApp-style Search Bar */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1 bg-white rounded-lg flex items-center px-3 border border-slate-200/50 shadow-sm">
              <Search size={18} className="text-[#54656F]" />
              <input
                type="text"
                value={tempSearchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setTempSearchQuery(val);
                  if (val && !isSearchActive) setIsSearchActive(true);
                }}
                placeholder={isEn ? "Search or start new chat" : "تلاش کریں یا نئی چیٹ شروع کریں"}
                className="w-full bg-transparent border-0 outline-none text-sm text-[#111B21] placeholder:text-[#54656F] py-2 pl-3"
              />
            </div>
            {isSearchActive && (
              <button
                onClick={() => {
                  setIsSearchActive(false);
                  setTempSearchQuery('');
                  setSearchQuery('');
                }}
                className="text-sm text-[#54656F] hover:text-[#111B21] transition-colors border-0 bg-transparent cursor-pointer shrink-0"
              >
                {isEn ? 'Cancel' : 'منسوخ'}
              </button>
            )}
          </div>
        </div>

        {/* Search Filter pills */}
        {isSearchActive && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2 border-b border-slate-100 shrink-0 px-4">
            {[
              { key: 'all', en: 'All', ur: 'تمام' },
              { key: 'people', en: 'People', ur: 'لوگ' },
              { key: 'conversations', en: 'Chats', ur: 'چیٹس' },
              { key: 'messages', en: 'Messages', ur: 'پیغامات' },
              { key: 'groups', en: 'Groups', ur: 'گروپس' },
              { key: 'unread', en: 'Unread', ur: 'ان پڑھی' }
            ].map((pill) => {
              const isActive = searchFilter === pill.key;
              return (
                <button
                  key={pill.key}
                  onClick={() => setSearchFilter(pill.key as any)}
                  className={`py-1.5 px-3.5 rounded-full text-[10px] font-black tracking-wider transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                    isActive 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isEn ? pill.en : pill.ur}
                </button>
              );
            })}
          </div>
        )}

        {/* Search Results Overlay OR Regular Chats List */}
        {isSearchActive ? (
          <div className="flex-1 overflow-y-auto bg-slate-50/20 p-3 space-y-5" id="chat-search-results-panel">
            {/* A. If query is empty -> show Recent Searches */}
            {tempSearchQuery?.trim().length < 2 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {isEn ? 'Recent Searches' : 'حالیہ تلاشیں'}
                  </h4>
                  {recentSearches.length > 0 && (
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem('dh_chat_recent_searches');
                      }}
                      className="text-[10px] font-extrabold text-blue-600 border-0 bg-transparent cursor-pointer"
                    >
                      {isEn ? 'Clear All' : 'صاف کریں'}
                    </button>
                  )}
                </div>

                {recentSearches.length === 0 ? (
                  <p className="text-[11px] text-slate-400 font-semibold text-center py-6">
                    {isEn ? 'No recent searches' : 'کوئی حالیہ تلاش نہیں ہے'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {recentSearches.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 hover:bg-slate-100 rounded-xl cursor-pointer group"
                      >
                        <span 
                          onClick={() => setTempSearchQuery(s)}
                          className="text-xs font-semibold text-slate-700 flex items-center gap-2"
                        >
                          🔍 {s}
                        </span>
                        <button
                          onClick={() => {
                            setRecentSearches(prev => {
                              const updated = prev.filter(item => item !== s);
                              localStorage.setItem('dh_chat_recent_searches', JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity border-0 bg-transparent cursor-pointer text-xs font-black"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : isSearchLoading ? (
              // Search Shimmer Loader
              <div className="space-y-4 pt-2">
                {[1, 2, 3].map(idx => (
                  <div key={idx} className="flex gap-3 items-center p-2.5 bg-white border border-slate-100 rounded-2xl">
                    <AppSkeleton variant="circular" className="w-10 h-10 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <AppSkeleton variant="text" className="w-1/3 h-3" />
                      <AppSkeleton variant="text" className="w-2/3 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // B. If query has input -> show matching sections
              <div className="space-y-5">
                {/* 1. People Section */}
                {(searchFilter === 'all' || searchFilter === 'people') && searchResults.people.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      👤 {isEn ? 'People' : 'لوگ'}
                    </h4>
                    <div className="space-y-2">
                      {searchResults.people.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setIsSearchActive(false);
                            setTempSearchQuery('');
                            if ((window as any).openChat) {
                              // For real Supabase users, p.id is the user UUID.
                              // Pass the UUID so openChat creates a real conversation
                              // and handleSendMessage routes through the Supabase path.
                              const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(p.id);
                              const contactParam = isUuid ? p.id : p.contact;
                              (window as any).openChat(contactParam, p.name, p.avatar);
                            } else {
                              setActiveContact(p.id);
                            }
                          }}
                          className="flex items-center gap-3 p-2.5 bg-white border border-slate-100 hover:border-slate-300 rounded-2xl cursor-pointer transition-all shadow-xs"
                        >
                          <div 
                            className="cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 rounded-full transition-all shrink-0"
                            data-profile-name={p.name}
                            data-profile-avatar={p.avatar || ''}
                          >
                            {p.avatar ? (
                              <img src={p.avatar} alt="" className="w-9 h-9 rounded-full object-cover border" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                {p.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h5 className="text-xs font-extrabold text-slate-900">
                              {highlightMatch(p.name, searchQuery)}
                            </h5>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{p.contact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Conversations Section */}
                {(searchFilter === 'all' || searchFilter === 'conversations' || searchFilter === 'groups' || searchFilter === 'unread') && searchResults.conversations.filter(c => {
                  if (searchFilter === 'unread' && c.unreadCount === 0) return false;
                  const isGroup = c.name?.toLowerCase().includes('group') || c.name.includes('Met') || c.name.includes('SNGPL') || c.name.includes('Camp');
                  if (searchFilter === 'groups' && !isGroup) return false;
                  return true;
                }).length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      💬 {isEn ? 'Chats' : 'چیٹس'}
                    </h4>
                    <div className="space-y-2">
                      {searchResults.conversations.filter(c => {
                        if (searchFilter === 'unread' && c.unreadCount === 0) return false;
                        const isGroup = c.name?.toLowerCase().includes('group') || c.name.includes('Met') || c.name.includes('SNGPL') || c.name.includes('Camp');
                        if (searchFilter === 'groups' && !isGroup) return false;
                        return true;
                      }).map((c) => (
                        <div
                          key={c.contact}
                          onClick={() => {
                            setIsSearchActive(false);
                            setTempSearchQuery('');
                            handleSelectConversation(c);
                          }}
                          className="flex items-center gap-3 p-2.5 bg-white border border-slate-100 hover:border-slate-300 rounded-2xl cursor-pointer transition-all shadow-xs relative"
                        >
                          <div 
                            className="cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 rounded-full transition-all shrink-0"
                            data-profile-name={c.name}
                            data-profile-avatar={c.avatar || ''}
                          >
                            {c.avatar ? (
                              <img src={c.avatar} alt="" className="w-9 h-9 rounded-full object-cover border" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                {c.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <h5 className="text-xs font-extrabold text-slate-900 truncate">
                              {highlightMatch(c.name, searchQuery)}
                            </h5>
                            <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                              {highlightMatch(c.lastMessage, searchQuery)}
                            </p>
                          </div>
                          {c.unreadCount > 0 && (
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Messages Section */}
                {(searchFilter === 'all' || searchFilter === 'messages') && searchResults.messages.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      📝 {isEn ? 'Messages' : 'پیغامات'}
                    </h4>
                    <div className="space-y-2">
                      {searchResults.messages.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setIsSearchActive(false);
                            setTempSearchQuery('');
                            
                            const matchedConv = conversations.find(c => c.id === m.conversationId || c.contact === m.conversationId);
                            if (matchedConv) {
                              handleSelectConversation(matchedConv);
                            } else {
                              if ((window as any).openChat) {
                                (window as any).openChat(m.conversationId, m.senderName, m.senderAvatar);
                              }
                            }
                            setJumpToMessageId(m.id);
                          }}
                          className="flex items-start gap-3 p-3 bg-white border border-slate-100 hover:border-slate-300 rounded-2xl cursor-pointer transition-all shadow-xs"
                        >
                          <div 
                            className="cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 rounded-full transition-all shrink-0 mt-0.5"
                            data-profile-name={m.senderName}
                            data-profile-avatar={m.senderAvatar || ''}
                          >
                            {m.senderAvatar ? (
                              <img src={m.senderAvatar} alt="" className="w-8 h-8 rounded-full object-cover border" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                                {m.senderName?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <span className="text-[10px] font-black text-slate-800 truncate">{m.conversationName}</span>
                              <span className="text-[8px] text-slate-400 font-bold whitespace-nowrap ml-2">{m.time}</span>
                            </div>
                            <span className="text-[9px] font-extrabold text-blue-600 block mb-0.5">{m.senderName}:</span>
                            <p className="text-[10px] text-slate-500 font-semibold leading-normal break-words">
                              {highlightMatch(m.text, searchQuery)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {searchResults.people.length === 0 && searchResults.conversations.length === 0 && searchResults.messages.length === 0 && (
                  <div className="text-center py-12 space-y-3" id="chat-search-empty-state">
                    <div className="w-14 h-14 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner text-xl">
                      🔍
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-slate-800">
                        {isEn ? 'No conversations or messages found' : 'کوئی بات چیت یا پیغام نہیں ملا'}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                        {isEn ? 'Try adjusting filters or checking query spelling.' : 'فلٹرز تبدیل کریں یا املا دوبارہ چیک کریں۔'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* List of Conversations */
          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/20" id="conversations-list-container">
            {isListLoading ? (
              // List Shimmer Skeletons
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="flex gap-3 items-center p-3 bg-white border border-slate-100 rounded-2xl">
                    <AppSkeleton variant="circular" className="w-11 h-11 shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="flex justify-between">
                        <AppSkeleton variant="text" className="w-1/3 h-3" />
                        <AppSkeleton variant="text" className="w-12 h-2" />
                      </div>
                      <AppSkeleton variant="text" className="w-2/3 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold text-xs">
                📂 {currentT.noChats}
              </div>
            ) : (() => {
              const pinnedConversations = filteredConversations.filter(c => c.contact === '0321-5551234');
              const otherConversations = filteredConversations.filter(c => c.contact !== '0321-5551234');
              
              return (
                <div className="space-y-4">
                  {/* Pinned section if they exist */}
                  {pinnedConversations.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 px-3 mb-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Pin className="w-3 h-3 rotate-45 text-blue-600" /> {isEn ? 'Pinned' : 'پن شدہ'}
                      </div>
                      {pinnedConversations.map(conv => renderConversationCard(conv, true))}
                    </div>
                  )}
                  
                  {/* All chats section */}
                  {otherConversations.length > 0 && (
                    <div className="space-y-1">
                      {pinnedConversations.length > 0 && (
                        <div className="px-3 mb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-100">
                          {isEn ? 'Recent Chats' : 'حالیہ چیٹس'}
                        </div>
                      )}
                      {otherConversations.map(conv => renderConversationCard(conv, false))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: CHAT DETAIL (Hidden on mobile if no activeContact is selected) */}
      <div className={`flex-1 flex flex-col bg-white ${activeContact ? 'flex' : 'hidden md:flex'}`} id="chat-detail-column">
        
        {activeConv ? (
          <>
            {/* Detail Header */}
            <div className="h-[60px] w-full px-4 py-2.5 flex items-center justify-between bg-[#F0F2F5] sticky top-0 z-10 shrink-0 box-border border-l border-[#D1D7DB]" id="chat-detail-header">
              <div className="flex items-center flex-1 min-w-0 mr-4 cursor-pointer" onClick={() => {
                const resolvedId = activeConv.recipientId || activeConv.contact || activeConv.name;
                const url = `/profile/${encodeURIComponent(resolvedId)}?name=${encodeURIComponent(activeConv.name)}${activeConv.avatar ? `&avatar=${encodeURIComponent(activeConv.avatar)}` : ''}`;
                window.history.pushState({}, '', url);
                window.dispatchEvent(new Event('popstate'));
              }}>
                {/* Mobile Back Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBackToList();
                  }}
                  className="md:hidden p-2 -ml-2 mr-1 text-[#54656F] hover:bg-[#E9EDEF] rounded-full transition-colors border-0 flex items-center justify-center shrink-0"
                  id="chat-back-to-list-btn"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Profile Photo */}
                <div className="pr-[15px] shrink-0">
                  <ClickableAvatar 
                    userId={activeConv.recipientId || activeConv.contact}
                    name={activeConv.name}
                    avatar={activeConv.avatar}
                    size={40}
                  />
                </div>

                {/* Name & Online Status */}
                <div className="flex flex-col justify-center flex-1 overflow-hidden">
                  <div className="flex items-center">
                    <span 
                      className="font-normal text-[#111B21] text-[16px] leading-[21px] truncate"
                      title={`View ${activeConv.name}'s profile`}
                    >
                      {activeConv.name}
                    </span>
                  </div>
                  {(() => {
                    const isOnline = isSupabaseConfigured && activeConv.recipientId
                      ? onlineUsers[activeConv.recipientId] !== undefined
                      : activeConv.isOnline;
                    const convTyping = typingUsers[activeConv.id] || {};
                    const isOtherTyping = Object.keys(convTyping).some(uid => uid !== user.id && convTyping[uid] === true);
                    const lastSeenText = formatLastSeen(activeConv.lastSeen);
                    
                    return isOtherTyping ? (
                      <span className="text-[13px] leading-[20px] text-[#25D366] font-medium animate-pulse truncate">
                        {isEn ? 'typing...' : 'ٹائپ کر رہا ہے...'}
                      </span>
                    ) : (
                      <span className="text-[13px] leading-[20px] text-[#667781] truncate">
                        {isOnline ? currentT.online : lastSeenText}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Header icons: Messenger actions */}
              <div className="flex items-center gap-3 text-[#54656F]">
                <button 
                  onClick={() => window.open(`tel:${activeConv.contact}`)}
                  className="p-2 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
                  title="Call"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => alert('Initiating video call...')}
                  className="p-2 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
                  title="Video Call"
                >
                  <Video className="w-5 h-5" />
                </button>
                <div className="w-[1px] h-6 bg-[#D1D7DB] mx-1"></div>
                <button 
                  onClick={() => alert(`Details:\nName: ${activeConv.name}\nContact: ${activeConv.contact}`)}
                  className="p-2 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
                  title="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
                <button 
                  onClick={async () => {
                    if (confirm(isEn ? "Are you sure you want to clear this conversation history?" : "کیا آپ اس گفتگو کی ہسٹری حذف کرنا چاہتے ہیں؟")) {
                      if (isSupabaseConfigured && user.id) {
                        const conversationId = activeConv.id || activeConv.contact;
                        await dbDeleteConversation(user.id, conversationId);
                      }
                      setConversations(prev => prev.filter(c => c.contact !== activeConv.contact && c.id !== activeConv.contact));
                      setActiveContact(null);
                      window.history.pushState({}, '', '/chat');
                      window.dispatchEvent(new Event('popstate'));
                    }
                  }}
                  className="p-2 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
                  title={isEn ? "Clear Chat" : "چیٹ صاف کریں"}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#EFEAE2]" id="chat-messages-container">
              {activeConv.messages.length === 0 ? (
                <div className="text-center py-6 text-[#54656F] text-xs font-semibold bg-white rounded-lg shadow-sm mx-auto max-w-[280px]">
                  {isEn ? 'Send a message to start chatting' : 'گفتگو شروع کرنے کے لیے پیغام بھیجیں'}
                </div>
              ) : (
                activeConv.messages.map((msg, idx) => {
                  const isMe = msg.sender === 'me';
                  const prevMsg = idx > 0 ? activeConv.messages[idx - 1] : null;
                  const isGrouped = prevMsg && prevMsg.sender === msg.sender && (msg.timestamp - prevMsg.timestamp < 120000);
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'} ${isGrouped ? 'mt-1' : 'mt-4 animate-fade-in'}`}
                      id={`chat-msg-${msg.id}`}
                    >
                      {/* Attachment Rendering */}
                      {msg.attachment && (
                        <div className="mb-1 rounded-2xl overflow-hidden border border-slate-200 shadow-xs max-w-sm">
                          {msg.attachment.type === 'image' ? (
                            <img 
                              src={msg.attachment.url} 
                              alt="Attachment preview" 
                              className="w-full max-h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => window.open(msg.attachment?.url)}
                            />
                          ) : (
                            <div className="p-3 bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700">
                              📂 <span className="underline truncate">{msg.attachment.name}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bubble styling: Rounded bubbles and WhatsApp style colors */}
                      {msg.voice ? (
                        <div className={`shadow-sm rounded-lg ${isMe ? 'bg-[#D9FDD3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                          <VoiceMessageBubble
                            msg={msg}
                            isMe={isMe}
                            currentlyPlayingMsgId={currentlyPlayingMsgId}
                            setCurrentlyPlayingMsgId={setCurrentlyPlayingMsgId}
                            activeAudioElement={activeAudioElement}
                            setActiveAudioElement={setActiveAudioElement}
                            handleRetryVoiceUpload={handleRetryVoiceUpload}
                          />
                        </div>
                      ) : (msg.attachment?.type === 'image') ? null : (
                        <div
                          className={`px-2.5 py-1.5 text-[14.5px] shadow-sm relative min-w-[90px] ${
                            isMe 
                              ? 'bg-[#D9FDD3] text-[#111B21] rounded-lg rounded-tr-none' 
                              : 'bg-white text-[#111B21] rounded-lg rounded-tl-none'
                          }`}
                        >
                          <p className="leading-snug whitespace-pre-wrap pr-10">{msg.text}</p>
                          <div className="absolute right-1.5 bottom-1 flex items-center gap-0.5">
                            <span className="text-[10px] text-[#667781] leading-none">
                              {msg.time}
                            </span>
                            {isMe && (
                              msg.status === 'sending' ? (
                                <span className="w-2.5 h-2.5 border-[1.5px] border-[#667781] border-t-transparent rounded-full animate-spin shrink-0 ml-0.5" />
                              ) : msg.isSeen ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0" />
                              ) : (activeConv?.recipientId && onlineUsers[activeConv.recipientId]) ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#667781] shrink-0" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-[#667781] shrink-0" />
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Simulated Typing Indicator */}
              {isTyping && (
                <div className="flex flex-col items-start mr-auto max-w-[75%]" id="simulated-typing-indicator">
                  <div className="px-4 py-3 bg-[#f1f0f0] rounded-3xl rounded-tl-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar: Fixed Bottom & Keyboard Safe */}
            <form onSubmit={handleSendMessage} className="px-4 py-3 shrink-0 flex items-center gap-2 bg-[#F0F2F5] relative" id="chat-input-bar">
              {/* Attachment Icon */}
              <button
                type="button"
                onClick={handleAttachmentClick}
                className="p-2 text-[#54656F] hover:bg-slate-200/50 rounded-full transition-colors shrink-0 cursor-pointer border-0"
                title={currentT.attachment}
                id="chat-attachment-btn"
              >
                <Paperclip className="w-6 h-6" />
              </button>

              {/* Message Input Container */}
              <div className="flex-1 relative flex items-center bg-white border border-transparent focus-within:border-white rounded-lg px-2 py-1.5 transition-all">
                {/* Emoji button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 text-[#54656F] hover:text-[#111B21] bg-transparent border-0 cursor-pointer relative shrink-0"
                  title="Emoji"
                >
                  <Smile className="w-6 h-6" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white border border-[#D1D7DB] rounded-lg shadow-sm p-3 w-64 grid grid-cols-6 gap-2 z-50 max-h-48 overflow-y-auto">
                    {NATIVE_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        className="hover:bg-slate-100 text-xl p-1 rounded border-0 cursor-pointer bg-transparent"
                        onClick={() => {
                          const input = inputRef.current;
                          if (input) {
                            const start = input.selectionStart || inputText.length;
                            const end = input.selectionEnd || inputText.length;
                            const newText = inputText?.substring(0, start) + emoji + inputText?.substring(end);
                            setInputText(newText);
                            setTimeout(() => {
                              input.setSelectionRange(start + emoji.length, start + emoji.length);
                              input.focus();
                            }, 0);
                          } else {
                            setInputText(prev => prev + emoji);
                          }
                          setShowEmojiPicker(false);
                          console.log("[CHAT]", "Emoji inserted");
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input element */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => handleUserInputChange(e.target.value)}
                  placeholder={currentT.typeMessage}
                  className="flex-1 bg-transparent border-0 py-1 px-2 text-[15px] placeholder-[#8696A0] text-[#111B21] focus:outline-none"
                  id="chat-message-input-field"
                />

                {/* Right side inline icons */}
                <div className="flex items-center gap-1 text-[#54656F] shrink-0">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="p-1.5 hover:text-[#111B21] bg-transparent border-0 cursor-pointer"
                    title="Camera"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Send / Mic Button */}
              <button
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-0 transition-colors cursor-pointer text-white ml-1 ${
                  inputText?.trim() 
                    ? 'bg-[#00A884] hover:bg-[#008f6f]' 
                    : 'bg-[#00A884] hover:bg-[#008f6f]'
                }`}
                id="chat-send-btn"
                onClick={!inputText?.trim() ? startRecording : undefined}
                type={!inputText?.trim() ? "button" : "submit"}
              >
                {inputText?.trim() ? <Send className="w-5 h-5 ml-0.5" /> : <Mic className="w-5 h-5" />}
              </button>
            </form>

            {/* Hidden File Input for Attachments */}
            <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />

            {/* Camera Overlay Modal */}
            {showCamera && (
              <div className="absolute inset-0 bg-black z-50 flex flex-col">
                <div className="p-4 flex justify-between items-center text-white bg-black/50 absolute top-0 w-full z-10">
                  <span className="font-bold">Camera</span>
                  <button onClick={closeCamera} className="bg-transparent border-0 text-white cursor-pointer"><X /></button>
                </div>
                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                  {!cameraPhotoUrl && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />}
                  {cameraPhotoUrl && <img src={cameraPhotoUrl} alt="Capture preview" className="max-w-full max-h-full object-contain" />}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="p-6 bg-black flex justify-center items-center pb-12 gap-8">
                  {!cameraPhotoUrl ? (
                    <button onClick={capturePhoto} className="w-16 h-16 rounded-full border-4 border-white bg-transparent flex items-center justify-center cursor-pointer">
                      <div className="w-12 h-12 bg-white rounded-full" />
                    </button>
                  ) : (
                    <>
                      <button onClick={() => { setCameraPhotoUrl(null); setCameraPhotoBlob(null); }} className="text-white bg-transparent border-0 cursor-pointer text-sm">Retake</button>
                      <button onClick={sendCapturedPhoto} className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full flex items-center justify-center border-0 cursor-pointer shadow-lg"><Send className="w-6 h-6 ml-1" /></button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Voice Recording Overlay */}
            {(isRecording || voiceBlob) && (
              <div className="absolute bottom-[68px] left-2 right-2 bg-white border border-slate-200 shadow-xl rounded-2xl p-4 z-40 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  {isRecording ? (
                    <>
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="font-bold text-slate-800 tracking-wider font-mono">
                        {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                      </span>
                    </>
                  ) : (
                    <audio src={voicePreviewUrl!} controls className="h-8 w-48" />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={cancelRecording} className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border-0 cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  {isRecording ? (
                    <button onClick={stopRecording} className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center border-0 cursor-pointer hover:bg-red-200">
                      <div className="w-4 h-4 bg-red-600 rounded-sm" />
                    </button>
                  ) : (
                    <button onClick={sendVoiceMessage} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center border-0 cursor-pointer hover:bg-blue-700 shadow-md">
                      <Send className="w-4 h-4 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Uploading Overlay */}
            {isUploadingAttachment && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-40 flex items-center justify-center flex-col gap-3">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-bold text-slate-800 text-sm">Uploading...</span>
              </div>
            )}
          </>
        ) : (
          /* Empty Chat State on Desktop */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/20" id="chat-detail-empty-state">
            <AppEmptyState
              title={isEn ? 'Community Messenger' : 'کمیونٹی چیٹ'}
              description={currentT.selectChat}
              illustration={
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-sm mx-auto">
                  💬
                </div>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
