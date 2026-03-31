import fs from 'fs';
import https from 'https';

const getEnv = (key) => process.env[key];

const TELEGRAM_BOT_TOKEN = () => getEnv('TELEGRAM_BOT_TOKEN');
const TELEGRAM_CHAT_ID = () => getEnv('TELEGRAM_CHAT_ID');

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
  const chatId = TELEGRAM_CHAT_ID();
  
  if (!token || !chatId) {
    console.log('📋 Telegram not configured - skipping notification');
    return { skipped: true, reason: 'not_configured' };
  }

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  const stats = fs.statSync(imagePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`Image too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE})`);
  }

  try {
    console.log('📤 Sending to Telegram, image size:', stats.size);
    
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
        console.log('✅ Image sent to Telegram, message_id:', response.result.message_id);
        return { success: true, message_id: response.result.message_id };
      } catch (error) {
        if (i === MAX_RETRIES - 1) throw error;
        const delay = 1000 * Math.pow(2, i);
        console.log(`⏳ Telegram retry in ${delay}ms... (${error.message})`);
        await sleep(delay);
      }
    }
  } catch (error) {
    console.error('❌ Telegram send failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function sendMessage(text, parseMode = 'HTML') {
  const token = TELEGRAM_BOT_TOKEN();
  const chatId = TELEGRAM_CHAT_ID();
  
  if (!token || !chatId) {
    return { skipped: true };
  }

  try {
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
        return { success: true, message_id: response.result.message_id };
      } catch (error) {
        if (i === MAX_RETRIES - 1) throw error;
        await sleep(1000 * Math.pow(2, i));
      }
    }
  } catch (error) {
    console.error('❌ Telegram message failed:', error.message);
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
  return !!(TELEGRAM_BOT_TOKEN() && TELEGRAM_CHAT_ID());
}

export async function sendCarousel(imagePaths, caption = '') {
  const token = TELEGRAM_BOT_TOKEN();
  const chatId = TELEGRAM_CHAT_ID();
  
  if (!token || !chatId) {
    console.log('📋 Telegram not configured - skipping carousel');
    return { skipped: true };
  }

  if (!imagePaths || imagePaths.length === 0) {
    throw new Error('No images to send');
  }

  for (const imagePath of imagePaths) {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found: ${imagePath}`);
    }
  }

  try {
    console.log(`📤 Sending carousel (${imagePaths.length} slides)...`);
    
    const messageIds = [];
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imageBuffer = fs.readFileSync(imagePaths[i]);
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      
      const slideCaption = i === 0 ? caption : undefined;
      const parseMode = i === 0 ? 'HTML' : undefined;
      
      const fields = {
        chat_id: chatId,
        photo: imageBuffer
      };
      if (slideCaption) fields.caption = slideCaption;
      if (parseMode) fields.parse_mode = parseMode;
      
      const body = buildCarouselSlideFormData(fields, boundary);
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const response = await sendMediaGroupRequest(`/bot${token}/sendPhoto`, body, boundary);
          messageIds.push(response.result.message_id);
          console.log(`✅ Slide ${i + 1}/${imagePaths.length} sent`);
          break;
        } catch (error) {
          if (attempt === MAX_RETRIES - 1) throw error;
          console.log(`⏳ Slide ${i + 1} retry in ${1000 * Math.pow(2, attempt)}ms...`);
          await sleep(1000 * Math.pow(2, attempt));
        }
      }
      
      if (i < imagePaths.length - 1) {
        await sleep(500);
      }
    }
    
    console.log(`✅ Carousel sent: ${messageIds.length}/${imagePaths.length} slides`);
    return { success: true, message_ids: messageIds };
  } catch (error) {
    console.error('❌ Carousel send failed:', error.message);
    return { success: false, error: error.message };
  }
}

function buildCarouselSlideFormData(fields, boundary) {
  let parts = [];
  
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'photo') {
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="photo"; filename="slide.png"\r\n` +
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

function sendMediaGroupRequest(path, body, boundary) {
  return new Promise((resolve, reject) => {
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