import * as cheerio from 'cheerio';
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

        const image = element.find('div.masonry-thumbnail>img').attr('data-src');
        const header = element.find('h3');
        const link = header.find('>a');
        const title = link.text();
        const href = link.attr('href') ?? '';
        const date = header
          .prev()
          .children()
          .first()
          .text();

        return {
          image,
          title,
          href,
          categories: [this.DevBlogs, this.blog],
          date: moment(date, 'LL'),
        };

      });
  }

  protected override enrichPost(post: Post): Promise<Post | undefined> {
    return this
      .fromHtmlPage(post.href)
      .enrichPost('main article div.entry-content', ($, element) => {

        const description = this.getDescription($, element);

        return {
          ...post,
          description,
        };

      });
  }

  private getDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string[] {
    const description: string[] = [];
    const children = element.children();

    for (const child of children) {
      if (child.name == 'p') {
        const p = $(child);
        const text = p.text().trim();

        if (text) {
          description.push(text);

          if (description.length >= 5) {
            break;
          }
        }
      }
      else if (description.length > 0) {
        break;
      }
    }

    return description;
  }
}
