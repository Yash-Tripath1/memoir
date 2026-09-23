/* ============================================
   WhatsApp Chat Export Parser
   Handles .txt exports and .zip archives
   ============================================ */

import JSZip from 'jszip';
import { saveFile, generateId } from './storage';

/**
 * Parse a WhatsApp .txt export file content
 */
export function parseWhatsAppText(text) {
  const messages = [];
  const lines = text.split('\n');

  // WhatsApp date formats vary, try common patterns
  const datePatterns = [
    /^(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\s*[-–]\s*([^:]+?):\s*(.*)/,
    /^(\d{4}-\d{2}-\d{2},?\s+\d{1,2}:\d{2}(?::\d{2})?)\s*[-–]\s*([^:]+?):\s*(.*)/,
    /^(\[(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\])\s*([^:]+?):\s*(.*)/,
  ];

  let currentSender = null;
  let participants = new Set();

  for (const line of lines) {
    if (!line.trim()) continue;

    let parsed = false;

    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        const timestamp = match[1] || match[2];
        const sender = (match[2] || match[3] || match[4] || '').trim();
        const content = (match[3] || match[4] || match[5] || '').trim();

        // Skip system messages
        if (sender && !sender.includes('Messages and calls are end-to-end encrypted')) {
          participants.add(sender);
          currentSender = sender;

          const isMedia = content === '<Media omitted>' || content.startsWith('IMG-') || content.startsWith('VID-');

          messages.push({
            id: generateId(),
            sender,
            content: isMedia ? '📷 Photo' : content,
            timestamp,
            isMedia,
            mediaType: isMedia ? 'image' : null,
            mediaUrl: null,
          });
        }
        parsed = true;
        break;
      }
    }

    // Continuation of previous message
    if (!parsed && currentSender && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (line.trim()) {
        last.content += '\n' + line.trim();
      }
    }
  }

  return { messages, participants: [...participants] };
}

/**
 * Process a file (txt or zip) and return chat data
 */
export async function processChatFile(file) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.zip')) {
    return await processZipFile(file);
  } else if (fileName.endsWith('.txt')) {
    return await processTxtFile(file);
  } else {
    throw new Error('Unsupported file format. Please upload a .txt or .zip file.');
  }
}

async function processTxtFile(file) {
  const text = await file.text();
  const { messages, participants } = parseWhatsAppText(text);

  // Determine contact name from filename or participants
  const contactName = file.name
    .replace('.txt', '')
    .replace(/WhatsApp Chat with /i, '')
    .replace(/_/g, ' ')
    .trim();

  return {
    contactName: contactName || participants[0] || 'Unknown Contact',
    messages,
    participants,
  };
}

async function processZipFile(file) {
  const zip = await JSZip.loadAsync(file);
  const result = {
    contactName: '',
    messages: [],
    participants: [],
    mediaFiles: {},
  };

  // Find the chat .txt file
  let chatFile = null;
  const mediaFiles = [];

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    const lower = path.toLowerCase();
    if (lower.endsWith('.txt') && !chatFile) {
      chatFile = zipEntry;
    } else if (/\.(jpg|jpeg|png|gif|webp|mp4|opus|ogg|mp3)$/i.test(lower)) {
      mediaFiles.push({ path, entry: zipEntry });
    }
  }

  if (!chatFile) {
    throw new Error('No chat .txt file found in the zip archive.');
  }

  const text = await chatFile.async('string');
  const { messages, participants } = parseWhatsAppText(text);

  // Extract media files as data URLs
  for (const { path, entry } of mediaFiles) {
    try {
      const blob = await entry.async('blob');
      const url = URL.createObjectURL(blob);
      const fileName = path.split('/').pop();
      result.mediaFiles[fileName] = url;
    } catch (e) {
      console.warn('Could not extract media:', path, e);
    }
  }

  // Match media to messages
  for (const msg of messages) {
    if (msg.isMedia) {
      // Try to find matching media file
      const matchedKey = Object.keys(result.mediaFiles).find(k =>
        msg.content.includes(k.replace(/\.[^.]+$/, '')) ||
        k.includes('IMG') || k.includes('PHOTO')
      );
      if (matchedKey) {
        msg.mediaUrl = result.mediaFiles[matchedKey];
        msg.content = '📷';
      }
    }
  }

  const contactName = chatFile.name
    .split('/').pop()
    .replace('.txt', '')
    .replace(/WhatsApp Chat with /i, '')
    .replace(/_/g, ' ')
    .trim();

  result.contactName = contactName || participants[0] || 'Unknown Contact';
  result.messages = messages;
  result.participants = participants;

  return result;
}

/**
 * Determine which messages are "mine" (from the user)
 * Heuristic: the user is usually the participant NOT in the chat filename
 */
export function determineMyMessages(messages, contactName) {
  const senders = [...new Set(messages.map(m => m.sender))];
  // If there are exactly 2 senders, the one that doesn't match the contact name is "me"
  if (senders.length === 2) {
    const me = senders.find(s =>
      !contactName.toLowerCase().includes(s.toLowerCase())
    );
    if (me) {
      return messages.map(m => ({ ...m, isMine: m.sender === me }));
    }
  }
  // Fallback: first sender is "me"
  if (senders.length >= 2) {
    const me = senders[0];
    return messages.map(m => ({ ...m, isMine: m.sender === me }));
  }
  return messages.map(m => ({ ...m, isMine: true }));
}
