import * as core from '@actions/core';
import * as github from '@actions/github';

import axios from 'axios';
import axiosRetry from 'axios-retry';
import moment from 'moment';
import path from 'path';

import 'moment/locale/ru.js';

import { AppConfig } from './AppConfig';
import { AppRunner } from './AppRunner';

import { Scraper } from './scrapers';
import { createSender } from './senders';
import { getInput, getKnownHosts } from './utils';

export class App {
  constructor(
    private readonly createScrapers: (knownHosts: readonly string[]) => readonly Scraper[]) { }

  async run(): Promise<void> {
    try {

      // Setup default axios retries.
      axiosRetry(axios, {
        retryDelay: retryNumber => axiosRetry.exponentialDelay(retryNumber),
      });

      // Setup default moment locale.
      moment.locale('en');

      const TELEGRAM_TOKEN = getInput('TELEGRAM_TOKEN');
      const TELEGRAM_PUBLIC_CHAT_ID = getInput('TELEGRAM_PUBLIC_CHAT_ID');
      const TELEGRAM_PRIVATE_CHAT_ID = getInput('TELEGRAM_PRIVATE_CHAT_ID');

      const config = this.createConfig();
      const knownHosts = getKnownHosts(config.path);
      const scrapers = this.createScrapers(knownHosts);
      const publicSender = createSender(TELEGRAM_TOKEN, TELEGRAM_PUBLIC_CHAT_ID);
      const privateSender = createSender(TELEGRAM_TOKEN, TELEGRAM_PRIVATE_CHAT_ID);

      const runner = new AppRunner(config, scrapers, publicSender, privateSender);
      await runner.run();

      this.setCommitMessage(runner.updatedScraperNames);
    }
    catch (error: unknown) {
      core.setFailed(error as Error);
    }
  }

  private createConfig(): AppConfig {
    const config: AppConfig = {
      // BUG: https://github.com/vercel/ncc/issues/1199
      path: path.join(process.cwd(), 'data'.toString()),
      debug: github.context.ref !== 'refs/heads/main',
      manual: github.context.eventName !== 'schedule',
    };

    return config;
  }

  private setCommitMessage(scraperNames: string[]): void {
    let commitMessage = 'Scraped';

    if (scraperNames.length > 0) {
      commitMessage += ': ' + scraperNames.join(', ');
    }

    core.setOutput('COMMIT_MESSAGE', commitMessage);
  }
}
