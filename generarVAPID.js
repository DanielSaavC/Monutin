// ============================================
// 🔑 GENERADOR DE CLAVES VAPID
// ============================================
// Ejecuta este script en Node.js para generar nuevas claves

const webpush = require('web-push');

console.log('🔑 Generando nuevas claves VAPID...\n');

// Generar claves
const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ Claves generadas exitosamente!\n');
console.log('📋 Copia estas claves a tu proyecto:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('🔹 CLAVE PÚBLICA (Frontend):');
console.log(vapidKeys.publicKey);
console.log('\n');

console.log('🔹 CLAVE PRIVADA (Backend):');
console.log(vapidKeys.privateKey);
console.log('\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📝 Actualiza estos archivos:\n');
console.log('1️⃣  pushNotifications.js:');
console.log('   const VAPID_PUBLIC_KEY = "' + vapidKeys.publicKey + '";\n');

console.log('2️⃣  server.js (o donde esté tu backend):');
console.log('   const VAPID_PUBLIC_KEY = "' + vapidKeys.publicKey + '";');
console.log('   const VAPID_PRIVATE_KEY = "' + vapidKeys.privateKey + '";\n');

console.log('⚠️  IMPORTANTE: Guarda la clave privada de forma segura!');
console.log('   No la compartas públicamente ni la subas a GitHub.\n');