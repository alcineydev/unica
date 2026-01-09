const webpush = require('web-push');

// Gerar novo par de VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('');
console.log('='.repeat(60));
console.log('🔑 NOVAS VAPID KEYS GERADAS');
console.log('='.repeat(60));
console.log('');
console.log('Copie estas chaves para as variáveis de ambiente na Vercel:');
console.log('');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=');
console.log(vapidKeys.publicKey);
console.log('');
console.log('VAPID_PRIVATE_KEY=');
console.log(vapidKeys.privateKey);
console.log('');
console.log('VAPID_SUBJECT=');
console.log('mailto:admin@unicabeneficios.com.br');
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('1. Atualize AMBAS as variáveis na Vercel (Settings > Environment Variables)');
console.log('2. Faça redeploy do projeto');
console.log('3. Delete todas as subscriptions antigas no banco');
console.log('4. Peça para os usuários permitirem notificações novamente');
console.log('');
