import RssParser from 'rss-parser';

import { Scraper } from './Scraper';
import { ScraperStrategy } from './ScraperStrategy';

import { HtmlPageHelper, RssFeedHelper } from './helpers';
import { BreakIfPostExistsStrategy, ContinueIfPostExistsStrategy, Strategy } from './strategies';

import { Post } from '../models';
import { Sender } from '../senders';
import { Storage } from '../storages';

export abstract class ScraperBase implements Scraper {
  abstract name: string;
  abstract path: string;

  async scrape(sender: Sender, storage: Storage): Promise<void> {
    const strategy = this.createStrategy();
    await strategy.scrape(sender, storage);
  }

  protected createStrategy(): Strategy {
    const fetchPosts = this.fetchPosts.bind(this);
    const enrichPost = this.enrichPost.bind(this);

    if (hasStrategy(this)) {
      if (this.strategy === ScraperStrategy.BreakIfPostExists) {
        return new BreakIfPostExistsStrategy(fetchPosts, enrichPost);
      }
      else if (this.strategy === ScraperStrategy.ContinueIfPostExists) {
        return new ContinueIfPostExistsStrategy(fetchPosts, enrichPost);
      }
      else {
        throw new Error(`Unknown scraper strategy: ${this.strategy as string}`);
      }
    }

    return new BreakIfPostExistsStrategy(fetchPosts, enrichPost);

    function hasStrategy(scraper: Scraper): scraper is Scraper & { strategy: ScraperStrategy } {
      return 'strategy' in scraper && typeof scraper.strategy === 'string';
    }
  }

  protected abstract fetchPosts(): AsyncGenerator<Post>;

  protected enrichPost(post: Post): Promise<Post | null> {
    return Promise.resolve(post);
  }

  protected fromHtmlPage(url: string): HtmlPageHelper {
    return new HtmlPageHelper(url);
  }

  protected fromRssFeed<TFeed, TItem>(url: string, options: RssParser.ParserOptions<TFeed, TItem> = {}): RssFeedHelper<TFeed, TItem> {
    return new RssFeedHelper<TFeed, TItem>(url, options);
  }
}
