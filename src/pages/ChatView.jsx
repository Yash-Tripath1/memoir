import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Star, StarOff, Image, MessagesSquare, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getChats, getMessages, saveMessages, getStarredMessages, saveStarredMessages, generateId } from '../lib/storage';
import { formatMessageTime, cx } from '../lib/utils';

export default function ChatView() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef();

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [starredMessages, setStarredMessages] = useState(() => getStarredMessages(user.id));
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'media'
  const [starredIds, setStarredIds] = useState(new Set());

  useEffect(() => {
    const chats = getChats(user.id);
    const found = chats.find(c => c.id === chatId);
    if (!found) {
      navigate('/');
      return;
    }
    setChat(found);
    const msgs = getMessages(user.id, chatId);
    setMessages(msgs);

    // Build set of starred message IDs
    const starred = getStarredMessages(user.id);
    setStarredMessages(starred);
    setStarredIds(new Set(starred.map(s => s.messageId)));
  }, [chatId, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleStar = (msg) => {
    const updated = [...starredMessages];
    const existingIdx = updated.findIndex(s => s.messageId === msg.id);

    if (existingIdx >= 0) {
      updated.splice(existingIdx, 1);
    } else {
      updated.push({
        id: generateId(),
        messageId: msg.id,
        chatId,
        contactName: chat?.contactName || 'Unknown',
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp,
        isMine: msg.isMine,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        isMedia: msg.isMedia,
        starredAt: new Date().toISOString(),
      });
    }

    setStarredMessages(updated);
    saveStarredMessages(user.id, updated);
    setStarredIds(new Set(updated.map(s => s.messageId)));
  };

  const mediaMessages = messages.filter(m => m.isMedia || m.mediaUrl);

  if (!chat) return null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-memoir-100 bg-white/80 backdrop-blur-lg sticky top-16 z-30">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-memoir-50 transition-colors">
          <ArrowLeft size={20} className="text-memoir-600" />
        </button>
        <div className={cx(
          'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
          chat.avatarColor || 'bg-memoir-400'
        )}>
          {chat.avatarLetter || '?'}
        </div>
        <div className="flex-1">
          <h2 className="font-medium text-memoir-800">{chat.contactName}</h2>
          <p className="text-xs text-memoir-400">{messages.length} messages</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-memoir-50 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={cx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              activeTab === 'chat' ? 'bg-white text-memoir-700 shadow-sm' : 'text-memoir-400'
            )}
          >
            <MessagesSquare size={14} className="inline mr-1" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={cx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              activeTab === 'media' ? 'bg-white text-memoir-700 shadow-sm' : 'text-memoir-400'
            )}
          >
            <Image size={14} className="inline mr-1" />
            Media
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'chat' ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-memoir-400">No messages found</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.5) }}
                className={cx(
                  'flex',
                  msg.isMine ? 'justify-end' : 'justify-start'
                )}
              >
                <div className={cx(
                  'max-w-[80%] px-4 py-2.5 relative group',
                  msg.isMine ? 'chat-bubble-mine' : 'chat-bubble-other'
                )}>
                  {/* Sender name (for group chats) */}
                  {!msg.isMine && messages[i-1]?.sender !== msg.sender && (
                    <p className={cx(
                      'text-xs font-medium mb-1',
                      msg.isMine ? 'text-memoir-100' : 'text-memoir-400'
                    )}>
                      {msg.sender}
                    </p>
                  )}

                  {/* Media */}
                  {msg.mediaUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                      <img
                        src={msg.mediaUrl}
                        alt="Media"
                        className="max-w-full rounded-lg cursor-pointer"
                        onClick={() => window.open(msg.mediaUrl, '_blank')}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>

                  {/* Timestamp */}
                  <p className={cx(
                    'text-[10px] mt-1 text-right',
                    msg.isMine ? 'text-white/60' : 'text-memoir-300'
                  )}>
                    {formatMessageTime(msg.timestamp)}
                  </p>

                  {/* Star button */}
                  <button
                    onClick={() => toggleStar(msg)}
                    className={cx(
                      'absolute -right-2 -top-2 w-7 h-7 rounded-full flex items-center justify-center',
                      'opacity-0 group-hover:opacity-100 transition-all duration-200',
                      'bg-white shadow-md border border-memoir-100',
                      starredIds.has(msg.id) && 'opacity-100 text-amber-400'
                    )}
                  >
                    <Star
                      size={14}
                      className={starredIds.has(msg.id) ? 'fill-amber-400 text-amber-400' : 'text-memoir-300'}
                    />
                  </button>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        /* Media Tab */
        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {mediaMessages.length === 0 ? (
            <div className="text-center py-12">
              <Image size={40} className="mx-auto text-memoir-200 mb-3" />
              <p className="text-memoir-400">No media found in this chat</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {mediaMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="aspect-square rounded-xl overflow-hidden bg-memoir-50 cursor-pointer group relative"
                >
                  {msg.mediaUrl ? (
                    <img
                      src={msg.mediaUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onClick={() => window.open(msg.mediaUrl, '_blank')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image size={24} className="text-memoir-200" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
