import { Injectable, Inject, Logger, Catch } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Configuration, OpenAIApi } from 'openai';
import config from 'src/config';

@Injectable()
@Catch()
export class ChatgptService {
  private readonly logger = new Logger(ChatgptService.name);
  private readonly openai: OpenAIApi;
  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {
    const configuration: Configuration = new Configuration({
      apiKey: this.configService.openaiApiKey,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async sendMessages(
    messages: any[] = [],
    newPromptBody: string,
    newPromptId: number,
    shipDate: string,
    dateProcessed: string,
  ): Promise<any[]> {
    if (messages.length === 0) {
      const context: any = {
        role: 'system',
        content:
          'Eres un asistente muy útil que solo respondera preguntas de programación.',
        date_processed: dateProcessed,
      };
      messages.push(context);
    }
    messages.push({
      role: 'user',
      content: newPromptBody,
      id: newPromptId,
      ship_date: shipDate,
      date_processed: dateProcessed,
    });

    const messagesCleaned: any[] = this.cleanMessages(messages);
    let responseMessage: string;
    await this.openai
      .createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messagesCleaned,
      })
      .then((res) => {
        responseMessage = res.data.choices[0].message.content;
      })
      .catch((err) => {
        responseMessage =
          'Error al procesar la solicitud por la API de OpenAI.';
        this.logger.error(err.message, err.stack);
      });

    messages.push({
      role: 'assistant',
      content: responseMessage,
      date_processed: dateProcessed,
      respond_message_id: newPromptId,
    });
    return messages;
  }

  cleanMessages(messages: any[] = []): any[] {
    return messages.map((message) => {
      return { role: message.role, content: message.content };
    });
  }
}
