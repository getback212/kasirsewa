import express from 'express';
import QRCode from 'qrcode';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.WA_API_KEY || 'baileys_free_gateway';

let qrDataUrl = '';
let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

client.on('qr', async (qr) => {
  try {
    qrDataUrl = await QRCode.toDataURL(qr);
    isReady = false;
    console.log('[WA Gateway] QR Code updated. Scan via /qr endpoint.');
  } catch (err) {
    console.error('[WA Gateway] Failed to generate QR Data URL', err);
  }
});

client.on('ready', () => {
  isReady = true;
  qrDataUrl = '';
  console.log('[WA Gateway] WhatsApp Web client is ready.');
});

client.on('authenticated', () => {
  console.log('[WA Gateway] Client authenticated.');
});

client.on('auth_failure', (msg) => {
  isReady = false;
  console.error('[WA Gateway] Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
  isReady = false;
  console.warn('[WA Gateway] Client disconnected:', reason);
  client.initialize();
});

client.initialize();

app.get('/health', (req, res) => {
  res.json({ ready: isReady });
});

app.get('/qr', (req, res) => {
  if (isReady) {
    return res.type('html').send(`
      <!DOCTYPE html>
      <html>
        <head><title>WhatsApp Gateway - Connected</title></head>
        <body style="font-family: sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; background:#0f172a; color:#f8fafc;">
          <div style="text-align:center; padding:2rem; background:#1e293b; border-radius:12px;">
            <h1 style="color:#22c55e;">✅ WhatsApp Terhubung</h1>
            <p>Perangkat WhatsApp siap digunakan untuk pengiriman OTP &amp; Notifikasi.</p>
          </div>
        </body>
      </html>
    `);
  }

  if (!qrDataUrl) {
    return res.type('html').send(`
      <!DOCTYPE html>
      <html>
        <head><meta http-equiv="refresh" content="3"><title>WhatsApp Gateway - Loading</title></head>
        <body style="font-family: sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; background:#0f172a; color:#f8fafc;">
          <div style="text-align:center; padding:2rem; background:#1e293b; border-radius:12px;">
            <h2>⏳ Menyiapkan QR Code...</h2>
            <p>Halaman ini akan otomatis memuat ulang dalam 3 detik.</p>
          </div>
        </body>
      </html>
    `);
  }

  res.type('html').send(`
    <!DOCTYPE html>
    <html>
      <head><meta http-equiv="refresh" content="10"><title>Scan QR WhatsApp</title></head>
      <body style="font-family: sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; background:#0f172a; color:#f8fafc;">
        <div style="text-align:center; padding:2rem; background:#1e293b; border-radius:12px;">
          <h2>📱 Pindai QR Code WhatsApp</h2>
          <p>Gunakan fitur Linked Devices / Perangkat Tertaut pada WhatsApp HP Anda.</p>
          <img src="${qrDataUrl}" alt="QR WhatsApp" style="width:260px; height:260px; border-radius:8px; margin:1rem 0; background:white; padding:8px;" />
          <p style="font-size:0.85rem; color:#94a3b8;">Halaman otomatis diperbarui tiap 10 detik</p>
        </div>
      </body>
    </html>
  `);
});

app.post('/send', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (API_KEY && authHeader !== API_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized API key' });
  }

  if (!isReady) {
    return res.status(503).json({ success: false, message: 'WhatsApp Web client is not ready. Scan QR at /wa-qr' });
  }

  const { target, phone, message } = req.body || {};
  let rawPhone = target || phone;

  if (!rawPhone || !message) {
    return res.status(422).json({ success: false, message: 'Target phone and message are required' });
  }

  let cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  const chatId = `${cleanPhone}@c.us`;

  try {
    await client.sendMessage(chatId, message);
    return res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('[WA Gateway] Failed to send message:', err);
    return res.status(500).json({ success: false, message: 'Failed to send message via WhatsApp', error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[WA Gateway] Running on port ${PORT}`);
});
