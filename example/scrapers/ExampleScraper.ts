import moment from 'moment';

import { Scraper } from '../../src/scrapers';
import { Post } from '../../src/posts';

export default class ExampleScraper implements Scraper {
  readonly name = 'Example';
  readonly path = 'example.org';

  // eslint-disable-next-line @typescript-eslint/require-await
  async *scrape(): AsyncGenerator<Post, void> {

    const post: Post = {
      image: 'https://picsum.photos/800/600',
      title: 'Example message',
      href: 'https://example.org',
      categories: [
        {
          title: 'Example Category',
          href: 'https://example.org',
        },
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

    yield post;

  }
}
