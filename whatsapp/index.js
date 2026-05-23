const wa = require('@open-wa/wa-automate');
const axios = require('axios');
require('dotenv').config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';
const WEBHOOK_PATH = '/api/whatsapp/webhook';

async function start() {
  console.log('--- Starting WhatsApp Bot ---');
  
  try {
    const client = await wa.create({
      sessionId: "FRIGO_SESSION",
      multiDevice: true,
      authTimeout: 60,
      blockCrashLogs: true,
      disableSpins: true,
      headless: true,
      hostNotificationLang: 'es-AR',
      logConsole: false,
      popup: true,
      qrTimeout: 0,
      sessionDataPath: './session',
    });

    console.log('WhatsApp Bot is Ready!');

    // Handle incoming messages
    client.onMessage(async (message) => {
      // Ignore broadcast/group messages for now to keep it clean
      if (message.isGroupMsg) return;

      console.log(`New message from ${message.from}: ${message.body}`);

      try {
        await axios.post(`${BACKEND_URL}${WEBHOOK_PATH}`, {
          from: message.from,
          body: message.body,
          sender: {
            name: message.sender.pushname,
            number: message.sender.id
          },
          timestamp: message.t
        });
      } catch (err) {
        console.error('Error forwarding message to backend:', err.message);
      }
    });

    // Handle incoming calls (reject and notify)
    client.onIncomingCall(async (call) => {
      await client.sendText(call.peerJid, 'Lo siento, no puedo recibir llamadas. Por favor envíe su pedido por mensaje de texto.');
    });

  } catch (err) {
    console.error('Fatal error starting WhatsApp client:', err);
    process.exit(1);
  }
}

// Start the bot
start();
