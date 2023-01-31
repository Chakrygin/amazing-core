import { App } from '../src';

import ExampleScraper from './scrapers/ExampleScraper';

const app = new App(() => [
  new ExampleScraper(),
]);

void app.run();
