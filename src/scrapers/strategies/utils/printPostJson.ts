import * as core from '@actions/core';

import { Post } from '../../../models';

export function printPostJson(post: Post) {
  const json = JSON.stringify(post, null, 2)
    .split('\n')
    .map(line => '  ' + line)
    .join('\n');

  core.startGroup('Post json');
  core.info(json);
  core.endGroup();
}
