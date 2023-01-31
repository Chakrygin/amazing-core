import * as github from '@actions/github';

import { Telegram } from 'telegraf';

import { Reporter } from './Reporter';

export class TelegramReporter implements Reporter {
  constructor(
    private readonly token: string,
    private readonly chatId: string) { }

  private readonly telegram = new Telegram(this.token);

  async reportWarning(title: string, warning: string): Promise<void> {
    await this.report('⚠ ' + title, warning);
  }

  async reportError(title: string, error: string | Error): Promise<void> {
    await this.report('‼ ' + title, error);
  }

  async report(title: string, error: string | Error): Promise<void> {
    const message = getMessage(title, error);

    await this.telegram.sendMessage(this.chatId, message, {
      parse_mode: 'HTML',
    });
  }
}

function getMessage(title: string, error: string | Error): string {
  const lines = [];

  lines.push(`<b>${title}</b>`);

  if (github.context.runId) {
    const serverUrl = github.context.serverUrl;
    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;
    const runId = github.context.runId;

    lines.push(`Repo: ${serverUrl}/${owner}/${repo}`);
    lines.push(`Run: ${serverUrl}/${owner}/${repo}/actions/runs/${runId}`);
  }

  if (error) {
    if (error instanceof Error) {
      lines.push(encode(error.message));

      if (error.stack) {
        lines.push(`<pre>${encode(error.stack)}</pre>`);
      }
    }
    else {
      lines.push(encode(error));
    }
  }

  return lines.join('\n\n');
}

function encode(html: string) {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
