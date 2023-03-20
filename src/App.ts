import * as core from '@actions/core';
import * as github from '@actions/github';

import axios from 'axios';
import axiosRetry from 'axios-retry';
import path from 'path';

import { AppConfig } from './AppConfig';
import { AppRunner } from './AppRunner';

import { createReporter, createSender, getInput, getKnownHosts } from './helpers';
import { Scraper } from './scrapers';

// Setup default axios retries.
axiosRetry(axios, {
  retryDelay: retryNumber => axiosRetry.exponentialDelay(retryNumber),
});

export class App {
  constructor(
    private readonly createScrapers: (knownHosts: string[]) => readonly Scraper[]) { }

  async run(): Promise<void> {
    try {

      const TELEGRAM_TOKEN = getInput('TELEGRAM_TOKEN');
      const TELEGRAM_PUBLIC_CHAT_ID = getInput('TELEGRAM_PUBLIC_CHAT_ID');
      const TELEGRAM_PRIVATE_CHAT_ID = getInput('TELEGRAM_PRIVATE_CHAT_ID');

      const config = this.createConfig();
      const knownHosts = getKnownHosts(config.path);
      const scrapers = this.createScrapers(knownHosts);
      const sender = createSender(TELEGRAM_TOKEN, TELEGRAM_PUBLIC_CHAT_ID, TELEGRAM_PRIVATE_CHAT_ID);
      const reporter = createReporter(TELEGRAM_TOKEN, TELEGRAM_PRIVATE_CHAT_ID);

      core.startGroup('Config');
      core.info(`Debug: ${String(config.debug)}`);
      core.info(`Manual: ${String(config.manual)}`);
      core.endGroup();

      const runner = new AppRunner(config, scrapers, sender, reporter);
      const commitScraperNames = await runner.run();

      this.setCommitMessage(commitScraperNames);
    }
    catch (error: unknown) {
      core.setFailed(error as Error);
    }
  }

  private createConfig(): AppConfig {
    const config: AppConfig = {
      path: path.join(process.cwd(), 'data'),
      debug: github.context.ref !== 'refs/heads/main',
      manual: github.context.eventName !== 'schedule',
    };

    return config;
  }

  private setCommitMessage(commitScraperNames: string[]): void {
    let commitMessage = 'Commit scrape results';

    if (commitScraperNames.length > 0) {
      commitMessage += ': ' + commitScraperNames.join(', ');
    }

    core.setOutput('COMMIT_MESSAGE', commitMessage);
  }
}
