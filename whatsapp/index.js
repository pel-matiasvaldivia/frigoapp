const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    Browsers, 
    fetchLatestBaileysVersion,
    downloadMediaMessage
} = require("@whiskeysockets/baileys");
const qrcodeTerminal = require("qrcode-terminal");
const QRCode = require("qrcode");
const axios = require("axios");
const pino = require("pino");
const express = require("express");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Simple state management
let currentQR = null;
let connectionStatus = 'disconnected';

// Express Server to expose status and QR
const app = express();
app.get('/status', async (req, res) => {
    let qrBase64 = null;
    if (currentQR) {
        qrBase64 = await QRCode.toDataURL(currentQR);
    }
    res.json({ status: connectionStatus, qr: qrBase64 });
});
app.listen(3001, () => console.log('Bot API listening on port 3001'));

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
            currentQR = qr; // Store for Express
            console.log('--- SCAN THE QR CODE BELOW ---');
            qrcodeTerminal.generate(qr, { small: true });
        }

        if (connection === 'close') {
            connectionStatus = 'disconnected';
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            connectionStatus = 'connected';
            currentQR = null; // Clear QR once connected
            console.log('✅ CONECTADO CON ÉXITO (MODO LIGERO)');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const senderJid = m.key.remoteJid;
        const pushName = m.pushName || 'Usuario WhatsApp';
        
        // WhatsApp is using LID (Linked Identity) instead of PN (Phone Number) JIDs.
        // We need to extract the real phone number if it's an LID.
        let fromNumber = senderJid;
        
        // If it's an LID, try to find the PN in the message metadata
        // In the logs we saw "sender_pn". Baileys stores this in some places.
        // If the JID ends in @lid, we try to get the PN from the message info.
        if (senderJid.endsWith('@lid')) {
            // Check if there's a stored PN in the message
            // or if we can get it from the contact info
            const contact = m.key.participant || m.participant || '';
            if (contact && contact.includes('@s.whatsapp.net')) {
                fromNumber = contact;
            }
        }

        let body = m.message.conversation || m.message.extendedTextMessage?.text;

        // --- NEW: Audio / Voice Note Handling ---
        const isAudio = m.message.audioMessage;
        if (isAudio) {
            console.log(`Audio detectado de ${pushName} (${fromNumber}). Transcribiendo...`);
            try {
                const buffer = await downloadMediaMessage(m, 'buffer', {});
                const tempFile = path.join('/tmp', `audio_${Date.now()}.ogg`);
                fs.writeFileSync(tempFile, buffer);

                const transcription = await openai.audio.transcriptions.create({
                    file: fs.createReadStream(tempFile),
                    model: "whisper-1",
                });
                
                body = transcription.text;
                console.log(`Transcripción Exitosa: "${body}"`);
                
                // Cleanup
                fs.unlinkSync(tempFile);
            } catch (err) {
                console.error("Error procesando audio:", err.message);
                // We don't return here so it can still try to process any text if it was a hybrid? 
                // Usually it's either text or audio.
            }
        }

        if (body) {
            console.log(`Mensaje de ${pushName} (${fromNumber}): ${body}`);
            
            try {
                await axios.post(`${BACKEND_URL}/api/whatsapp/webhook`, {
                    from: fromNumber,
                    body: body,
                    sender: { 
                        name: pushName,
                        number: fromNumber
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
