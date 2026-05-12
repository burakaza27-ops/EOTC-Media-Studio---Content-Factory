import fs from 'fs';
import https from 'https';

const getEnv = (key) => process.env[key];

const TELEGRAM_BOT_TOKEN = () => getEnv('TELEGRAM_BOT_TOKEN');
const TELEGRAM_CHAT_IDS = () => {
  const ids = getEnv('TELEGRAM_CHAT_ID');
  if (!ids) return [];
  return ids.split(',').map(id => id.trim()).filter(id => id.length > 0);
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpsRequest(path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      path: path,
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {}
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.ok) resolve(response);
          else reject(new Error(response.description));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function buildMultipartFormData(fields, boundary) {
  let parts = [];
  
  for (const [key, value] of Object.entries(fields)) {
    if (value instanceof Buffer) {
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${key}"; filename="quote.png"\r\n` +
        `Content-Type: image/png\r\n\r\n`
      ));
      parts.push(value);
      parts.push(Buffer.from('\r\n'));
    } else {
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
        `${value}\r\n`
      ));
    }
  }
  
  return Buffer.concat([...parts, Buffer.from(`--${boundary}--\r\n`)]);
}

function httpsMultipartRequest(path, fields) {
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
          else reject(new Error(response.description));
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

export async function sendToTelegram(imagePath, caption) {
  const token = TELEGRAM_BOT_TOKEN();
  const chatIds = TELEGRAM_CHAT_IDS();
  
  if (!token || chatIds.length === 0) {
    console.log('📋 Telegram not configured — skipping notification');
    return { skipped: true, reason: 'not_configured' };
  }

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  const stats = fs.statSync(imagePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`Image too large: ${(stats.size / 1024 / 1024).toFixed(1)}MB (max: 10MB)`);
  }

  try {
    console.log(`📤 Sending to Telegram (${(stats.size / 1024 / 1024).toFixed(2)}MB)...`);
    const results = [];
    
    for (const chatId of chatIds) {
      console.log(`📤 Sending to group: ${chatId}`);
      let sent = false;
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          const response = await httpsMultipartRequest(
            `/bot${token}/sendPhoto`,
            {
              chat_id: chatId,
              photo: fs.readFileSync(imagePath),
              caption: caption,
              parse_mode: 'HTML'
            }
          );
          console.log(`✅ Sent to ${chatId}, message_id:`, response.result.message_id);
          results.push({ success: true, chatId, message_id: response.result.message_id });
          sent = true;
          break;
        } catch (error) {
          if (i === MAX_RETRIES - 1) {
            console.error(`❌ Failed to send to ${chatId}:`, error.message);
            results.push({ success: false, chatId, error: error.message });
          } else {
            const delay = 1000 * Math.pow(2, i);
            console.log(`⏳ Telegram retry for ${chatId} in ${delay}ms... (${error.message})`);
            await sleep(delay);
          }
        }
      }
    }
    return { success: results.some(r => r.success), results };
  } catch (error) {
    console.error('❌ Telegram broadcast failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function sendMessage(text, parseMode = 'HTML') {
  const token = TELEGRAM_BOT_TOKEN();
  const chatIds = TELEGRAM_CHAT_IDS();
  
  if (!token || chatIds.length === 0) {
    return { skipped: true };
  }

  const results = [];
  try {
    for (const chatId of chatIds) {
      for (let i = 0; i < MAX_RETRIES; i++) {
        try {
          const response = await httpsRequest(
            `/bot${token}/sendMessage`,
            {
              chat_id: chatId,
              text: text,
              parse_mode: parseMode
            }
          );
          results.push({ success: true, chatId, message_id: response.result.message_id });
          break;
        } catch (error) {
          if (i === MAX_RETRIES - 1) {
            results.push({ success: false, chatId, error: error.message });
          } else {
            await sleep(1000 * Math.pow(2, i));
          }
        }
      }
    }
    return { success: results.some(r => r.success), results };
  } catch (error) {
    console.error('❌ Telegram message broadcast failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function testConnection() {
  const token = TELEGRAM_BOT_TOKEN();
  if (!token) {
    return { configured: false };
  }

  try {
    const response = await httpsRequest(`/bot${token}/getMe`);
    return { configured: true, bot: response.result, username: response.result.username };
  } catch (error) {
    return { configured: false, error: error.message };
  }
}

export function isConfigured() {
  return !!(TELEGRAM_BOT_TOKEN() && TELEGRAM_CHAT_IDS().length > 0);
}

export async function sendCarousel(imagePaths, caption = '') {
  const token = TELEGRAM_BOT_TOKEN();
  const chatIds = TELEGRAM_CHAT_IDS();
  
  if (!token || chatIds.length === 0) {
    console.log('📋 Telegram not configured — skipping carousel');
    return { skipped: true };
  }

  if (!imagePaths || imagePaths.length === 0) {
    throw new Error('No images to send');
  }

  // Validate all files exist and check sizes
  for (const imagePath of imagePaths) {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found: ${imagePath}`);
    }
    const sz = fs.statSync(imagePath).size;
    if (sz > MAX_FILE_SIZE) {
      console.warn(`⚠️ Slide ${imagePath} is ${(sz/1024/1024).toFixed(1)}MB — may be rejected by Telegram`);
    }
  }

  // Read all image buffers
  const imageBuffers = imagePaths.map(p => fs.readFileSync(p));

  try {
    console.log(`📤 Sending carousel album (${imagePaths.length} slides) to ${chatIds.length} group(s)...`);
    const results = [];

    for (const chatId of chatIds) {
      console.log(`📤 Sending album to group: ${chatId}`);
      let sent = false;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const response = await sendMediaGroupRequest(token, chatId, imageBuffers, caption);
          console.log(`✅ Carousel album sent to ${chatId}: ${response.result.length} messages`);
          results.push({ success: true, chatId, count: response.result.length });
          sent = true;
          break;
        } catch (error) {
          if (attempt === MAX_RETRIES - 1) {
            console.error(`❌ Carousel failed for ${chatId}:`, error.message);
            results.push({ success: false, chatId, error: error.message });
          } else {
            const delay = 1500 * Math.pow(2, attempt);
            console.log(`⏳ Retrying carousel for ${chatId} in ${delay}ms...`);
            await sleep(delay);
          }
        }
      }
    }

    return { success: results.some(r => r.success), results };
  } catch (error) {
    console.error('❌ Carousel broadcast failed:', error.message);
    return { success: false, error: error.message };
  }
}

function sendMediaGroupRequest(token, chatId, imageBuffers, caption) {
  return new Promise((resolve, reject) => {
    const boundary = '----EOTCBoundary' + Date.now().toString(36);
    
    // Build media JSON array — first image gets the caption
    const mediaArray = imageBuffers.map((buf, i) => ({
      type: 'photo',
      media: `attach://slide${i}`,
      ...(i === 0 && caption ? { caption, parse_mode: 'HTML' } : {})
    }));

    // Build multipart body
    const parts = [];

    // chat_id field
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
      `${chatId}\r\n`
    ));

    // media field (JSON)
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="media"\r\n\r\n` +
      `${JSON.stringify(mediaArray)}\r\n`
    ));

    // Each image as attach://slideN
    imageBuffers.forEach((buf, i) => {
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="slide${i}"; filename="slide${i}.png"\r\n` +
        `Content-Type: image/png\r\n\r\n`
      ));
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

// ─── Named Export Aliases (used by index.js) ────────────────────────────────
export const sendImageToTelegram = sendToTelegram;
export const sendCarouselToTelegram = sendCarousel;