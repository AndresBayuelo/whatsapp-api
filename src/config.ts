import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
  return {
    port: parseInt(process.env.PORT, 10) || 3000,
    mongo: {
      dbName: process.env.MONGO_DB,
      user: process.env.MONGO_INITDB_ROOT_USERNAME,
      password: process.env.MONGO_INITDB_ROOT_PASSWORD,
      port: parseInt(process.env.MONGO_PORT, 10),
      host: process.env.MONGO_HOST,
      connection: process.env.MONGO_CONNECTION,
    },
    verifyTokenWhatsappApi: process.env.VERIFY_TOKEN_WHATSAPP_API,
    tokenWhatsappApi: process.env.TOKEN_WHATSAPP_API,
    phoneNumberIdWhatsappApi: process.env.PHONE_NUMBER_ID_WHATSAPP_API,
    openaiApiKey: process.env.OPENAI_API_KEY,
  };
});
