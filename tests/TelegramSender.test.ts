import moment from 'moment';

import { getInput } from '../src/helpers';
import { Post } from '../src/posts';
import { TelegramSender } from '../src/senders';

test('TelegramSender', async () => {

  const TELEGRAM_TOKEN = getInput('TELEGRAM_TOKEN');
  const TELEGRAM_CHAT_ID = getInput('TELEGRAM_PRIVATE_CHAT_ID');

  const sender = new TelegramSender(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID);

  const post: Post = {
    image: 'https://picsum.photos/800/600',
    title: 'Example message',
    href: 'https://example.org',
    categories: [
      {
        title: 'Example Category',
        href: 'https://example.org',
      }
    ],
    author: 'John Doe',
    date: moment(),
    description: [
      'This is first description line.',
      'This is second description line.',
      'This is third description line.',
    ],
    links: [
      {
        title: 'Reed more',
        href: 'https://example.org',
      },
    ],
    tags: [
      'First',
      'Second',
      'Third',
    ],
  };

  await sender.send(post, false);

});
