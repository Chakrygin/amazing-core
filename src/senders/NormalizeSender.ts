import { Sender } from './Sender';
import { Post, Link } from '../posts';

export class NormalizeSender implements Sender {
  constructor(
    private readonly sender: Sender) { }

  async send(post: Post, debug: boolean): Promise<void> {

    post = {
      image: post.image?.trim(),
      title: post.title.trim(),
      href: post.href.trim(),
      categories: normalizeCategories(post.categories),
      author: post.author?.trim(),
      date: post.date,
      description: post.description,
      links: normalizeLinks(post.links),
      tags: normalizeTags(post.tags),
    };

    await this.sender.send(post, debug);
  }
}

function normalizeCategories(categories: Link[]): Link[] {
  if (categories.length > 0) {
    categories = categories.map(category => ({
      title: category.title.trim(),
      href: category.href.trim(),
    }));
  }

  return categories;
}

function normalizeLinks(links: Link[] | undefined): Link[] | undefined {
  if (links && links.length > 0) {
    links = links.map(link => ({
      title: link.title.trim(),
      href: link.href.trim(),
    }));
  }

  return links;
}

function normalizeTags(tags: string[] | undefined): string[] | undefined {
  if (tags && tags.length > 0) {
    tags = tags
      .map(tag => tag.trim())
      .sort();
  }

  return tags;
}
