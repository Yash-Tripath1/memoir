import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload, MessageSquare, Search, Star, Trash2, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getChats, saveChats, getMessages, saveMessages,
  generateId
} from '../lib/storage';
import { processChatFile, determineMyMessages } from '../lib/whatsapp-parser';
import { getAvatarColor, getAvatarLetter, truncate, cx } from '../lib/utils';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [chats, setChats] = useState(() => getChats(user.id));
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const filteredChats = chats.filter(c =>
    c.contactName.toLowerCase().includes(search.toLowerCase())
  );

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError('');
    try {
      const result = await processChatFile(file);
      const messages = determineMyMessages(result.messages, result.contactName);

      const chatId = generateId();
      const newChat = {
        id: chatId,
        contactName: result.contactName,
        lastMessage: messages.length > 0 ? truncate(messages[messages.length - 1].content, 40) : '',
        messageCount: messages.length,
        avatarLetter: getAvatarLetter(result.contactName),
        avatarColor: getAvatarColor(result.contactName),
        createdAt: new Date().toISOString(),
        participants: result.participants,
      };

      const updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      saveChats(user.id, updatedChats);
      saveMessages(user.id, chatId, messages);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDeleteChat = (chatId) => {
    const updated = chats.filter(c => c.id !== chatId);
    setChats(updated);
    saveChats(user.id, updated);
    localStorage.removeItem('memoir_messages_' + user.id + '_' + chatId);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-memoir-800">Your Chats</h1>
          <p className="text-memoir-400 text-sm mt-1">
            Import WhatsApp conversations to preserve
          </p>
        </div>
      </div>

      {/* Import & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-memoir-300" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="input-field pl-10"
          />
        </div>
        <input
          type="file"
          accept=".txt,.zip"
          onChange={handleImport}
          ref={fileRef}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="btn-primary flex items-center justify-center gap-2"
          disabled={importing}
        >
          <Upload size={18} />
          {importing ? 'Importing...' : 'Import Chat'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {importing && (
        <div className="mb-4 p-4 card flex items-center gap-3">
          <div className="animate-spin text-memoir-500">
            <Upload size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-memoir-700">Importing chat...</p>
            <p className="text-xs text-memoir-400">This may take a moment for large files</p>
          </div>
        </div>
      )}

      {/* Chat List */}
      {filteredChats.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-memoir-600 mb-2">
            {chats.length === 0 ? 'No chats yet' : 'No matching chats'}
          </h3>
          <p className="text-memoir-400 text-sm mb-6">
            {chats.length === 0
              ? 'Import your first WhatsApp chat to get started'
              : 'Try a different search term'}
          </p>
          {chats.length === 0 && (
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-primary"
            >
              <Upload size={18} className="inline mr-2" />
              Import Your First Chat
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredChats.map((chat, i) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-4 flex items-center gap-4 cursor-pointer group"
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <div className={cx(
                'w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0',
                chat.avatarColor
              )}>
                {chat.avatarLetter}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-memoir-800 truncate">{chat.contactName}</h3>
                  <span className="text-xs text-memoir-300 ml-2 shrink-0">
                    {chat.messageCount} messages
                  </span>
                </div>
                <p className="text-sm text-memoir-400 truncate mt-1">
                  {chat.lastMessage || 'No messages'}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this chat?')) handleDeleteChat(chat.id);
                }}
                className="p-2 text-memoir-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
