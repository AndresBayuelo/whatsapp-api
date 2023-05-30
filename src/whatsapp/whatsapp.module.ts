import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { WhatsappController } from './controllers/whatsapp.controller';
import { WhatsappService } from './services/whatsapp.service';
import { ChatgptModule } from 'src/chatgpt/chatgpt.module';

@Module({
  imports: [HttpModule, ChatgptModule],
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class WhatsappModule {}
