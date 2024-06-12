import { Link, Post } from '@core/models';
import { ScraperBase } from '../ScraperBase';

export abstract class HabrScraperBase extends ScraperBase {
  constructor(
    private readonly id: string,
    private readonly title: string) {
    super();
  }

  readonly name = `Habr / ${this.title}`;
  readonly path = 'habr.com';
  readonly href = `https://habr.com/ru/hub/${this.id}/`;

  private readonly Habr: Link = {
    title: 'Хабр',
    href: 'https://habr.com',
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    throw new Error();
  }
}
