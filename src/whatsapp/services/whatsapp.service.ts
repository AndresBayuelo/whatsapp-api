import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Db } from 'mongodb';
import { ObjectId } from 'mongodb';
import config from 'src/config';
import { ChatgptService } from 'src/chatgpt/services/chatgpt.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
    @Inject('MONGO') private database: Db,
    private readonly httpService: HttpService,
    private readonly chatgptService: ChatgptService,
  ) {}

  validateToken(mode: string, token: string, challenge: string): string {
    if (mode && token) {
      if (
        mode === 'subscribe' &&
        token === this.configService.whatsappApi.verifyToken
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
    try {
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
          const user_name =
            payload.entry[0].changes[0].value.contacts[0].profile.name;
          const msg_body =
            payload.entry[0].changes[0].value.messages[0].text.body;
          const messageId = payload.entry[0].changes[0].value.messages[0].id;
          const timestamp =
            payload.entry[0].changes[0].value.messages[0].timestamp;
          this.logger.log(
            'Phone number id ' +
              phone_number_id +
              ' received message "' +
              msg_body +
              '" from ' +
              from,
          );
          this.getChat(from).then((chat) => {
            if (chat.length > 0) {
              const messageFound = chat[0].messages.find(
                (message) => message.id === messageId,
              );
              if (!messageFound) {
                this.chatgptService
                  .sendMessages(
                    chat[0].messages,
                    msg_body,
                    messageId,
                    this.getDateTime(timestamp),
                    this.getDateTime(),
                  )
                  .then((messages) => {
                    this.updateChat(chat[0]._id, messages);
                    this.sendMessage(
                      from,
                      messages[messages.length - 1].content,
                    );
                  });
              } else {
                const messages = chat[0].messages;
                const messageIndex = messages.findIndex(
                  (message) => message.id === messageId,
                );
                messages[messageIndex].times_received =
                  messages[messageIndex].times_received + 1;
                this.updateChat(chat[0]._id, messages);
              }
            } else {
              this.chatgptService
                .sendMessages(
                  [],
                  msg_body,
                  messageId,
                  this.getDateTime(timestamp),
                  this.getDateTime(),
                )
                .then((messages) => {
                  this.createChatMessages(from, user_name, messages);
                  this.sendMessage(from, messages[messages.length - 1].content);
                });
            }
          });
        }
        return;
      }
      throw new BadRequestException();
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  getChat(phoneNumber: string): Promise<any[]> {
    const collection = this.database.collection('chat');
    const chat = collection
      .find({ phone_number: phoneNumber })
      .sort({ _id: -1 })
      .limit(1)
      .toArray();
    return chat;
  }

  updateChat(id: ObjectId, messages: any[]): Promise<any> {
    const collection = this.database.collection('chat');
    const chat = collection.updateOne(
      { _id: id },
      {
        $set: {
          messages: messages,
          updatedAt: this.getDateTime(),
        },
      },
    );
    return chat;
  }

  createChatMessages(
    phoneNumber: string,
    userName: string,
    messages: any[],
  ): Promise<any> {
    const collection = this.database.collection('chat');
    const chat = collection.insertOne({
      phone_number: phoneNumber,
      user_name: userName,
      messages: messages,
      createdAt: this.getDateTime(),
      updatedAt: this.getDateTime(),
    });
    return chat;
  }

  async sendMessage(phoneNumber: string, message: string) {
    const url = `${this.configService.whatsappApi.url}/${this.configService.whatsappApi.phoneNumberId}/messages?access_token=${this.configService.whatsappApi.token}`;
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

  getDateTime(timestamp: number = null): string {
    const options = {
      timeZone: 'America/Bogota',
      hour12: false,
    };
    let localDateTime = timestamp
      ? new Date(timestamp * 1000).toLocaleString('en-US', options)
      : new Date().toLocaleString('en-US', options);
    localDateTime = localDateTime.replace(',', '');
    return localDateTime;
  }
}
