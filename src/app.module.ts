import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { environments } from './environments';
import config from './config';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ChatgptModule } from './chatgpt/chatgpt.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: environments[process.env.NODE_ENV] || '.env',
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        MONGO_INITDB_ROOT_USERNAME: Joi.string().required(),
        MONGO_INITDB_ROOT_PASSWORD: Joi.string().required(),
        MONGO_DB: Joi.string().required(),
        MONGO_PORT: Joi.number().required(),
        MONGO_HOST: Joi.string().required(),
        MONGO_CONNECTION: Joi.string().required(),
        VERIFY_TOKEN_WHATSAPP_API: Joi.string().required(),
        TOKEN_WHATSAPP_API: Joi.string().required(),
        PHONE_NUMBER_ID_WHATSAPP_API: Joi.string().required(),
        OPENAI_API_KEY: Joi.string().required(),
      }),
    }),
    WhatsappModule,
    ChatgptModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
