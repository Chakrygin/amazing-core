import moment from 'moment';

import { ScraperBase } from '../ScraperBase';
import { Link, Post } from '../../models';

export abstract class DevBlogsScraperBase extends ScraperBase {
  constructor(
    private readonly id: string,
    private readonly title: string) {
    super();
  }

  readonly name = `DevBlogs / ${this.title}`;
  readonly path = `devblogs.microsoft.com/${this.id}`;

  private readonly DevBlogs: Link = {
    title: 'DevBlogs',
    href: 'https://devblogs.microsoft.com',
  };

  private readonly blog: Link = {
    title: this.title,
    href: `https://devblogs.microsoft.com/${this.id}/`,
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.blog.href)
      .fetchPosts('main section div.masonry-container div.masonry-card', ($, element) => {

        const thumbnail = element.find('div.masonry-thumbnail');
        const image = thumbnail.find('>img').attr('src');
        const header = element.find('h3');
        const link = header.find('>a');
        const title = link.text();
        const href = link.attr('href') ?? '';
        const date = thumbnail
          .next()
          .children()
          .children()
          .last()
          .text();

        const description = header
          .next()
          .find('p')
          .map((_, p) => $(p).text().trim())
          .filter((_, line) => !!line)
          .toArray();

        return {
          image,
          title,
          href,
          categories: [this.DevBlogs, this.blog],
          date: moment(date, 'LL'),
          description,
        };

      });
  }
}
