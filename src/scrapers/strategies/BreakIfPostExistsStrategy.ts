import * as core from '@actions/core';

import { Strategy } from './Strategy';

import { printPost, printPostJson } from './utils';

import { Post } from '../../models';
import { Sender } from '../../senders';
import { Storage } from '../../storages';

export class BreakIfPostExistsStrategy implements Strategy {
  constructor(
    private readonly fetchPosts: () => AsyncGenerator<Post>,
    private readonly enrichPost: (post: Post) => Promise<Post | null>) { }

  async scrape(sender: Sender, storage: Storage): Promise<void> {
    let firstPostDate: moment.Moment | undefined;

    for await (const fetchedPost of this.fetchPosts()) {
      printPost(fetchedPost);

      if (storage.has(fetchedPost.href)) {
        core.info('The post already exists in the storage. Break scraping.');
        break;
      }

      if (!firstPostDate) {
        firstPostDate = fetchedPost.date;
      }
      else if (firstPostDate.diff(fetchedPost.date, 'day') >= 1) {
        core.info('The post is too old. Break scraping.');
        break;
      }

      const enrichedPost = await this.enrichPost(fetchedPost);

      if (!enrichedPost) {
        core.info('The post is not interesting. Continue scraping.');
        continue;
      }

      printPostJson(enrichedPost);

      core.info('Sending the post...');
      await sender.send(enrichedPost);

      core.info('Storing the post...');
      storage.add(enrichedPost.href);
    }
  }
}
