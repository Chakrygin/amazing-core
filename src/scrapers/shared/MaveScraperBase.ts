import * as cheerio from 'cheerio';
import moment from 'moment';

import { ScraperBase } from '../ScraperBase';
import { Link, Post } from '../../models';

export interface MaveScraperOptions {
  readonly name: string;
  readonly title: string;
  readonly storage: string;
}

export abstract class MaveScraperBase extends ScraperBase {
  constructor(
    private readonly id: string,
    private readonly options: MaveScraperOptions) {
    super();
  }

  readonly name = this.options.name;
  readonly path = `${this.id}.mave.digital`;

  private readonly Mave: Link = {
    title: this.options.title,
    href: `https://${this.id}.mave.digital`,
  };

  protected fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromNuxtData(this.Mave.href)
      .fetchPosts<MaveData>((data) => {
        const podcast = data.data.fetchedPodcastData;
        const episodes = data.data.fetchedEpisodesData.episodes;
        return fetchPosts.call(this, podcast, episodes);

        function* fetchPosts(this: MaveScraperBase, podcast: MavePodcastData, episodes: MaveEpisodeData[]): Generator<Post> {
          for (const episode of episodes) {
            const description = this.getDescription(episode);
            const links = this.getLinks(podcast, episode);

            yield {
              image: `${this.options.storage}/${episode.image}`,
              title: `${episode.number} выпуск. ${episode.title}`,
              href: `${this.Mave.href}/ep-${episode.code}`,
              categories: [this.Mave],
              date: moment(episode.publish_date),
              description: typeof description === 'string' ? [description] : description,
              links: links,
            };
          }
        }
      });
  }

  protected getDescription(episode: MaveEpisodeData): string | string[] | undefined {
    return this.getDescriptionLines(episode);
  }

  protected getDescriptionLines(episode: MaveEpisodeData): string[] {
    const $ = cheerio.load(episode.description);
    const result = $('body')
      .contents()
      .map((_, node) => $(node).text())
      .toArray();

    return result;
  }

  protected getLinks(podcast: MavePodcastData, episode: MaveEpisodeData): Link[] | undefined {
    return this.getDefaultLinks(podcast, episode);
  }

  protected getDefaultLinks(podcast: MavePodcastData, episode: MaveEpisodeData): Link[] {
    const links: Link[] = [];

    if (podcast.platforms.yandex) {
      links.push({
        title: 'Слушать на Яндекс.Музыке',
        href: podcast.platforms.yandex.replace('music.yandex.com', 'music.yandex.ru'),
      });
    }

    if (podcast.platforms.youtube) {
      links.push({
        title: 'Слушать на YouTube',
        href: podcast.platforms.youtube,
      });
    }

    links.push({
      title: 'Слушать на Mave',
      href: `${this.Mave.href}/ep-${episode.code}`,
    });

    return links;
  }
}

export interface MaveData {
  data: {
    fetchedEpisodesData: MaveEpisodesData,
    fetchedPodcastData: MavePodcastData,
  }
}

export interface MaveEpisodesData {
  episodes: MaveEpisodeData[],
  total: number,
}

export interface MaveEpisodeData {
  number: number,
  title: string,
  description: string,
  image: string,
  code: number,
  publish_date: string,
}

export interface MavePodcastData {
  platforms: {
    yandex: string | null,
    youtube: string | null,
  }
}
