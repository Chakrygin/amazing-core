import * as core from '@actions/core';

import { Strategy } from './Strategy';

import { Post } from '../../models';
import { Sender } from '../../senders';
import { Storage } from '../../storages';

export abstract class StrategyBase implements Strategy {
  abstract scrape(sender: Sender, storage: Storage): Promise<void>;

  protected printPostHead(post: Post) {
    core.info(`Post title: ${post.title}`);
    core.info(`Post href: ${post.href}`);
  }

  protected printPostBody(post: Post) {
    const json = JSON.stringify(post, null, 2)
      .split('\n')
      .map(line => '  ' + line)
      .join('\n');

    core.startGroup('Post');
    core.info(json);
    core.endGroup();
  }
}
