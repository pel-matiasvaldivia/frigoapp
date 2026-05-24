const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const pino = require("pino");
require('dotenv').config();

// Ensure crypto is available globally for Baileys (Node 18/20 slim compatibility)
if (!global.crypto) {
    global.crypto = require('crypto');
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8889';

async function connectToWhatsApp() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Usando versión de WA: ${version.join('.')}, latest: ${isLatest}`);

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        version,
        auth: state,
        browser: Browsers.macOS('Desktop'),
        logger: pino({ level: 'debug' }),
        printQRInTerminal: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 15000,
        generateHighQualityLinkPreview: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('--- SCAN THE QR CODE BELOW ---');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ CONECTADO CON ÉXITO (MODO LIGERO)');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const sender = m.key.remoteJid;
        // Extract text from standard conversation or extended text (links, buttons, etc)
        const body = m.message.conversation || m.message.extendedTextMessage?.text;

        if (body) {
            const pushName = m.pushName || 'Usuario WhatsApp';
            console.log(`Mensaje de ${pushName} (${sender}): ${body}`);
            
            try {
                await axios.post(`${BACKEND_URL}/api/whatsapp/webhook`, {
                    from: sender,
                    body: body,
                    sender: { 
                        name: pushName,
                        number: sender
                    },
                    timestamp: m.messageTimestamp
                });
                console.log('Enviado al backend ok.');
            } catch (e) {
                console.error("Error al notificar al backend:", e.message);
            }
        }
    });
}

connectToWhatsApp().catch(err => console.log("Error fatal:", err));
