import { Post } from '../posts';

export interface Sender {
  send(post: Post, debug: boolean): Promise<void>;
}
