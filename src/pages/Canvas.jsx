import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Undo, Redo, Type, Image as ImageIcon,
  StickyNote, Smile, Palette, Star, X, Bold, Italic,
  AlignLeft, AlignCenter, AlignRight, Trash2, RotateCw,
  ZoomIn, ZoomOut, Lock, Unlock, Copy,
  Layers, Calendar, Tag, MessageSquare, ChevronUp, ChevronDown,
  Settings, Eye, EyeOff, AlignJustify, Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getScrapbooks, saveScrapbooks, getStarredMessages, generateId } from '../lib/storage';
import { cx } from '../lib/utils';

// =============================================
// CONSTANTS
// =============================================

const THEMES = {
  cream:   { bg: '#f5f0e8', label: 'Cream', emoji: '🤎' },
  kraft:   { bg: '#c4a882', label: 'Kraft', emoji: '🪵' },
  white:   { bg: '#ffffff', label: 'White', emoji: '⬜' },
  vintage: { bg: '#e8dcc8', label: 'Vintage', emoji: '📜' },
  dark:    { bg: '#2a2a2a', label: 'Dark', emoji: '⬛' },
  rose:    { bg: '#f5e0e0', label: 'Rose', emoji: '🌹' },
  sage:    { bg: '#dce8dc', label: 'Sage', emoji: '🌿' },
  sky:     { bg: '#d8e8f0', label: 'Sky', emoji: '☁️' },
};

const STICKER_CATEGORIES = {
  'Smileys': ['😊','😂','🥰','😎','🤩','😍','🥳','😇','🤗','🤭','😋','🤓','😏','🥺','😤','🫠'],
  'Hearts':  ['❤️','💕','💖','💗','💝','💘','💔','🩷','🧡','💛','💚','💙','💜','🖤','🤍','🫶'],
  'Hands':   ['👍','👏','🙌','🤝','✌️','🤞','💪','🤟','👋','✋','🤙','🫰','🤘','🫵','☝️','🤌'],
  'Nature':  ['🌸','🌺','🌻','🌹','🌷','🍃','🌿','🍀','⭐','🌈','☀️','🌙','❄️','🔥','💫','✨'],
  'Travel':  ['✈️','🗺️','📍','🏖️','⛺','🎡','🚗','🚀','⛵','🏔️','📸','🎞️','🎪','🛤️','🌅','🏖️'],
  'Food':    ['☕','🍕','🎂','🧁','🍩','🍪','🍷','🍹','🌮','🍔','🍱','🍫','🍰','🥂','🍸','🍿'],
  'Decor':   ['🎀','🎉','🎊','🎈','🎁','🦋','🪄','📌','💌','🏷️','💐','🪷','🪻','🕯️','🧸','🎨'],
};

const NOTE_COLORS = [
  { bg: '#fef9c3', border: '#fde047', label: 'Yellow' },
  { bg: '#bbf7d0', border: '#86efac', label: 'Green' },
  { bg: '#bfdbfe', border: '#93c5fd', label: 'Blue' },
  { bg: '#fecaca', border: '#fca5a5', label: 'Red' },
  { bg: '#e9d5ff', border: '#d8b4fe', label: 'Purple' },
  { bg: '#fed7aa', border: '#fdba74', label: 'Orange' },
  { bg: '#f0fdf4', border: '#bbf7d0', label: 'Mint' },
  { bg: '#fce7f3', border: '#f9a8d4', label: 'Pink' },
];

const WASHI_TAPES = [
  { bg: 'linear-gradient(135deg, #fecdd3 25%, #fda4af 25%, #fda4af 50%, #fecdd3 50%, #fecdd3 75%, #fda4af 75%)', bgSize: '8px 8px', label: 'Pink' },
  { bg: 'linear-gradient(135deg, #bfdbfe 25%, #93c5fd 25%, #93c5fd 50%, #bfdbfe 50%, #bfdbfe 75%, #93c5fd 75%)', bgSize: '8px 8px', label: 'Blue' },
  { bg: 'linear-gradient(135deg, #bbf7d0 25%, #86efac 25%, #86efac 50%, #bbf7d0 50%, #bbf7d0 75%, #86efac 75%)', bgSize: '8px 8px', label: 'Green' },
  { bg: 'linear-gradient(135deg, #fef08a 25%, #fde047 25%, #fde047 50%, #fef08a 50%, #fef08a 75%, #fde047 75%)', bgSize: '8px 8px', label: 'Yellow' },
  { bg: 'linear-gradient(135deg, #e9d5ff 25%, #d8b4fe 25%, #d8b4fe 50%, #e9d5ff 50%, #e9d5ff 75%, #d8b4fe 75%)', bgSize: '8px 8px', label: 'Purple' },
  { bg: '#f5f5f4', bgSize: 'auto', label: 'White' },
  { bg: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.4) 3px, rgba(255,255,255,0.4) 6px), #d4a5a5', bgSize: 'auto', label: 'Mauve' },
  { bg: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.4) 3px, rgba(255,255,255,0.4) 6px), #a5c4d4', bgSize: 'auto', label: 'Teal' },
];

const FONTS = [
  { value: "'Inter', sans-serif", label: 'Sans' },
  { value: 'Georgia, serif', label: 'Serif' },
  { value: "'Caveat', cursive", label: 'Hand' },
  { value: "'Dancing Script', cursive", label: 'Script' },
  { value: "'Playfair Display', serif", label: 'Display' },
  { value: 'monospace', label: 'Type' },
];

// Chat bubble preset styles
const BUBBLE_PRESETS = {
  whatsapp: {
    label: 'WhatsApp',
    mineBg: '#d9fdd3',
    otherBg: '#ffffff',
    mineColor: '#1a1a1a',
    otherColor: '#1a1a1a',
    radius: '12px',
    mineTail: true,
    otherTail: true,
    shadow: '0 1px 1px rgba(0,0,0,0.06)',
    border: 'none',
    timeInside: true,
  },
  imessage: {
    label: 'iMessage',
    mineBg: '#007aff',
    otherBg: '#e9e9eb',
    mineColor: '#ffffff',
    otherColor: '#1a1a1a',
    radius: '18px',
    mineTail: false,
    otherTail: false,
    shadow: 'none',
    border: 'none',
    timeInside: false,
  },
  minimal: {
    label: 'Minimal',
    mineBg: '#f0f0f0',
    otherBg: '#ffffff',
    mineColor: '#333',
    otherColor: '#333',
    radius: '4px',
    mineTail: false,
    otherTail: false,
    shadow: 'none',
    border: '1px solid #e5e5e5',
    timeInside: false,
  },
  vintage: {
    label: 'Vintage',
    mineBg: '#f5e6d3',
    otherBg: '#ffffff',
    mineColor: '#5a4a3a',
    otherColor: '#4a4a4a',
    radius: '2px',
    mineTail: false,
    otherTail: false,
    shadow: '2px 2px 6px rgba(0,0,0,0.08)',
    border: '1px solid #d4c4a8',
    timeInside: true,
  },
  scrapbook: {
    label: 'Scrapbook',
    mineBg: '#fef3c7',
    otherBg: '#e0e7ff',
    mineColor: '#92400e',
    otherColor: '#3730a3',
    radius: '8px',
    mineTail: false,
    otherTail: false,
    shadow: '2px 3px 8px rgba(0,0,0,0.1)',
    border: 'none',
    timeInside: true,
  },
  polaroid: {
    label: 'Polaroid',
    mineBg: '#ffffff',
    otherBg: '#ffffff',
    mineColor: '#333',
    otherColor: '#333',
    radius: '2px',
    mineTail: false,
    otherTail: false,
    shadow: '3px 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid #eee',
    timeInside: true,
  },
};


// =============================================
// MAIN CANVAS COMPONENT
// =============================================
export default function Canvas() {
  const { scrapbookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [scrapbook, setScrapbook] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [starredMessages, setStarredMessages] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [showProps, setShowProps] = useState(false);

  const canvasRef = useRef();
  const workspaceRef = useRef();
  const interactionRef = useRef({ mode: 'idle' });
  const lastTapRef = useRef(0);

  // --- Load ---
  useEffect(() => {
    const books = getScrapbooks(user.id);
    const found = books.find(b => b.id === scrapbookId);
    if (!found) { navigate('/scrapbooks'); return; }
    setScrapbook(found);
    try { setElements(JSON.parse(found.elementsJson || '[]')); } catch { setElements([]); }
    setStarredMessages(getStarredMessages(user.id));
  }, [scrapbookId, user.id]);

  // --- Persist (actually saves) ---
  const persist = useCallback((els) => {
    const books = getScrapbooks(user.id);
    const idx = books.findIndex(b => b.id === scrapbookId);
    if (idx >= 0) {
      books[idx] = { ...books[idx], elementsJson: JSON.stringify(els), updatedAt: new Date().toISOString() };
      saveScrapbooks(user.id, books);
      setScrapbook({ ...books[idx] });
    }
  }, [user.id, scrapbookId]);

  // --- History ---
  const pushHistory = useCallback((els) => {
    setHistoryStack(prev => [...prev.slice(-30), JSON.parse(JSON.stringify(els))]);
    setRedoStack([]);
  }, []);

  const updateElements = useCallback((newEls, recordHistory = true) => {
    if (recordHistory) pushHistory(elements);
    setElements([...newEls]);
    persist(newEls);
  }, [elements, pushHistory, persist]);

  const undo = useCallback(() => {
    if (historyStack.length === 0) return;
    const prev = historyStack[historyStack.length - 1];
    setHistoryStack(h => h.slice(0, -1));
    setRedoStack(r => [...r, JSON.parse(JSON.stringify(elements))]);
    setElements(prev);
    persist(prev);
  }, [historyStack, elements, persist]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(r => r.slice(0, -1));
    setHistoryStack(h => [...h, JSON.parse(JSON.stringify(elements))]);
    setElements(next);
    persist(next);
  }, [redoStack, elements, persist]);

  // --- Element ops ---
  const getNextZ = () => Math.max(0, ...elements.map(e => e.zIndex || 0)) + 1;

  const addElement = useCallback((element) => {
    const newEl = {
      id: generateId(),
      x: 80 + Math.random() * 200,
      y: 60 + Math.random() * 150,
      w: 150, h: 100,
      rotation: 0,
      zIndex: elements.length + 1,
      locked: false,
      opacity: 1,
      ...element,
    };
    const newEls = [...elements, newEl];
    // Save directly without history for new adds
    setElements(newEls);
    persist(newEls);
    setSelectedId(newEl.id);
    setEditingId(newEl.id);
    setShowProps(false);
    return newEl;
  }, [elements, persist]);

  const updateElement = useCallback((id, updates) => {
    setElements(prev => {
      const newEls = prev.map(el => el.id === id ? { ...el, ...updates } : el);
      persist(newEls);
      return newEls;
    });
  }, [persist]);

  const deleteElement = useCallback((id) => {
    const newEls = elements.filter(el => el.id !== id);
    updateElements(newEls);
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
    setShowProps(false);
  }, [elements, updateElements, selectedId, editingId]);

  const duplicateElement = useCallback((id) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newEls = [...elements, { ...el, id: generateId(), x: el.x + 15, y: el.y + 15, zIndex: getNextZ() }];
    updateElements(newEls);
  }, [elements, updateElements]);

  const bringToFront = (id) => updateElement(id, { zIndex: getNextZ() });
  const sendToBack = (id) => {
    const minZ = Math.min(...elements.map(e => e.zIndex || 0));
    updateElement(id, { zIndex: minZ - 1 });
  };

  // --- Save text editing on Enter or blur ---
  const finishEditing = useCallback(() => {
    setEditingId(null);
    // Elements are already updated via updateElement in the text component
  }, []);

  // --- Pointer interactions ---
  const handleCanvasPointerDown = (e) => {
    if (e.target === canvasRef.current || e.target.closest('.canvas-bg')) {
      setSelectedId(null);
      setEditingId(null);
      setShowProps(false);
    }
  };

  const handleElementPointerDown = (e, id) => {
    e.stopPropagation();
    if (editingId === id) return;

    const el = elements.find(el => el.id === id);
    if (!el) return;

    // Double-tap detection for mobile
    const now = Date.now();
    const lastTap = lastTapRef.current;
    lastTapRef.current = now;

    if (now - lastTap < 300 && (el.type === 'text' || el.type === 'note' || el.type === 'chatbubble' || el.type === 'datestamp')) {
      setEditingId(id);
      setSelectedId(id);
      return;
    }

    setSelectedId(id);
    setShowProps(false);

    if (el.locked) return;
    bringToFront(id);

    interactionRef.current = {
      mode: 'pending',
      elementId: id,
      startX: e.clientX ?? e.touches?.[0]?.clientX ?? 0,
      startY: e.clientY ?? e.touches?.[0]?.clientY ?? 0,
      elStartX: el.x,
      elStartY: el.y,
    };

    const onMove = (ev) => {
      const clientX = ev.clientX ?? ev.touches?.[0]?.clientX ?? 0;
      const clientY = ev.clientY ?? ev.touches?.[0]?.clientY ?? 0;
      const ref = interactionRef.current;
      if (ref.mode === 'pending') {
        const dx = clientX - ref.startX;
        const dy = clientY - ref.startY;
        if (Math.sqrt(dx*dx+dy*dy) < 5) return;
        interactionRef.current.mode = 'dragging';
        pushHistory(elements);
      }
      if (interactionRef.current.mode === 'dragging') {
        const ref = interactionRef.current;
        updateElement(ref.elementId, {
          x: ref.elStartX + (clientX - ref.startX) / zoom,
          y: ref.elStartY + (clientY - ref.startY) / zoom,
        });
      }
    };

    const onUp = () => {
      interactionRef.current.mode = 'idle';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  };

  const handleResizeStart = (e, id, corner) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find(el => el.id === id);
    if (!el) return;
    pushHistory(elements);

    const startX = e.clientX;
    const startY = e.clientY;
    const { w: startW, h: startH, x: startElX, y: startElY } = el;

    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      let newW = startW, newH = startH, newX = startElX, newY = startElY;
      if (corner.includes('r')) newW = Math.max(40, startW + dx);
      if (corner.includes('l')) { newW = Math.max(40, startW - dx); newX = startElX + (startW - newW); }
      if (corner.includes('b')) newH = Math.max(30, startH + dy);
      if (corner.includes('t')) { newH = Math.max(30, startH - dy); newY = startElY + (startH - newH); }
      updateElement(id, { w: newW, h: newH, x: newX, y: newY });
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleRotateStart = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find(el => el.id === id);
    if (!el) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.left + (el.x + el.w/2) * zoom;
    const centerY = rect.top + (el.y + el.h/2) * zoom;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const startRotation = (el.rotation || 0) * Math.PI / 180;
    pushHistory(elements);

    const onMove = (ev) => {
      const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX);
      let deg = (startRotation + angle - startAngle) * 180 / Math.PI;
      if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
      updateElement(id, { rotation: deg });
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // --- Add handlers ---
  const handleAddText = () => {
    addElement({
      type: 'text', content: 'Type here',
      fontFamily: "'Inter', sans-serif", fontSize: 20, color: '#2a2a2a',
      fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left',
      w: 200, h: 50,
    });
    setActivePanel(null);
  };

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 220;
          const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
          addElement({ type: 'image', src: ev.target.result, w: img.width * scale, h: img.height * scale });
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
    setActivePanel(null);
  };

  const handleAddNote = (c) => {
    addElement({
      type: 'note', content: '', noteBg: c.bg, noteBorder: c.border,
      fontFamily: "'Caveat', cursive", fontSize: 20, color: '#333', w: 170, h: 170,
    });
    setActivePanel(null);
  };

  const handleAddSticker = (emoji) => {
    addElement({ type: 'sticker', content: emoji, w: 64, h: 64 });
    setActivePanel(null);
  };

  const handleAddWashi = (tape) => {
    addElement({ type: 'washi', washiBg: tape.bg, washiBgSize: tape.bgSize, w: 220, h: 22 });
    setActivePanel(null);
  };

  const handleAddDateStamp = () => {
    addElement({
      type: 'datestamp',
      content: new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }),
      fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#555', w: 240, h: 48,
    });
    setActivePanel(null);
  };

  const handleAddChatBubble = (msg) => {
    const preset = BUBBLE_PRESETS.whatsapp;
    addElement({
      type: 'chatbubble',
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.timestamp,
      isMine: msg.isMine,
      mediaUrl: msg.mediaUrl,
      bubbleStyle: 'whatsapp',
      // Bubble customization
      mineBg: preset.mineBg,
      otherBg: preset.otherBg,
      mineColor: preset.mineColor,
      otherColor: preset.otherColor,
      showSender: true,
      showTime: true,
      w: 260,
      h: msg.mediaUrl ? 200 : 80,
    });
    setActivePanel(null);
  };

  // --- Theme ---
  const handleThemeChange = (key) => {
    const books = getScrapbooks(user.id);
    const idx = books.findIndex(b => b.id === scrapbookId);
    if (idx >= 0) {
      books[idx] = { ...books[idx], theme: key, updatedAt: new Date().toISOString() };
      saveScrapbooks(user.id, books);
      setScrapbook({ ...books[idx] });
    }
  };

  // --- Export ---
  const handleExport = async () => {
    if (!canvasRef.current) return;
    const prev = selectedId;
    setSelectedId(null); setEditingId(null);
    await new Promise(r => setTimeout(r, 150));
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: null, scale: 2, useCORS: true,
        ignoreElements: (el) => el.classList?.contains('canvas-ctrl'),
      });
      const link = document.createElement('a');
      link.download = `${scrapbook?.title || 'scrapbook'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { console.error('Export failed:', err); }
    setSelectedId(prev);
  };

  // --- Zoom with pinch ---
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    let initialDist = 0;
    let initialZoom = 1;
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        initialZoom = zoom;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        setZoom(Math.max(0.3, Math.min(2.5, initialZoom * (dist / initialDist))));
      }
    };
    ws.addEventListener('touchstart', onTouchStart, { passive: false });
    ws.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      ws.removeEventListener('touchstart', onTouchStart);
      ws.removeEventListener('touchmove', onTouchMove);
    };
  }, [zoom]);

  // --- Keyboard ---
  useEffect(() => {
    const handleKey = (e) => {
      if (editingId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) { e.preventDefault(); deleteElement(selectedId); }
      }
      if (e.key === 'Escape') { setSelectedId(null); setEditingId(null); setActivePanel(null); setShowProps(false); }
      if ((e.ctrlKey||e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey||e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if ((e.ctrlKey||e.metaKey) && e.key === 'd') { e.preventDefault(); if (selectedId) duplicateElement(selectedId); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId, editingId, undo, redo, deleteElement, duplicateElement]);

  if (!scrapbook) return null;

  const selectedElement = elements.find(el => el.id === selectedId);
  const theme = THEMES[scrapbook.theme] || THEMES.cream;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="h-[100dvh] flex flex-col bg-neutral-100 overflow-hidden select-none">
      {/* ========== TOP BAR ========== */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-white border-b border-neutral-200 z-50 shrink-0">
        <div className="flex items-center gap-1.5">
          <button onClick={() => navigate('/scrapbooks')} className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95 transition-all">
            <ArrowLeft size={18} className="text-neutral-500" />
          </button>
          <div className="w-px h-5 bg-neutral-200" />
          <h2 className="font-semibold text-neutral-800 text-sm truncate max-w-[140px]">{scrapbook.title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={historyStack.length === 0} className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-20 active:scale-95" title="Undo">
            <Undo size={16} className="text-neutral-500" />
          </button>
          <button onClick={redo} disabled={redoStack.length === 0} className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-20 active:scale-95" title="Redo">
            <Redo size={16} className="text-neutral-500" />
          </button>
          <div className="w-px h-5 bg-neutral-200 mx-0.5" />
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95">
            <ZoomOut size={15} className="text-neutral-500" />
          </button>
          <span className="text-[10px] text-neutral-400 w-9 text-center font-medium">{Math.round(zoom*100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2.5, z + 0.15))} className="p-2 rounded-lg hover:bg-neutral-100 active:scale-95">
            <ZoomIn size={15} className="text-neutral-500" />
          </button>
          <div className="w-px h-5 bg-neutral-200 mx-0.5" />
          <button onClick={handleExport} className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 active:scale-95 transition-all">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* ========== MAIN AREA ========== */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop: left toolbar */}
        <div className="hidden md:flex w-[56px] bg-white border-r border-neutral-200 flex-col items-center py-2 gap-0.5 shrink-0 z-40">
          <ToolBtn icon={<Type size={17}/>} label="Text" onClick={handleAddText} />
          <ToolBtn icon={<ImageIcon size={17}/>} label="Photo" onClick={handleAddImage} />
          <ToolBtn icon={<MessageSquare size={17}/>} label="Chat" active={activePanel==='chatbubble'} onClick={()=>setActivePanel(p=>p==='chatbubble'?null:'chatbubble')} />
          <ToolBtn icon={<StickyNote size={17}/>} label="Notes" active={activePanel==='note'} onClick={()=>setActivePanel(p=>p==='note'?null:'note')} />
          <ToolBtn icon={<Smile size={17}/>} label="Sticker" active={activePanel==='sticker'} onClick={()=>setActivePanel(p=>p==='sticker'?null:'sticker')} />
          <ToolBtn icon={<Calendar size={17}/>} label="Date" onClick={handleAddDateStamp} />
          <ToolBtn icon={<Tag size={17}/>} label="Washi" active={activePanel==='washi'} onClick={()=>setActivePanel(p=>p==='washi'?null:'washi')} />
          <div className="border-t border-neutral-100 my-1 w-7" />
          <ToolBtn icon={<Palette size={17}/>} label="Theme" active={activePanel==='theme'} onClick={()=>setActivePanel(p=>p==='theme'?null:'theme')} />
        </div>

        {/* ========== CANVAS ========== */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center p-3"
          ref={workspaceRef}
          onWheel={(e) => { if (e.ctrlKey||e.metaKey) { e.preventDefault(); setZoom(z=>Math.max(0.3,Math.min(2.5,z-e.deltaY*0.002))); }}}
          style={{ backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          <div
            className="relative shadow-2xl ring-1 ring-black/5"
            style={{
              width: 800, height: 600,
              backgroundColor: theme.bg,
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              flexShrink: 0,
            }}
            ref={canvasRef}
            onDragOver={e=>e.preventDefault()}
            onDrop={e=>{e.preventDefault();const d=e.dataTransfer?.getData('application/memoir-image');if(d){const r=canvasRef.current.getBoundingClientRect();addElement({type:'image',src:d,x:(e.clientX-r.left)/zoom-100,y:(e.clientY-r.top)/zoom-100,w:200,h:200});}}}
            onPointerDown={handleCanvasPointerDown}
          >
            <div className="absolute inset-0 pointer-events-none canvas-bg" style={{backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`}} />

            {/* ===== ELEMENTS ===== */}
            {elements.map(el => (
              <CanvasElement
                key={el.id}
                element={el}
                isSelected={selectedId === el.id}
                isEditing={editingId === el.id}
                onPointerDown={(e) => handleElementPointerDown(e, el.id)}
                onResizeStart={handleResizeStart}
                onRotateStart={handleRotateStart}
                onUpdate={(u) => updateElement(el.id, u)}
                onStopEditing={finishEditing}
              />
            ))}
          </div>
        </div>

        {/* ========== DESKTOP: RIGHT PANEL ========== */}
        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 250, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="hidden md:block bg-white border-l border-neutral-200 overflow-hidden shrink-0 z-40"
            >
              <div className="w-[250px] h-full flex flex-col">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-100">
                  <h3 className="font-semibold text-neutral-700 text-sm capitalize">{activePanel === 'chatbubble' ? 'Chat Messages' : activePanel}</h3>
                  <button onClick={()=>setActivePanel(null)} className="p-1 rounded hover:bg-neutral-100"><X size={14} className="text-neutral-400"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  {renderPanelContent()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========== MOBILE: BOTTOM TOOLBAR ========== */}
      <div className="md:hidden flex items-center gap-0.5 px-1 py-1 bg-white border-t border-neutral-200 z-50 overflow-x-auto shrink-0">
        <MobileTool icon={<Type size={16}/>} label="Text" onClick={handleAddText} />
        <MobileTool icon={<ImageIcon size={16}/>} label="Photo" onClick={handleAddImage} />
        <MobileTool icon={<MessageSquare size={16}/>} label="Chat" active={activePanel==='chatbubble'} onClick={()=>setActivePanel(p=>p==='chatbubble'?null:'chatbubble')} />
        <MobileTool icon={<StickyNote size={16}/>} label="Note" active={activePanel==='note'} onClick={()=>setActivePanel(p=>p==='note'?null:'note')} />
        <MobileTool icon={<Smile size={16}/>} label="Sticker" active={activePanel==='sticker'} onClick={()=>setActivePanel(p=>p==='sticker'?null:'sticker')} />
        <MobileTool icon={<Calendar size={16}/>} label="Date" onClick={handleAddDateStamp} />
        <MobileTool icon={<Tag size={16}/>} label="Washi" active={activePanel==='washi'} onClick={()=>setActivePanel(p=>p==='washi'?null:'washi')} />
        <MobileTool icon={<Palette size={16}/>} label="Theme" active={activePanel==='theme'} onClick={()=>setActivePanel(p=>p==='theme'?null:'theme')} />
      </div>

      {/* ========== MOBILE: BOTTOM SHEET PANEL ========== */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: '45dvh' }}
            exit={{ height: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="md:hidden fixed bottom-[49px] left-0 right-0 bg-white border-t border-neutral-200 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-700 text-sm capitalize">{activePanel === 'chatbubble' ? 'Chat Messages' : activePanel}</h3>
              <button onClick={()=>setActivePanel(null)} className="p-1 rounded hover:bg-neutral-100"><X size={14} className="text-neutral-400"/></button>
            </div>
            <div className="overflow-y-auto p-3 h-[calc(100%-40px)]">
              {renderPanelContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== SELECTED ELEMENT ACTIONS (MOBILE) ========== */}
      <AnimatePresence>
        {selectedElement && !activePanel && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="fixed bottom-14 left-3 right-3 md:hidden bg-white rounded-2xl shadow-xl border border-neutral-200 z-50 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-400 capitalize">{selectedElement.type}</span>
              <div className="flex items-center gap-1">
                <button onClick={()=>setShowProps(p=>!p)} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
                  <Settings size={15}/>
                </button>
                <button onClick={()=>duplicateElement(selectedId)} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
                  <Copy size={15}/>
                </button>
                <button onClick={()=>deleteElement(selectedId)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                  <Trash2 size={15}/>
                </button>
              </div>
            </div>

            {/* Quick rotate + opacity */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1">
                <RotateCw size={12} className="text-neutral-400 shrink-0"/>
                <input type="range" min={-180} max={180} value={Math.round(selectedElement.rotation||0)} onChange={e=>updateElement(selectedId,{rotation:+e.target.value})} className="flex-1 accent-neutral-800" />
                <span className="text-[10px] text-neutral-400 w-8">{Math.round(selectedElement.rotation||0)}°</span>
              </div>
            </div>

            {/* Expanded properties */}
            <AnimatePresence>
              {showProps && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 mt-2 border-t border-neutral-100 space-y-2">
                    {(selectedElement.type==='text'||selectedElement.type==='note') && (
                      <>
                        <select value={selectedElement.fontFamily||"'Inter', sans-serif"} onChange={e=>updateElement(selectedId,{fontFamily:e.target.value})} className="w-full text-xs border border-neutral-200 rounded-lg px-2 py-1.5">
                          {FONTS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                        <div className="flex gap-1.5">
                          <label className="relative shrink-0">
                            <input type="color" value={selectedElement.color||'#2a2a2a'} onChange={e=>updateElement(selectedId,{color:e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                            <div className="w-8 h-8 rounded-lg border border-neutral-200" style={{backgroundColor:selectedElement.color||'#2a2a2a'}}/>
                          </label>
                          <input type="number" value={selectedElement.fontSize||18} onChange={e=>updateElement(selectedId,{fontSize:Math.max(8,+e.target.value||12)})} className="w-16 text-xs border border-neutral-200 rounded-lg px-2 py-1.5" min={8} max={120}/>
                          <button onClick={()=>updateElement(selectedId,{fontWeight:selectedElement.fontWeight==='bold'?'normal':'bold'})} className={cx('p-2 rounded-lg',selectedElement.fontWeight==='bold'?'bg-neutral-200':'hover:bg-neutral-100')}><Bold size={14}/></button>
                          <button onClick={()=>updateElement(selectedId,{fontStyle:selectedElement.fontStyle==='italic'?'normal':'italic'})} className={cx('p-2 rounded-lg',selectedElement.fontStyle==='italic'?'bg-neutral-200':'hover:bg-neutral-100')}><Italic size={14}/></button>
                          {['left','center','right'].map(a=>(
                            <button key={a} onClick={()=>updateElement(selectedId,{textAlign:a})} className={cx('p-2 rounded-lg',selectedElement.textAlign===a?'bg-neutral-200':'hover:bg-neutral-100')}>
                              {a==='left'?<AlignLeft size={14}/>:a==='center'?<AlignCenter size={14}/>:<AlignRight size={14}/>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {/* Chat bubble style picker */}
                    {selectedElement.type==='chatbubble' && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Bubble Style</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {Object.entries(BUBBLE_PRESETS).map(([key, preset]) => (
                            <button
                              key={key}
                              onClick={() => applyBubblePreset(selectedId, key)}
                              className={cx(
                                'p-2 rounded-lg text-[11px] font-medium border-2 transition-all',
                                selectedElement.bubbleStyle === key ? 'border-neutral-800 bg-neutral-50' : 'border-neutral-100 hover:border-neutral-300'
                              )}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <input type="checkbox" checked={selectedElement.showSender!==false} onChange={e=>updateElement(selectedId,{showSender:e.target.checked})} className="rounded"/>
                            Sender
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <input type="checkbox" checked={selectedElement.showTime!==false} onChange={e=>updateElement(selectedId,{showTime:e.target.checked})} className="rounded"/>
                            Time
                          </label>
                          <label className="relative shrink-0 flex items-center gap-1.5 text-xs text-neutral-500">
                            Color
                            <input type="color" value={selectedElement.isMine?selectedElement.mineBg:selectedElement.otherBg} onChange={e=>updateElement(selectedId,selectedElement.isMine?{mineBg:e.target.value}:{otherBg:e.target.value})} className="w-5 h-5 rounded border-0 cursor-pointer"/>
                          </label>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-neutral-400">Opacity</span>
                      <input type="range" min={0.1} max={1} step={0.05} value={selectedElement.opacity??1} onChange={e=>updateElement(selectedId,{opacity:+e.target.value})} className="flex-1 accent-neutral-800"/>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={()=>{updateElement(selectedId,{locked:!selectedElement.locked})}} className={cx('flex-1 py-1.5 rounded-lg text-xs font-medium',selectedElement.locked?'bg-amber-50 text-amber-600':'bg-neutral-50 text-neutral-500')}>
                        {selectedElement.locked?'🔒 Locked':'🔓 Lock'}
                      </button>
                      <button onClick={()=>sendToBack(selectedId)} className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-neutral-50 text-neutral-500">
                        <Layers size={12} className="inline mr-1"/>To Back
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== DESKTOP: BOTTOM PROPERTIES BAR ========== */}
      {selectedElement && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border-t border-neutral-200 z-50 shrink-0 overflow-x-auto">
          <button onClick={()=>deleteElement(selectedId)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 shrink-0"><Trash2 size={14}/></button>
          <button onClick={()=>duplicateElement(selectedId)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 shrink-0"><Copy size={14}/></button>
          <button onClick={()=>updateElement(selectedId,{locked:!selectedElement.locked})} className={cx('p-1.5 rounded-lg shrink-0',selectedElement.locked?'bg-amber-50 text-amber-500':'hover:bg-neutral-100 text-neutral-400')}>{selectedElement.locked?<Lock size={14}/>:<Unlock size={14}/>}</button>
          <button onClick={()=>sendToBack(selectedId)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 shrink-0"><Layers size={14}/></button>
          <div className="w-px h-5 bg-neutral-200 shrink-0"/>
          {(selectedElement.type==='text'||selectedElement.type==='note')&&(
            <>
              <select value={selectedElement.fontFamily||"'Inter', sans-serif"} onChange={e=>updateElement(selectedId,{fontFamily:e.target.value})} className="text-xs border border-neutral-200 rounded-lg px-2 py-1 shrink-0">{FONTS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}</select>
              <label className="shrink-0 relative"><input type="color" value={selectedElement.color||'#2a2a2a'} onChange={e=>updateElement(selectedId,{color:e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/><div className="w-6 h-6 rounded-lg border border-neutral-200" style={{backgroundColor:selectedElement.color||'#2a2a2a'}}/></label>
              <input type="number" value={selectedElement.fontSize||18} onChange={e=>updateElement(selectedId,{fontSize:Math.max(8,+e.target.value||12)})} className="w-14 text-xs border border-neutral-200 rounded-lg px-2 py-1 shrink-0" min={8} max={120}/>
              <button onClick={()=>updateElement(selectedId,{fontWeight:selectedElement.fontWeight==='bold'?'normal':'bold'})} className={cx('p-1 rounded shrink-0',selectedElement.fontWeight==='bold'?'bg-neutral-200':'hover:bg-neutral-100')}><Bold size={13}/></button>
              <button onClick={()=>updateElement(selectedId,{fontStyle:selectedElement.fontStyle==='italic'?'normal':'italic'})} className={cx('p-1 rounded shrink-0',selectedElement.fontStyle==='italic'?'bg-neutral-200':'hover:bg-neutral-100')}><Italic size={13}/></button>
              {['left','center','right'].map(a=><button key={a} onClick={()=>updateElement(selectedId,{textAlign:a})} className={cx('p-1 rounded shrink-0',selectedElement.textAlign===a?'bg-neutral-200':'hover:bg-neutral-100')}>{a==='left'?<AlignLeft size={13}/>:a==='center'?<AlignCenter size={13}/>:<AlignRight size={13}/>}</button>)}
              <div className="w-px h-5 bg-neutral-200 shrink-0"/>
            </>
          )}
          {/* Chat bubble style on desktop */}
          {selectedElement.type==='chatbubble' && (
            <>
              <div className="flex gap-1 shrink-0">
                {Object.entries(BUBBLE_PRESETS).map(([key, p])=>(
                  <button key={key} onClick={()=>applyBubblePreset(selectedId, key)} className={cx('px-2 py-1 rounded text-[11px] font-medium border transition-all',selectedElement.bubbleStyle===key?'border-neutral-800 bg-neutral-100':'border-neutral-100 hover:border-neutral-300')}>{p.label}</button>
                ))}
              </div>
              <label className="flex items-center gap-1 text-xs text-neutral-400 shrink-0"><input type="checkbox" checked={selectedElement.showSender!==false} onChange={e=>updateElement(selectedId,{showSender:e.target.checked})}/>Sender</label>
              <label className="flex items-center gap-1 text-xs text-neutral-400 shrink-0"><input type="checkbox" checked={selectedElement.showTime!==false} onChange={e=>updateElement(selectedId,{showTime:e.target.checked})}/>Time</label>
              <div className="w-px h-5 bg-neutral-200 shrink-0"/>
            </>
          )}
          <div className="flex items-center gap-1 shrink-0"><RotateCw size={11} className="text-neutral-400"/><input type="range" min={-180} max={180} value={Math.round(selectedElement.rotation||0)} onChange={e=>updateElement(selectedId,{rotation:+e.target.value})} className="w-16 accent-neutral-800"/><span className="text-[10px] text-neutral-400 w-7 font-mono">{Math.round(selectedElement.rotation||0)}°</span></div>
          <div className="flex items-center gap-1 shrink-0"><span className="text-[10px] text-neutral-400">%</span><input type="range" min={0.1} max={1} step={0.05} value={selectedElement.opacity??1} onChange={e=>updateElement(selectedId,{opacity:+e.target.value})} className="w-14 accent-neutral-800"/></div>
        </div>
      )}
    </div>
  );

  // =============================================
  // APPLY BUBBLE PRESET
  // =============================================
  function applyBubblePreset(id, presetKey) {
    const preset = BUBBLE_PRESETS[presetKey];
    if (!preset) return;
    updateElement(id, {
      bubbleStyle: presetKey,
      mineBg: preset.mineBg,
      otherBg: preset.otherBg,
      mineColor: preset.mineColor,
      otherColor: preset.otherColor,
    });
  }

  // =============================================
  // PANEL CONTENT RENDERER
  // =============================================
  function renderPanelContent() {
    if (activePanel === 'note') return (
      <div>
        <p className="text-xs text-neutral-400 mb-2">Pick a color</p>
        <div className="grid grid-cols-4 gap-2">
          {NOTE_COLORS.map(c => (
            <button key={c.bg} onClick={()=>handleAddNote(c)} className="aspect-square rounded-xl shadow-sm border-2 transition-transform hover:scale-105 active:scale-95" style={{backgroundColor:c.bg,borderColor:c.border}}/>
          ))}
        </div>
      </div>
    );

    if (activePanel === 'sticker') return (
      <div className="space-y-3">
        {Object.entries(STICKER_CATEGORIES).map(([cat, emojis]) => (
          <div key={cat}>
            <h4 className="text-[10px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">{cat}</h4>
            <div className="grid grid-cols-6 gap-0.5">{emojis.map((e,i)=><button key={i} onClick={()=>handleAddSticker(e)} className="text-2xl p-1.5 rounded-lg hover:bg-neutral-50 hover:scale-125 active:scale-90 transition-all">{e}</button>)}</div>
          </div>
        ))}
      </div>
    );

    if (activePanel === 'chatbubble') return (
      <div>
        {starredMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={28} className="mx-auto text-neutral-200 mb-2"/>
            <p className="text-sm text-neutral-400">No starred messages</p>
            <p className="text-xs text-neutral-300 mt-1">Star messages from your chats first</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-neutral-400 mb-2">Tap to add as a chat bubble</p>
            {starredMessages.map(msg => (
              <button
                key={msg.id}
                onClick={() => handleAddChatBubble(msg)}
                className="w-full text-left p-2.5 rounded-xl border border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50 transition-all active:scale-[0.98]"
              >
                {/* Preview as mini chat bubble */}
                <div className="flex flex-col items-end">
                  {msg.mediaUrl && (
                    <img src={msg.mediaUrl} alt="" className="max-w-[140px] h-20 object-cover rounded-lg mb-1.5"/>
                  )}
                  <div className="inline-block px-3 py-1.5 rounded-2xl rounded-br-sm text-sm" style={{backgroundColor: msg.isMine ? '#d9fdd3' : '#fff', border: msg.isMine ? 'none' : '1px solid #e5e5e5'}}>
                    <p className="text-neutral-700 line-clamp-2 text-[13px]">{msg.content}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{msg.sender}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );

    if (activePanel === 'theme') return (
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(THEMES).map(([key, t]) => (
          <button key={key} onClick={()=>handleThemeChange(key)} className={cx('p-2 rounded-xl border-2 transition-all text-center',scrapbook.theme===key?'border-neutral-800 shadow-md':'border-neutral-100 hover:border-neutral-300')}>
            <div className="w-full h-9 rounded-lg mb-1 border border-neutral-200/50" style={{backgroundColor:t.bg}}/>
            <span className="text-xs font-medium text-neutral-600">{t.emoji} {t.label}</span>
          </button>
        ))}
      </div>
    );

    if (activePanel === 'washi') return (
      <div className="space-y-1.5">
        {WASHI_TAPES.map((tape,i)=>(
          <button key={i} onClick={()=>handleAddWashi(tape)} className="w-full h-9 rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98] border border-neutral-200/50" style={{background:tape.bg,backgroundSize:tape.bgSize}}>
            <span className="text-[11px] font-medium text-neutral-500 bg-white/60 px-2 py-0.5 rounded">{tape.label}</span>
          </button>
        ))}
      </div>
    );

    return null;
  }
}


// =============================================
// TOOL BUTTON (desktop)
// =============================================
function ToolBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} title={label}
      className={cx('w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all',active?'bg-neutral-100 text-neutral-800 shadow-sm':'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600')}>
      {icon}
      <span className="text-[8px] leading-none font-medium">{label}</span>
    </button>
  );
}

// =============================================
// MOBILE TOOL BUTTON
// =============================================
function MobileTool({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={cx('flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl shrink-0 transition-all',active?'bg-neutral-100 text-neutral-700':'text-neutral-400 active:bg-neutral-50')}>
      {icon}
      <span className="text-[9px] leading-none font-medium">{label}</span>
    </button>
  );
}

// =============================================
// CANVAS ELEMENT RENDERER
// =============================================
function CanvasElement({ element: el, isSelected, isEditing, onPointerDown, onResizeStart, onRotateStart, onUpdate, onStopEditing }) {
  const [editContent, setEditContent] = useState('');
  const textRef = useRef();
  const tapRef = useRef(0);

  useEffect(() => {
    if (isEditing) {
      setEditContent(el.content || '');
      setTimeout(() => textRef.current?.focus(), 50);
    }
  }, [isEditing, el.id]);

  const stopEdit = () => {
    if (editContent !== el.content) onUpdate({ content: editContent });
    onStopEditing();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stopEdit();
    }
    e.stopPropagation();
  };

  const renderContent = () => {
    switch (el.type) {
      case 'text':
        return (
          <div className="w-full h-full overflow-hidden p-2" style={{fontFamily:el.fontFamily,fontSize:`${el.fontSize||18}px`,color:el.color||'#2a2a2a',fontWeight:el.fontWeight||'normal',fontStyle:el.fontStyle||'normal',textAlign:el.textAlign||'left',lineHeight:1.5}}>
            {isEditing ? (
              <textarea ref={textRef} value={editContent} onChange={e=>setEditContent(e.target.value)} onBlur={stopEdit} onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent border-none outline-none resize-none" style={{fontFamily:'inherit',fontSize:'inherit',color:'inherit',fontWeight:'inherit',fontStyle:'inherit',textAlign:'inherit',lineHeight:'inherit'}}
                onMouseDown={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}/>
            ) : (
              <>
                <p className="whitespace-pre-wrap break-words">{el.content}</p>
                {el.fromStarred && <p className="text-xs opacity-40 mt-1" style={{fontSize:'12px'}}>— {el.sender}</p>}
              </>
            )}
          </div>
        );

      case 'image':
        return <img src={el.src} alt="" className="w-full h-full object-cover rounded-sm pointer-events-none" draggable={false}/>;

      case 'note':
        return (
          <div className="w-full h-full p-3 overflow-hidden relative" style={{backgroundColor:el.noteBg||'#fef9c3',border:`2px solid ${el.noteBorder||'#fde047'}`,borderRadius:'4px',boxShadow:'3px 3px 10px rgba(0,0,0,0.08)'}}>
            {isEditing ? (
              <textarea ref={textRef} value={editContent} onChange={e=>setEditContent(e.target.value)} onBlur={stopEdit} onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent border-none outline-none resize-none" style={{fontFamily:"'Caveat', cursive",fontSize:`${el.fontSize||20}px`,lineHeight:1.6,color:el.color||'#333'}}
                onMouseDown={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}/>
            ) : (
              <p className="whitespace-pre-wrap break-words" style={{fontFamily:"'Caveat', cursive",fontSize:`${el.fontSize||20}px`,lineHeight:1.6,color:el.color||'#333'}}>
                {el.content || 'Tap to write...'}
              </p>
            )}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400 shadow-sm border border-red-500"/>
            <div className="absolute bottom-0 right-0 w-5 h-5" style={{background:`linear-gradient(225deg, transparent 50%, ${el.noteBorder||'#fde047'}99 50%)`}}/>
          </div>
        );

      case 'sticker':
        return <div className="w-full h-full flex items-center justify-center select-none" style={{fontSize:`${Math.min(el.w,el.h)*0.7}px`}}>{el.content}</div>;

      case 'washi':
        return <div className="w-full h-full rounded-sm" style={{background:el.washiBg,backgroundSize:el.washiBgSize||'auto',opacity:0.85,borderRadius:'2px'}}/>;

      case 'datestamp':
        return (
          <div className="w-full h-full flex items-center justify-center border-2 border-dashed rounded-md px-3" style={{borderColor:el.color||'#555',opacity:0.7}}>
            <span style={{fontFamily:el.fontFamily||"'Playfair Display', serif",fontSize:`${el.fontSize||16}px`,color:el.color||'#555',letterSpacing:'1px'}}>📅 {el.content}</span>
          </div>
        );

      case 'chatbubble':
        return renderChatBubble();

      default: return null;
    }
  };

  const renderChatBubble = () => {
    const preset = BUBBLE_PRESETS[el.bubbleStyle] || BUBBLE_PRESETS.whatsapp;
    const isMine = el.isMine;
    const bgColor = isMine ? (el.mineBg || preset.mineBg) : (el.otherBg || preset.otherBg);
    const textColor = isMine ? (el.mineColor || preset.mineColor) : (el.otherColor || preset.otherColor);
    const showSender = el.showSender !== false;
    const showTime = el.showTime !== false;

    return (
      <div className="w-full h-full flex flex-col p-2 overflow-hidden">
        {/* Media */}
        {el.mediaUrl && (
          <div className="mb-1.5 rounded-lg overflow-hidden" style={{maxHeight:'55%'}}>
            <img src={el.mediaUrl} alt="" className="w-full object-cover rounded-lg"/>
          </div>
        )}

        {/* Bubble */}
        <div className={cx('flex flex-col', isMine ? 'items-end' : 'items-start')}>
          {showSender && !isMine && (
            <span className="text-[10px] font-semibold text-neutral-400 mb-0.5 px-1">{el.sender}</span>
          )}
          <div
            className="inline-block px-3 py-1.5 relative"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              borderRadius: preset.radius,
              boxShadow: preset.shadow,
              border: preset.border,
              maxWidth: '100%',
              wordBreak: 'break-word',
            }}
          >
            <p className="text-[13px] leading-snug whitespace-pre-wrap" style={{fontFamily: el.bubbleStyle === 'scrapbook' ? "'Caveat', cursive" : el.bubbleStyle === 'vintage' ? 'Georgia, serif' : 'inherit', fontSize: el.bubbleStyle === 'polaroid' ? '12px' : '13px'}}>
              {el.content}
            </p>
            {showTime && preset.timeInside && (
              <span className="block text-right text-[9px] opacity-40 mt-0.5">{el.timestamp || 'now'}</span>
            )}
            {/* Bubble tail */}
            {isMine && preset.mineTail && (
              <div className="absolute -right-1 bottom-0 w-3 h-3 overflow-hidden">
                <div className="w-3 h-3 rounded-sm rotate-45 translate-y-0.5" style={{backgroundColor: bgColor}}/>
              </div>
            )}
            {!isMine && preset.otherTail && (
              <div className="absolute -left-1 bottom-0 w-3 h-3 overflow-hidden">
                <div className="w-3 h-3 rounded-sm rotate-45 translate-y-0.5" style={{backgroundColor: bgColor}}/>
              </div>
            )}
          </div>
          {showTime && !preset.timeInside && (
            <span className="text-[9px] text-neutral-300 mt-0.5 px-1">{el.timestamp || 'now'}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cx(
        'absolute touch-none',
        isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : '',
        isEditing ? '' : 'cursor-grab active:cursor-grabbing',
        el.locked ? 'cursor-not-allowed' : '',
      )}
      style={{left:el.x,top:el.y,width:el.w,height:el.h,transform:`rotate(${el.rotation||0}deg)`,zIndex:el.zIndex||1,opacity:el.opacity??1}}
      onPointerDown={isEditing ? undefined : onPointerDown}
      onTouchStart={isEditing ? undefined : onPointerDown}
    >
      {renderContent()}

      {/* Selection controls */}
      {isSelected && !el.locked && (
        <>
          {['tl','tr','bl','br'].map(corner => {
            const s = {position:'absolute',width:12,height:12,backgroundColor:'white',border:'2px solid #3b82f6',borderRadius:'50%',zIndex:10};
            if (corner.includes('l')) s.left = -6; else s.right = -6;
            if (corner.includes('t')) s.top = -6; else s.bottom = -6;
            s.cursor = corner==='tl'?'nw-resize':corner==='tr'?'ne-resize':corner==='bl'?'sw-resize':'se-resize';
            return <div key={corner} style={s} className="canvas-ctrl" onPointerDown={e=>onResizeStart(e,el.id,corner)}/>;
          })}
          <div className="absolute canvas-ctrl" style={{top:-30,left:'50%',transform:'translateX(-50%)',width:20,height:20,backgroundColor:'white',border:'2px solid #3b82f6',borderRadius:'50%',zIndex:10,cursor:'grab',display:'flex',alignItems:'center',justifyContent:'center'}} onPointerDown={e=>onRotateStart(e,el.id)}>
            <RotateCw size={10} className="text-blue-500"/>
          </div>
          <div className="absolute canvas-ctrl" style={{top:-18,left:'50%',width:1,height:18,backgroundColor:'#3b82f6',zIndex:9}}/>
        </>
      )}
    </div>
  );
}
