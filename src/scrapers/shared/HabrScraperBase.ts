import * as core from '@actions/core';

import moment from 'moment';
import * as cheerio from 'cheerio';

import { ScraperBase } from '../ScraperBase';
import { ScraperStrategy } from '../ScraperStrategy';

import { Link, Post } from '../../models';

export interface HabrScraperOptions {
  readonly minRating: number;
}

export abstract class HabrScraperBase extends ScraperBase {
  constructor(
    private readonly id: string,
    private readonly title: string,
    private readonly options: HabrScraperOptions) {
    super();
  }

  readonly name = `Habr / ${this.title}`;
  readonly path = 'habr.com';
  readonly href = `https://habr.com/ru/hub/${this.id}/`;
  readonly strategy = ScraperStrategy.ContinueIfPostExists;

  private readonly Habr: Link = {
    title: 'Хабр',
    href: 'https://habr.com',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.href)
      .fetchPosts('.tm-articles-list article.tm-articles-list__item', ($, element) => {

        const rating = parseInt(element.find('.tm-votes-meter__value').text());

        if (isNaN(rating)) {
          throw new Error('Failed to parse post. Rating is NaN.');
        }

        if (rating < this.options.minRating) {
          core.info('Post rating is too low. Continue scraping.');
          return;
        }

        const link = element.find('a.tm-title__link');
        const title = link.text();
        const href = link.attr('href') ?? '';
        const date = element.find('.tm-article-datetime-published time').attr('datetime') ?? '';

        const [categories, tags] = this.getCategoriesAndTags($, element);

        const post: Post = {
          image: this.getImage(element),
          title,
          href: this.getFullHref(href),
          categories: [
            this.Habr,
            ...categories
          ],
          date: moment(date).locale('ru'),
          description: this.getDescription($, element),
          tags,
        };

        return post;
      });
  }

  private getImage(element: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const src =
      element.find('img.tm-article-snippet__lead-image').attr('src') ??
      element.find('.article-formatted-body img:first-child').attr('src');

    return src;
  }

  private getCategoriesAndTags($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): [Link[], string[]] {
    const categories: Link[] = [];
    const tags: string[] = [];
    const hubs = element
      .find('.tm-publication-hubs .tm-publication-hub__link-container a');

    for (const hub of hubs) {
      const link = $(hub);
      const title = link.text().replace('*', '');
      const href = link.attr('href') ?? '';

      if (title.startsWith('Блог компании')) {
        categories.push({
          title,
          href: this.getFullHref(href),
        });
      }
      else {
        tags.push(title);
      }
    }

    return [categories, tags];
  }

  private getDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.Element>): string[] {
    const description = [];
    const body = element
      .find('.article-formatted-body');

    if (body.hasClass('article-formatted-body_version-1')) {
      const lines = body
        .text()
        .split('\n')
        .map(line => line.trim())
        .filter(line => !!line);

      for (const line of lines) {
        description.push(line);

        if (description.length >= 5) {
          break;
        }
      }
    }
    else if (body.hasClass('article-formatted-body_version-2')) {
      const children = body.children();

      for (const child of children) {
        if (child.name == 'p') {
          const p = $(element);
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
    }

    return description;
  }

  private getFullHref(href: string): string {
    if (href.startsWith('/')) {
      href = this.Habr.href + href;
    }

    return href;
  }
}
