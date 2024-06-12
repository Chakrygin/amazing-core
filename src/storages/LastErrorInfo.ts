import moment from 'moment';

export interface LastErrorInfo {
  readonly timestamp: moment.Moment;
  readonly message: string;
  readonly counter: number;
}
