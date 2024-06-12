import { Link, Post } from '@core/models';
import { ScraperBase } from '../ScraperBase';

export abstract class DevBlogsScraperBase extends ScraperBase {
  constructor(
    private readonly id: string,
    private readonly title: string) {
    super();
  }

  readonly name = `DevBlogs / ${this.title}`;
  readonly path = `devblogs.microsoft.com/${this.id}`;

  private readonly DevBlogs: Link = {
    title: 'DevBlogs',
    href: 'https://devblogs.microsoft.com',
  };

  private readonly blog: Link = {
    title: this.title,
    href: `https://devblogs.microsoft.com/${this.id}/`,
  };

  protected override fetchPosts(): AsyncGenerator<Post> {
    return this
      .fromHtmlPage(this.blog.href)
      .fetchPosts('#main .entry-box', ($, element) => {
        const image = element.find('.entry-image img').attr('data-src');
        // readonly link = this.article.find('.entry-title a');
        // readonly title = this.link.text();
        // readonly href = this.link.attr('href') ?? '';

        const post: Post = {
          image,

        };

        return post;
      });
  }

  // protected override fetchPosts(): AsyncGenerator<Post> {
  //   return this
  //     .fromHtmlPage(this.blog.href)
  //     .fetchPosts(DevBlogsFetchReader, reader => {
  //       const post: Post = {
  //         image: reader.image,
  //         title: reader.title,
  //         href: reader.href,
  //         categories: [
  //           this.DevBlogs,
  //           this.blog,
  //         ],
  //         date: moment(reader.date, 'LL'),
  //         links: [
  //           {
  //             title: 'Read more',
  //             href: reader.href,
  //           },
  //         ],
  //         tags: reader.tags,
  //       };

  //       return post;
  //     });
  // }

  // protected override enrichPost(post: Post): Promise<Post | undefined> {
  //   return this
  //     .fromHtmlPage(post.href)
  //     .enrichPost(DevBlogsEnrichReader, reader => {
  //       post = {
  //         ...post,
  //         description: reader.getDescription(),
  //       };

  //       return post;
  //     });
  // }
}
