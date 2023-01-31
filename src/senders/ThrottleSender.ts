import { Sender } from './Sender';
import { Post } from '../posts';

const DEFAULT_THROTTLE_TIMEOUT = 5000;

export class ThrottleSender implements Sender {
  constructor(
    private readonly sender: Sender,
    private readonly timeout: number = DEFAULT_THROTTLE_TIMEOUT) { }

  private delay = Promise.resolve();

  async send(post: Post, debug: boolean): Promise<void> {
    await this.delay;
    await this.sender.send(post, debug);

    this.delay = new Promise<void>(resolve => setTimeout(resolve, this.timeout));
  }
}
