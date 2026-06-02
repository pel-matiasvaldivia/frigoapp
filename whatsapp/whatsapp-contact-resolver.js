const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

/**
 * Normalizes a WhatsApp JID or phone string to the format used in Excel/CSV: 
 * e.g. 5493515551234
 */
function normalizePhoneNumber(jid) {
  if (!jid) return '';
  // Remove @s.whatsapp.net or @lid
  let clean = jid.split('@')[0];
  // Remove any non-numeric characters
  clean = clean.replace(/\D/g, '');
  
  // Logic for Argentina (+54): 
  // If it's a 10 digit number starting with 3... it's likely 54 + 9 + number
  if (clean.length === 10 && (clean.startsWith('3') || clean.startsWith('2') || clean.startsWith('1'))) {
    return '549' + clean;
  }
  // If it's already 13 digits starting with 549... leave it
  if (clean.length === 13 && clean.startsWith('549')) {
    return clean;
  }
  // If it's 54 followed by 10 digits (missing the 9)
  if (clean.length === 12 && clean.startsWith('54')) {
    return '549' + clean.substring(2);
  }

  return clean;
}

/**
 * Resolves a WhatsApp contact by JID/LID.
 * If found in DB by phone or ID, it ensures the whatsapp_id is up to date.
 * Returns the client object or null.
 */
async function resolveWhatsappContact(senderJid) {
  const normalized = normalizePhoneNumber(senderJid);
  console.log(`[Resolver] Intentando resolver JID: ${senderJid} (Normalizado: ${normalized})`);

  try {
    // 1. Search by exactly whatsapp_id (highest priority)
    let res = await pool.query(
      'SELECT id, razon_social, whatsapp_id, telefono_whatsapp FROM clientes WHERE whatsapp_id = $1',
      [senderJid]
    );

    if (res.rows.length > 0) {
      console.log(`[Resolver] Cliente encontrado por whatsapp_id: ${res.rows[0].razon_social}`);
      return res.rows[0];
    }

    // 2. Search by normalized phone number
    res = await pool.query(
      'SELECT id, razon_social, whatsapp_id, telefono_whatsapp FROM clientes WHERE telefono_whatsapp = $1 OR telefono_whatsapp = $2',
      [normalized, normalized.replace('549', '')]
    );

    if (res.rows.length > 0) {
      const cliente = res.rows[0];
      console.log(`[Resolver] Cliente encontrado por teléfono: ${cliente.razon_social}. Actualizando whatsapp_id...`);
      
      // Auto-update whatsapp_id for next time
      await pool.query(
        'UPDATE clientes SET whatsapp_id = $1 WHERE id = $2',
        [senderJid, cliente.id]
      );
      
      return { ...cliente, whatsapp_id: senderJid };
    }

    console.log(`[Resolver] No se encontró cliente para ${senderJid}`);
    return null;
  } catch (err) {
    console.error('[Resolver] Error en base de datos:', err.message);
    return null;
  }
}

module.exports = {
  resolveWhatsappContact,
  normalizePhoneNumber
};
