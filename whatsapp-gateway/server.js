import express from 'express';
import QRCode from 'qrcode';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { rm } from 'node:fs/promises';
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT || 3001);
const API_KEY = process.env.WA_API_KEY || 'baileys_free_gateway';
const AUTH_DIR = process.env.WA_AUTH_DIR || './auth';

let sock = null;
let qrDataUrl = '';
let isReady = false;
let connecting = false;

function normalizePhone(raw) {
  let phone = String(raw ?? '').replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) {
    phone = '62' + phone.slice(1);
  }
  return phone;
}

function checkAuth(req, res) {
  if (API_KEY && req.headers.authorization !== API_KEY) {
    res.status(401).json({ success: false, message: 'Unauthorized API key' });
    return false;
  }
  return true;
}

async function clearAuth() {
  try {
    await rm(AUTH_DIR, { recursive: true, force: true });
  } catch (err) {
    console.error('[WA Gateway] Failed to clear auth dir:', err);
  }
}

async function connect() {
  if (connecting) return;
  connecting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'warn' }),
      printQRInTerminal: false,
      browser: ['KasirSewa Gateway', 'Chrome', '1.0.0'],
      syncFullHistory: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          qrDataUrl = await QRCode.toDataURL(qr);
          isReady = false;
          console.log('[WA Gateway] QR updated. Scan via /qr endpoint.');
        } catch (err) {
          console.error('[WA Gateway] Failed to render QR:', err);
        }
      }

      if (connection === 'open') {
        isReady = true;
        qrDataUrl = '';
        console.log('[WA Gateway] Baileys socket open. Ready to send.');
      }

      if (connection === 'close') {
        isReady = false;
        connecting = false;
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        if (loggedOut) {
          console.warn('[WA Gateway] Logged out from WhatsApp. Clearing session, waiting for fresh pairing.');
          await clearAuth();
          qrDataUrl = '';
          setTimeout(connect, 1000);
        } else {
          console.warn(`[WA Gateway] Connection closed (code ${statusCode}). Reconnecting...`);
          setTimeout(connect, 3000);
        }
      }
    });
  } catch (err) {
    connecting = false;
    console.error('[WA Gateway] Connect failed, retrying:', err?.message || err);
    setTimeout(connect, 5000);
  }
}

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
      <head><meta http-equiv="refresh" content="30"><title>Scan QR WhatsApp</title></head>
      <body style="font-family: sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; background:#0f172a; color:#f8fafc;">
        <div style="text-align:center; padding:2rem; background:#1e293b; border-radius:12px;">
          <h2>📱 Pindai QR Code WhatsApp</h2>
          <p>Gunakan fitur Linked Devices / Perangkat Tertaut pada WhatsApp HP Anda.</p>
          <img src="${qrDataUrl}" alt="QR WhatsApp" style="width:260px; height:260px; border-radius:8px; margin:1rem 0; background:white; padding:8px;" />
          <p style="font-size:0.85rem; color:#94a3b8;">Halaman otomatis diperbarui tiap 30 detik</p>
        </div>
      </body>
    </html>
  `);
});

app.post('/send', async (req, res) => {
  if (!checkAuth(req, res)) return;

  if (!isReady || !sock) {
    return res.status(503).json({ success: false, message: 'WhatsApp session is not ready. Scan QR at /qr' });
  }

  const { target, phone, message } = req.body || {};
  const cleanPhone = normalizePhone(target || phone);

  if (!cleanPhone || !message) {
    return res.status(422).json({ success: false, message: 'Target phone and message are required' });
  }

  const jid = `${cleanPhone}@s.whatsapp.net`;

  try {
    // Batasi pengecekan nomor (maks 8 detik): kalau server WA lambat,
    // teruskan pengiriman apa adanya daripada menggantung request.
    const onWa = await Promise.race([
      sock.onWhatsApp(jid).catch(() => null),
      new Promise((resolve) => setTimeout(() => resolve('timeout'), 8000)),
    ]);
    if (Array.isArray(onWa) && onWa[0] && !onWa[0].exists) {
      return res.status(422).json({ success: false, message: 'Number is not registered on WhatsApp' });
    }

    const destJid = Array.isArray(onWa) && onWa[0]?.jid ? onWa[0].jid : jid;
    await sock.sendMessage(destJid, { text: String(message) });
    return res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('[WA Gateway] Failed to send message:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Failed to send message via WhatsApp', error: err?.message });
  }
});

app.post('/logout', async (req, res) => {
  if (!checkAuth(req, res)) return;

  try {
    await sock?.logout();
  } catch (err) {
    console.error('[WA Gateway] Logout error:', err?.message || err);
  }

  // The 'close' handler clears the session and restarts pairing.
  return res.json({ success: true, message: 'Logged out. Scan the new QR at /qr' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[WA Gateway] Baileys gateway running on port ${PORT}`);
  connect();
});
