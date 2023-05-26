import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import config from 'src/config';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
    private readonly httpService: HttpService,
  ) {}

  validateToken(mode: string, token: string, challenge: string): string {
    if (mode && token) {
      if (
        mode === 'subscribe' &&
        token === this.configService.verifyTokenWhatsappApi
      ) {
        this.logger.log('Webhook validated');
        return challenge;
      }
    }
    throw new UnauthorizedException(
      'Failed validation. Make sure the validation tokens match.',
    );
  }

  processMessage(payload: any) {
    if (payload.object) {
      if (
        payload.entry &&
        payload.entry[0].changes &&
        payload.entry[0].changes[0] &&
        payload.entry[0].changes[0].value.messages &&
        payload.entry[0].changes[0].value.messages[0]
      ) {
        const phone_number_id =
          payload.entry[0].changes[0].value.metadata.phone_number_id;
        const from = payload.entry[0].changes[0].value.messages[0].from;
        const msg_body =
          payload.entry[0].changes[0].value.messages[0].text.body;
        this.logger.log(
          'Phone number id ' +
            phone_number_id +
            ' received message "' +
            msg_body +
            '" from ' +
            from,
        );
        this.sendMessage(from, 'Hello from NestJS!');
      }
    }
    throw new BadRequestException();
  }

  async sendMessage(phoneNumber: string, message: string) {
    const url = `https://graph.facebook.com/v16.0/${this.configService.phoneNumberIdWhatsappApi}/messages?access_token=${this.configService.tokenWhatsappApi}`;
    const data = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      text: { body: 'Ack: ' + message },
    };
    await firstValueFrom(
      this.httpService.post(url, data).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data);
          throw 'An error happened!';
        }),
      ),
    );
    this.logger.log(
      'Message sent to phone number ' +
        phoneNumber +
        ' with body "' +
        message +
        '"',
    );
  }
}
