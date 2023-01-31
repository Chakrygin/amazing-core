import * as core from '@actions/core';

import moment from 'moment';
import path from 'path';

import { AppConfig } from './AppConfig';
import { Post } from './posts';

import { Reporter } from './reporters';
import { Scraper, ScraperBehaviour } from './scrapers';
import { Sender } from './senders';
import { LastErrorStorage, LastUpdateStorage, ValueStorage } from './storages';

export class AppRunner {
  constructor(
    private readonly config: AppConfig,
    private readonly scrapers: readonly Scraper[],
    private readonly sender: Sender,
    private readonly reporter: Reporter) { }

  private readonly lastErrors = new LastErrorStorage(
    path.join(this.config.path, 'errors.json'));

  private readonly lastUpdates = new LastUpdateStorage(
    path.join(this.config.path, 'updates.json'));

  private readonly commitScraperNames: string[] = [];

  async run(): Promise<string[]> {
    for await (const scraper of this.scrapers) {
      await core.group(scraper.name, async () => {

        const lastError = this.lastErrors.get(scraper.name);
        if (lastError) {
          if (!this.config.manual) {
            if (lastError.counter > 10) {
              core.error('This scraper failed more than 10 times.', {
                title: `The '${scraper.name}' scraper permanently disabled.`,
              });

              return;
            }

            if (lastError.counter > 1) {
              if (moment().diff(lastError.timestamp, 'days') < 1) {
                core.warning('This scraper failed less than a day ago.', {
                  title: `The '${scraper.name}' scraper temporarily disabled.`,
                });

                return;
              }
            }
          }

          this.lastErrors.reset(scraper.name);
        }

        const lastUpdate = this.lastUpdates.get(scraper.name);
        if (lastUpdate) {
          if (!this.config.manual) {
            if (moment().diff(lastUpdate.timestamp, 'year') >= 1) {
              core.warning('This scraper has no updates more than 1 year.', {
                title: `The '${scraper.name}' scraper is idle.`
              });

              if (!lastUpdate.idle) {
                this.lastUpdates.setIdle(scraper.name);

                await this.reporter.reportWarning(
                  `The '${scraper.name}' scraper is idle.`,
                  'This scraper has no updates more than 1 year.');
              }
            }
          }
        }

        const storage = new ValueStorage(
          path.join(this.config.path, scraper.path));

        try {

          const behaviour = scraper.behaviour ?? ScraperBehaviour.BreakIfPostExists;
          const debug = this.config.debug || !lastUpdate || !storage.exists;

          if (behaviour == ScraperBehaviour.BreakIfPostExists) {
            await this.scrapeWithBreakIfPostExists(scraper, storage, debug);
          }
          else if (behaviour == ScraperBehaviour.ContinueIfPostExists) {
            await this.scrapeWithContinueIfPostExists(scraper, storage, debug);
          }
          else {
            throw new Error(`Unknown scraper behaviour: ${behaviour}.`);
          }

        }
        catch (error: unknown) {
          if (error instanceof Error) {
            process.exitCode = 1

            core.error(error, {
              title: `The '${scraper.name}' scraper failed.`,
            });

            this.lastErrors.set(scraper.name, error);

            await this.reporter.reportError(
              `The '${scraper.name}' scraper failed.`, error);
          }
          else {
            throw error;
          }
        }
        finally {
          if (storage.save()) {
            this.lastUpdates.set(scraper.name);
            this.commitScraperNames.push(scraper.name);
          }
        }

      });
    }

    return this.commitScraperNames;
  }

  private async scrapeWithBreakIfPostExists(scraper: Scraper, storage: ValueStorage, debug: boolean): Promise<void> {
    let date: moment.Moment | undefined;

    for await (const post of scraper.scrape()) {

      printPost(post);

      const postId = post.href.replace(/\/$/, '');

      if (storage.has(postId)) {
        core.info('The post already exists in the storage. Break scraping.');
        break;
      }

      if (!date) {
        date = post.date;
      }
      else if (date.diff(post.date, 'day') >= 1) {
        core.info('The post is too old compared to the first post. Break scraping.');
        break;
      }

      core.info('Sending the post...');
      await this.sender.send(post, debug);

      core.info('Storing the post...');
      storage.add(postId);
    }
  }

  private async scrapeWithContinueIfPostExists(scraper: Scraper, storage: ValueStorage, debug: boolean): Promise<void> {
    let counter = 0;

    for await (const post of scraper.scrape()) {

      printPost(post);

      const postId = post.href.replace(/\/$/, '');

      if (storage.has(postId)) {
        core.info('The post already exists in the storage. Continue scraping.');
        continue;
      }

      core.info('Sending the post...');
      await this.sender.send(post, debug);

      core.info('Storing the post...');
      storage.add(postId);

      if (!debug && ++counter >= 3) {
        core.info('Maximum number of posts found. Break scraping.');
        break;
      }
    }
  }
}

function printPost(post: Post): void {
  const json = JSON.stringify(post, null, 2)
    .split('\n')
    .map(line => '  ' + line)
    .join('\n');

  core.info(`Post title is '${post.title}'.`);
  core.info(`Post href is '${post.href}'.`);
  core.info('\n' + json + '\n');
}
