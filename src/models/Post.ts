import moment from 'moment';

import { Link } from './Link';

export interface Post {
  readonly image?: string;
  readonly title: string;
  readonly href: string;
  readonly categories: readonly Link[];
  readonly author?: string;
  readonly date?: moment.Moment;
  readonly description?: readonly string[];
  readonly links?: readonly Link[];
  readonly tags?: readonly string[];
}
