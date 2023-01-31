import * as core from '@actions/core';

import path from 'path';

import { createSender, getInput, getKnownHosts } from '../helpers';
import { Scraper } from '../scrapers';

export async function testScraper(createScraper: (knownHosts: string[]) => Scraper): Promise<void> {
  const TELEGRAM_TOKEN = getInput('TELEGRAM_TOKEN');
  const TELEGRAM_CHAT_ID = getInput('TELEGRAM_PRIVATE_CHAT_ID');

  const knownHosts = getKnownHosts(
    path.join(process.cwd(), 'data'));

  const scraper = createScraper(knownHosts);
  const sender = createSender(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID);

  for await (const post of scraper.scrape()) {
    const json = JSON.stringify(post, null, 2)
      .split('\n')
      .map(line => '  ' + line)
      .join('\n');

    core.info('\n' + json + '\n');
    core.info('Sending the post...');

    await sender.send(post, true);
  }
}
