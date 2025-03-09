import { LineMessagingService } from '../services/lineMessaging';
import { GoogleSheetsService } from '../services/googleSheets';
import { Env as EnvType } from '../types';

export abstract class CommandBaseHandler {
  protected readonly name: string;
  protected readonly lineMessaging: LineMessagingService;
  protected readonly env: EnvType;
  protected readonly lineService: LineMessagingService;
  protected readonly googleSheets: GoogleSheetsService;

  constructor(
    env: EnvType, 
    lineService?: LineMessagingService, 
    googleSheets?: GoogleSheetsService
  ) {
    this.env = env;
    this.lineService = lineService || new LineMessagingService(env);
    this.lineMessaging = this.lineService;
    this.name = this.constructor.name;
    
    this.googleSheets = googleSheets || new GoogleSheetsService(env);
  }

  /**
   * メッセージからコマンドを解析する
   * @param message 受信したメッセージ
   * @returns 解析されたコマンド
   */
  protected parseCommand(message: string): string {
    // 改行や余分な空白を除去
    const trimmedMessage = message.trim().replace(/\n/g, '');
    
    // 特定のコマンドパターンを定義
    const commandMappings: { [key: string]: string } = {
      '家事管理': '家事管理',
      '家計簿': '家計簿',
      '買い出しリスト': '買い出しリスト',
      '買い出し': '買い出しリスト',
      '買い物リスト': '買い出しリスト'
    };

    // マッピングに一致するコマンドを返す
    for (const [pattern, command] of Object.entries(commandMappings)) {
      if (trimmedMessage.includes(pattern)) {
        return command;
      }
    }

    // デフォルトのコマンド
    return 'default';
  }

  /**
   * コマンドを処理する抽象メソッド
   * 各ハンドラーで具体的な実装を提供
   * @param replyToken 返信トークン
   * @param message 受信したメッセージ
   * @param userId ユーザーID（オプション）
   */
  public async handleMessage(
    replyToken: string, 
    message: string, 
    userId?: string
  ): Promise<void> {
    try {
      // ヘルプコマンドの処理
      if (message.startsWith('ヘルプ')) {
        const helpCommand = message.replace('ヘルプ', '').trim();
        
        if (helpCommand === '') {
          // 全コマンドのヘルプ
          await this.lineService.replyText(
            replyToken, 
            this.generateHelp(['家事管理', '家計簿', '買い出しリスト'])
          );
          return;
        } else {
          // 特定のコマンドのヘルプ
          await this.lineService.replyText(
            replyToken, 
            this.generateHelp(helpCommand) + '\n家事管理コマンドの詳細な使い方を説明します。'
          );
          return;
        }
      }

      // 既存のコマンド処理ロジック
      const command = this.parseCommand(message);
      
      switch (command) {
        case '家事管理':
          await this.lineService.replyText(replyToken, '家事管理コマンドを処理');
          break;
        case '家計簿':
          await this.lineService.replyText(replyToken, '家計簿コマンドを処理');
          break;
        default:
          await this.handleDefaultMessage(replyToken);
      }
    } catch (error) {
      await this.handleError(replyToken, error as Error);
    }
  }

  /**
   * デフォルトのメッセージ処理
   * @param replyToken 返信トークン
   */
  protected async handleDefaultMessage(replyToken: string): Promise<void> {
    console.log('デフォルトメッセージを処理(handleDefaultMessage)');
    try {
      const randomMessage = await this.googleSheets.getRandomChatMessage();
      await this.lineService.replyText(replyToken, randomMessage);
    } catch (error) {
      console.error('Failed to get random chat message:', error);
      // エラー時のフォールバックメッセージ
      await this.lineService.replyText(
        replyToken, 
        error instanceof Error ? error.message : 'こんにちは！何かお手伝いできることはありますか？'
      );
    }
  }

  /**
   * エラー時の共通処理
   * @param replyToken 返信トークン
   * @param error エラーオブジェクト
   */
  protected async handleError(
    replyToken: string, 
    error: Error
  ): Promise<void> {
    console.error('Error in command handler:', error);
    await this.lineService.replyText(
      replyToken, 
      'エラーが発生しました。もう一度お試しください。'
    );
  }

  /**
   * バッチ実行
   */
  async main(): Promise<void> {
    try {
      await this.run();
      console.log(`end ${this.name}`);
    } catch (e) {
      await this.notice(e instanceof Error ? e.message : String(e), e instanceof Error ? e.stack : '');
    }
  }

  /**
   * 失敗時の通知
   *
   * @param errorMessage エラーメッセージ
   * @param stack スタックトレース
   */
  protected async notice(errorMessage: string, stack?: string): Promise<void> {
    const message = `${this.name} の実行に失敗しました。

error message: ${errorMessage}

stack trace:
${stack || ''}`;

    console.error(message);
    await this.lineMessaging.pushAll(message);
  }

  /**
   * 実行メソッド。
   * 継承先のクラスで実装される抽象メソッド。
   */
  protected abstract run(): Promise<void>;

  // ヘルプ生成メソッドを追加
  protected generateHelp(commands: string | string[]): string {
    if (typeof commands === 'string') {
      return `${commands}に関するヘルプ情報です。詳細な使い方を説明します。`;
    }

    const commandList = commands.join('、');
    return `以下のコマンドが利用可能です：
${commands.map(cmd => `- ${cmd}`).join('\n')}

各コマンドの詳細なヘルプが必要な場合は、「ヘルプ ${commands[0]}」のように入力してください。`;
  }
}

export interface Env {
  SPREADSHEET_ID: string;
  GOOGLE_SHEETS_SPREADSHEET_ID: string;
  GOOGLE_API_KEY: string;
  // 他の既存の環境変数
} 