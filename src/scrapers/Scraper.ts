import { Post } from '../posts';

export interface Scraper {
  readonly name: string;
  readonly path: string;
  readonly behaviour?: ScraperBehaviour;

  scrape(): AsyncGenerator<Post>;
}

export enum ScraperBehaviour {
  Unknown,
  BreakIfPostExists,
  ContinueIfPostExists,
}
