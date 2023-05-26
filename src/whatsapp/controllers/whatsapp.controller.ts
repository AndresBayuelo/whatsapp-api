import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WhatsappService } from '../services/whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Get('messaging-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiTags('whatsapp')
  @ApiOperation({ summary: 'Webhook to validate the WhatsApp API token' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    return this.whatsappService.validateToken(mode, token, challenge);
  }

  @Post('messaging-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiTags('whatsapp')
  @ApiOperation({ summary: 'Webhook to recieve messages from WhatsApp API' })
  recieveMessage(@Body() payload: any) {
    this.whatsappService.processMessage(payload);
  }
}
