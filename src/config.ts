import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
  return {
    verifyTokenWhatsappApi: process.env.VERIFY_TOKEN_WHATSAPP_API,
    tokenWhatsappApi: process.env.TOKEN_WHATSAPP_API,
    phoneNumberIdWhatsappApi: process.env.PHONE_NUMBER_ID_WHATSAPP_API,
  };
});
