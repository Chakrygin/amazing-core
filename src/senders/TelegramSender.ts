import { Telegram } from 'telegraf';

import { Sender } from './Sender';
import { Post, Link } from '../posts';

const MAX_CAPTION_LENGTH = 1024;
const MAX_MESSAGE_LENGTH = 4096;

export class TelegramSender implements Sender {
  constructor(
    private readonly token: string,
    private readonly chatId: string,
    private readonly debugChatId: string = chatId) { }

  private readonly telegram = new Telegram(this.token);

  async send(post: Post, debug: boolean): Promise<void> {
    const chatId = !debug ? this.chatId : this.debugChatId;
    const message = getTrimmedMessage(post);

    if (!post.image || message.length > MAX_CAPTION_LENGTH) {
      await this.telegram.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    }
    else if (isAnimation(post.image)) {
      await this.telegram.sendAnimation(chatId, post.image, {
        caption: message,
        parse_mode: 'HTML',
      });
    }
    else {
      await this.telegram.sendPhoto(chatId, post.image, {
        caption: message,
        parse_mode: 'HTML',
      });
    }
  }
}

function getTrimmedMessage(post: Post): string {
  if (!post.description) {
    return getMessage(post);
  }

  if (post.description.length <= 1) {
    return getMessage(post);
  }

  const originalMessage = getMessage(post);
  const maxLength = post.image ? MAX_CAPTION_LENGTH : MAX_MESSAGE_LENGTH;

  if (originalMessage.length > maxLength) {
    while (post.description.length > 1) {
      post.description.pop();

      const message = getMessage(post);
      if (message.length <= maxLength) {
        return message;
      }
    }
  }

  return originalMessage;
}

function getMessage(post: Post): string {
  const lines: string[] = [];

  lines.push(bold(link(post)))

  const line: string[] = [];

  if (post.categories.length > 0) {
    for (const category of post.categories) {
      line.push(link(category));
    }
  }

  if (post.author) {
    line.push(encode(post.author));
  }

  line.push(post.date.format('LL'));
  lines.push(bold(line.join(' | ')));

  if (post.description && post.description.length > 0) {
    for (const description of post.description) {
      lines.push(encode(description));
    }
  }

  if (post.links && post.links.length > 0) {
    const links = post.links
      .map(link => `${encode(link.title)}: ${link.href}`);

    lines.push(...links);
  }

  if (post.tags && post.tags.length > 0) {
    const tags = post.tags
      .map(tag => encode(tag))
      .join(', ');

    lines.push('🏷️ ' + tags);
  }

  return lines.join('\n\n');
}

function link(link: Link): string {
  return `<a href="${link.href}">${encode(link.title)}</a>`;
}

function bold(text: string): string {
  return `<b>${text}</b>`;
}

function encode(html: string) {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isAnimation(image: string, isLowerCase = false): boolean {
  let result = image.endsWith('.gif');

  if (!result && !isLowerCase) {
    image = image.toLowerCase();
    result = isAnimation(image, true);
  }

  return result;
}
