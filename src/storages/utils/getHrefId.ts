const regexp = /\/([^/]+)\/?$/;

export function getHrefId(href: string): string {
  const match = href.match(regexp);
  if (match && match.length == 2) {
    return match[1];
  }

  throw new Error(`Failed to get identifer from href ${href}.`);
}
