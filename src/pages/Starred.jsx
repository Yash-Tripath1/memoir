import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, StarOff, MessageSquare, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStarredMessages, saveStarredMessages } from '../lib/storage';
import { formatMessageTime, getAvatarColor, getAvatarLetter, cx } from '../lib/utils';

export default function Starred() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [starred, setStarred] = useState(() => getStarredMessages(user.id));

  // Group by contact
  const grouped = starred.reduce((acc, msg) => {
    const key = msg.contactName || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  const handleUnstar = (msgId) => {
    const updated = starred.filter(s => s.messageId !== msgId);
    setStarred(updated);
    saveStarredMessages(user.id, updated);
  };

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-memoir-800">Starred Messages</h1>
        <p className="text-memoir-400 text-sm mt-1">
          {starred.length} starred message{starred.length !== 1 ? 's' : ''}
        </p>
      </div>

      {starred.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-lg font-medium text-memoir-600 mb-2">No starred messages</h3>
          <p className="text-memoir-400 text-sm">
            Star messages from your chats to see them here
          </p>
        </div>
      ) : (
        <AnimatePresence>
          {Object.entries(grouped).map(([contact, msgs]) => (
            <div key={contact} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={cx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
                  getAvatarColor(contact)
                )}>
                  {getAvatarLetter(contact)}
                </div>
                <h3 className="font-medium text-memoir-700">{contact}</h3>
                <span className="text-xs text-memoir-300">({msgs.length})</span>
              </div>

              <div className="space-y-2 ml-11">
                {msgs.map((msg) => (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    className="card p-4 group"
                  >
                    {/* Media */}
                    {msg.mediaUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden max-w-xs">
                        <img src={msg.mediaUrl} alt="" className="w-full rounded-lg" />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-memoir-700 whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs text-memoir-300 mt-1">
                          {msg.sender} · {formatMessageTime(msg.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/chat/${msg.chatId}`)}
                          className="p-1.5 rounded-lg hover:bg-memoir-50 text-memoir-400 hover:text-memoir-600 transition-colors"
                          title="View in chat"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleUnstar(msg.messageId)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-memoir-400 hover:text-red-500 transition-colors"
                          title="Unstar"
                        >
                          <StarOff size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
