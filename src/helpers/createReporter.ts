import { Reporter, TelegramReporter } from '../reporters';

export function createReporter(token: string, chatId: string): Reporter {
  const reporter = new TelegramReporter(token, chatId) as Reporter;

  return reporter;
}
