import { NormalizeSender } from './NormalizeSender';
import { Sender } from './Sender';
import { TelegramSender } from './TelegramSender';
import { ThrottleSender } from './ThrottleSender';
import { ValidateSender } from './ValidateSender';

export function createSender(token: string, chatId: string): Sender {
  let sender: Sender = new TelegramSender(token, chatId);

  sender = new ThrottleSender(sender);
  sender = new ValidateSender(sender);
  sender = new NormalizeSender(sender);

  return sender;
}
