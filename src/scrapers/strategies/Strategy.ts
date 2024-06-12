import { Sender } from '../../senders';
import { Storage } from '../../storages';

export interface Strategy {
  scrape(sender: Sender, storage: Storage): Promise<void>;
}
