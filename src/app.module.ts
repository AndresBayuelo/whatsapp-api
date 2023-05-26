import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { environments } from './environments';
import config from './config';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: environments[process.env.NODE_ENV] || '.env',
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        VERIFY_TOKEN_WHATSAPP_API: Joi.string().required(),
        TOKEN_WHATSAPP_API: Joi.string().required(),
        PHONE_NUMBER_ID_WHATSAPP_API: Joi.string().required(),
      }),
    }),
    WhatsappModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
