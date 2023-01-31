import { NormalizeSender, Sender, TelegramSender, ThrottleSender, ValidateSender } from '../senders';

export function createSender(token: string, chatId: string, debugChatId: string = chatId): Sender {
  let sender = new TelegramSender(token, chatId, debugChatId) as Sender;

  sender = new ThrottleSender(sender);
  sender = new ValidateSender(sender);
  sender = new NormalizeSender(sender);

  return sender;
}
