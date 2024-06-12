import * as core from '@actions/core';

import { Post } from '../../../models';

export function printPost(post: Post) {
  core.info(`Post title: ${post.title}`);
  core.info(`Post href: ${post.href}`);
}
