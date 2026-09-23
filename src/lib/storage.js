/* ============================================
   Memoir — Storage Layer (localStorage-based)
   Swap these functions for a real API later.
   ============================================ */

const PREFIX = 'memoir_';

// ---- Generic helpers ----
export function getItem(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setItem(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function removeItem(key) {
  localStorage.removeItem(PREFIX + key);
}

// ---- Auth ----
export function getUsers() {
  return getItem('users') || [];
}

export function saveUsers(users) {
  setItem('users', users);
}

export function getCurrentUser() {
  return getItem('currentUser');
}

export function setCurrentUser(user) {
  setItem('currentUser', user);
}

export function clearCurrentUser() {
  removeItem('currentUser');
}

// ---- Chats ----
export function getChats(userId) {
  return getItem(`chats_${userId}`) || [];
}

export function saveChats(userId, chats) {
  setItem(`chats_${userId}`, chats);
}

// ---- Messages ----
export function getMessages(userId, chatId) {
  return getItem(`messages_${userId}_${chatId}`) || [];
}

export function saveMessages(userId, chatId, messages) {
  setItem(`messages_${userId}_${chatId}`, messages);
}

// ---- Starred Messages ----
export function getStarredMessages(userId) {
  return getItem(`starred_${userId}`) || [];
}

export function saveStarredMessages(userId, messages) {
  setItem(`starred_${userId}`, messages);
}

// ---- Scrapbooks ----
export function getScrapbooks(userId) {
  return getItem(`scrapbooks_${userId}`) || [];
}

export function saveScrapbooks(userId, scrapbooks) {
  setItem(`scrapbooks_${userId}`, scrapbooks);
}

// ---- File storage (base64 in localStorage, for MVP) ----
export function saveFile(key, dataUrl) {
  try {
    localStorage.setItem(PREFIX + 'file_' + key, dataUrl);
    return key;
  } catch (e) {
    console.warn('Storage full, could not save file', e);
    return null;
  }
}

export function getFile(key) {
  return localStorage.getItem(PREFIX + 'file_' + key);
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
