import strapi from '@strapi/strapi';

async function checkWebhooks() {
  const app = await strapi().load();
  console.log(app.get('webhookStore'));
  process.exit(0);
}

checkWebhooks();
