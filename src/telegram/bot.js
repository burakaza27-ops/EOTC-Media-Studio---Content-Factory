import fs from 'fs';
import https from 'https';

const getEnv = (key) => process.env[key];

export const TELEGRAM_BOT_TOKEN = () => getEnv('TELEGRAM_BOT_TOKEN');
export const TELEGRAM_CHAT_IDS = () => {
  const ids = getEnv('TELEGRAM_CHAT_ID');
  if (!ids) return [];
  return ids.split(',').map(id => id.trim()).filter(id => id.length > 0);
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function httpsRequest(path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.telegram.org',
      path: path,
      method: payload ? 'POST' : 'GET',
      headers: payload
        ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        : {}
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.ok) resolve(response);
          else reject(new Error(response.description || 'Telegram API request failed'));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function buildMultipartFormData(fields, boundary) {
  let parts = [];
  
  for (const [key, value] of Object.entries(fields)) {
    if (value instanceof Buffer) {
      const isVideo = key === 'video' || (typeof key === 'string' && key.endsWith('.mp4'));
      const filename = isVideo ? 'reel.mp4' : 'quote.png';
      const contentType = isVideo ? 'video/mp4' : 'image/png';
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${key}"; filename="${filename}"\r\n` +
        `Content-Type: ${contentType}\r\n\r\n`
      ));
      parts.push(value);
      parts.push(Buffer.from('\r\n'));
    } else if (value !== undefined && value !== null) {
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
        `${value}\r\n`
      ));
    }
  }
  
  return Buffer.concat([...parts, Buffer.from(`--${boundary}--\r\n`)]);
}

export function httpsMultipartRequest(path, fields) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const body = buildMultipartFormData(fields, boundary);
    
    const options = {
      hostname: 'api.telegram.org',
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.ok) resolve(response);
          else reject(new Error(response.description || 'Telegram multipart failed'));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Single Chat Delivery Helpers ──────────────────────────────────────────

function safeCaption(caption, maxLen = 1000) {
  if (!caption) return '';
  if (caption.length <= maxLen) return caption;
  return caption.substring(0, maxLen - 3) + '...';
}

export async function sendPhotoToChat(chatId, imagePath, caption = '') {
  const token = TELEGRAM_BOT_TOKEN();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  if (!fs.existsSync(imagePath)) throw new Error(`Image not found: ${imagePath}`);

  const stats = fs.statSync(imagePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`Image too large: ${(stats.size / 1024 / 1024).toFixed(1)}MB (max: 10MB)`);
  }

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await httpsMultipartRequest(
        `/bot${token}/sendPhoto`,
        {
          chat_id: chatId,
          photo: fs.readFileSync(imagePath),
          caption: safeCaption(caption),
          parse_mode: 'HTML'
        }
      );
      return { success: true, chatId, message_id: response.result?.message_id };
    } catch (error) {
      if (i === MAX_RETRIES - 1) throw error;
      await sleep(1000 * Math.pow(2, i));
    }
  }
}

export async function sendVideoToChat(chatId, videoPath, caption = '') {
  const token = TELEGRAM_BOT_TOKEN();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  if (!fs.existsSync(videoPath)) throw new Error(`Video file not found: ${videoPath}`);

  const stats = fs.statSync(videoPath);
  if (stats.size > MAX_VIDEO_SIZE) {
    throw new Error(`Video too large: ${(stats.size / 1024 / 1024).toFixed(1)}MB (max 50MB)`);
  }

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await httpsMultipartRequest(
        `/bot${token}/sendVideo`,
        {
          chat_id: chatId,
          video: fs.readFileSync(videoPath),
          caption: safeCaption(caption),
          parse_mode: 'HTML',
          supports_streaming: 'true'
        }
      );
      return { success: true, chatId, message_id: response.result?.message_id };
    } catch (error) {
      if (i === MAX_RETRIES - 1) throw error;
      await sleep(1000 * Math.pow(2, i));
    }
  }
}

export async function sendDocumentToChat(chatId, filePath, caption = '') {
  const token = TELEGRAM_BOT_TOKEN();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  const fileName = path.basename(filePath);
  return await httpsMultipartRequest(
    `/bot${token}/sendDocument`,
    {
      chat_id: chatId,
      document: fs.readFileSync(filePath),
      caption: safeCaption(caption),
      parse_mode: 'HTML'
    }
  );
}

export async function sendMediaGroupToChat(chatId, imagePaths, caption = '') {
  const token = TELEGRAM_BOT_TOKEN();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  if (!imagePaths || imagePaths.length === 0) throw new Error('No images provided for album');

  for (const img of imagePaths) {
    if (!fs.existsSync(img)) throw new Error(`Image not found: ${img}`);
  }

  const imageBuffers = imagePaths.map(p => fs.readFileSync(p));

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await sendMediaGroupRequest(token, chatId, imageBuffers, caption);
      return { success: true, chatId, count: response.result?.length || 0 };
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error;
      await sleep(1500 * Math.pow(2, attempt));
    }
  }
}

export async function sendMessageToChat(chatId, text, options = {}) {
  const token = TELEGRAM_BOT_TOKEN();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');

  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: options.parse_mode || 'HTML',
    disable_web_page_preview: options.disable_web_page_preview !== false
  };
  if (options.reply_markup) body.reply_markup = options.reply_markup;

  return await httpsRequest(`/bot${token}/sendMessage`, body);
}

// ─── Broadcast Delivery Functions ──────────────────────────────────────────

export async function sendToTelegram(imagePath, caption) {
  const token = TELEGRAM_BOT_TOKEN();
  const chatIds = TELEGRAM_CHAT_IDS();
  
  if (!token || chatIds.length === 0) {
    console.log('📋 Telegram not configured — skipping notification');
    return { skipped: true, reason: 'not_configured' };
  }

  console.log(`📤 Broadcasting photo to ${chatIds.length} target(s)...`);
  const results = [];
  for (const chatId of chatIds) {
    try {
      const res = await sendPhotoToChat(chatId, imagePath, caption);
      console.log(`✅ Sent photo to ${chatId}, message_id:`, res.message_id);
      results.push(res);
    } catch (error) {
      console.error(`❌ Failed to send photo to ${chatId}:`, error.message);
      results.push({ success: false, chatId, error: error.message });
    }
  }
  return { success: results.some(r => r.success), results };
}

export async function sendVideoToTelegram(videoPath, caption = '') {
  const token = TELEGRAM_BOT_TOKEN();
  const chatIds = TELEGRAM_CHAT_IDS();
  
  if (!token || chatIds.length === 0) {
    console.log('📋 Telegram not configured — skipping video notification');
    return { skipped: true, reason: 'not_configured' };
  }

  console.log(`📤 Broadcasting video reel to ${chatIds.length} target(s)...`);
  const results = [];
  for (const chatId of chatIds) {
    try {
      const res = await sendVideoToChat(chatId, videoPath, caption);
      console.log(`✅ Sent video to ${chatId}, message_id:`, res.message_id);
      results.push(res);
    } catch (error) {
      console.error(`❌ Failed to send video to ${chatId}:`, error.message);
      results.push({ success: false, chatId, error: error.message });
    }
  }
  return { success: results.some(r => r.success), results };
}

export async function sendCarousel(imagePaths, caption = '') {
  const token = TELEGRAM_BOT_TOKEN();
  const chatIds = TELEGRAM_CHAT_IDS();
  
  if (!token || chatIds.length === 0) {
    console.log('📋 Telegram not configured — skipping carousel');
    return { skipped: true };
  }

  console.log(`📤 Broadcasting carousel album to ${chatIds.length} target(s)...`);
  const results = [];
  for (const chatId of chatIds) {
    try {
      const res = await sendMediaGroupToChat(chatId, imagePaths, caption);
      console.log(`✅ Sent album to ${chatId}: ${res.count} messages`);
      results.push(res);
    } catch (error) {
      console.error(`❌ Carousel failed for ${chatId}:`, error.message);
      results.push({ success: false, chatId, error: error.message });
    }
  }
  return { success: results.some(r => r.success), results };
}

export async function sendMessage(text, parseMode = 'HTML') {
  const token = TELEGRAM_BOT_TOKEN();
  const chatIds = TELEGRAM_CHAT_IDS();
  if (!token || chatIds.length === 0) return { skipped: true };

  const results = [];
  for (const chatId of chatIds) {
    try {
      const res = await sendMessageToChat(chatId, text, { parse_mode: parseMode });
      results.push({ success: true, chatId, message_id: res.result?.message_id });
    } catch (error) {
      results.push({ success: false, chatId, error: error.message });
    }
  }
  return { success: results.some(r => r.success), results };
}

function sendMediaGroupRequest(token, chatId, imageBuffers, caption) {
  return new Promise((resolve, reject) => {
    const boundary = '----EOTCBoundary' + Date.now().toString(36);
    
    const mediaArray = imageBuffers.map((buf, i) => ({
      type: 'photo',
      media: `attach://slide${i}`,
      ...(i === 0 && caption ? { caption, parse_mode: 'HTML' } : {})
    }));

    const preHeader = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
      `${chatId}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="media"\r\n\r\n` +
      `${JSON.stringify(mediaArray)}\r\n`
    );

    const parts = [preHeader];

    imageBuffers.forEach((buf, i) => {
      const partHeader = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="slide${i}"; filename="slide_${i + 1}.png"\r\n` +
        `Content-Type: image/png\r\n\r\n`
      );
      parts.push(partHeader);
      parts.push(buf);
      parts.push(Buffer.from('\r\n'));
    });

    parts.push(Buffer.from(`--${boundary}--\r\n`));
    const body = Buffer.concat(parts);

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMediaGroup`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.ok) resolve(response);
          else reject(new Error(`Telegram API: ${response.description}`));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export async function testConnection() {
  const token = TELEGRAM_BOT_TOKEN();
  if (!token) return { configured: false };

  try {
    const response = await httpsRequest(`/bot${token}/getMe`);
    return { configured: true, bot: response.result, username: response.result?.username };
  } catch (error) {
    return { configured: false, error: error.message };
  }
}

export function isConfigured() {
  return !!(TELEGRAM_BOT_TOKEN() && TELEGRAM_CHAT_IDS().length > 0);
}

// ─── Named Export Aliases ──────────────────────────────────────────────────
export const sendImageToTelegram = sendToTelegram;
export const sendCarouselToTelegram = sendCarousel;