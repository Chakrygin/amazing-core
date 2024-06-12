import fs from 'fs';

import { getHrefId } from './utils';

export class PostStorageFile {
  constructor(
    private readonly path: string) { }

  private hrefs?: Map<string, string>;
  private dirty?: true;

  get size() {
    const hrefs = this.getHrefs();
    return hrefs.size;
  }

  has(href: string): boolean {
    const hrefs = this.getHrefs();
    const hrefId = getHrefId(href);
    return hrefs.has(hrefId);
  }

  add(href: string): void {
    const hrefs = this.getHrefs();
    const hrefId = getHrefId(href);
    hrefs.set(hrefId, href);
    this.dirty = true;
  }

  private getHrefs(): NonNullable<typeof this.hrefs> {
    if (!this.hrefs) {
      this.hrefs = new Map();

      if (fs.existsSync(this.path)) {
        const data = fs
          .readFileSync(this.path)
          .toString();

        const hrefs = data.split('\n')
          .map(href => href.trim())
          .filter(href => !!href);

        for (const href of hrefs) {
          const hrefId = getHrefId(href);
          this.hrefs.set(hrefId, href);
        }
      }
    }

    return this.hrefs;
  }

  save(): boolean {
    let dirty = false;

    if (this.hrefs && this.dirty) {
      const data = Array.from(this.hrefs.values())
        .sort()
        .join('\n');

      fs.writeFileSync(this.path, data + '\n');

      delete this.hrefs;
      delete this.dirty;

      dirty = true;
    }

    return dirty;
  }

  delete(): void {
    fs.rmSync(this.path, {
      force: true,
    });
  }
}
