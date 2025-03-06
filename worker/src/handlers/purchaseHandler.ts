import { GoogleSheetsService } from '../services/googleSheets';
import { LineMessagingService } from '../services/lineMessaging';

export class PurchaseHandler {
  private readonly sheet: GoogleSheetsService;
  private readonly lineMessaging: LineMessagingService;
  private readonly imgUrl: string;

  // コマンドのサンプル
  private readonly commandSampleAdd = `買い出し
xxx
yyy
欲しい`;

  private readonly commandSampleDelete = `買い出し
xxx
yyy
買ったよ`;

  private readonly commandSampleList = `買い出し
リスト`;

  private readonly commandSampleDeleteAll = `買い出し
全消し`;

  constructor(sheet: GoogleSheetsService, lineMessaging: LineMessagingService) {
    this.sheet = sheet;
    this.lineMessaging = lineMessaging;
    this.imgUrl = process.env.IMG_PURCHASE || '';
    
    // シートの初期化を非同期で実行
    this.initializeSheet().catch(error => {
      console.error('Failed to initialize purchase list sheet:', error);
    });
  }

  /**
   * 買い物リストのシートを初期化する
   */
  private async initializeSheet(): Promise<void> {
    await this.sheet.initializePurchaseListSheet();
  }

  /**
   * メッセージを処理する
   */
  async handleMessage(message: string): Promise<string> {
    const splitted = message.split(/\r\n|\n/);

    if (splitted.length < 2) {
      return `フォーマットエラーだよ！
以下のいずれかで書いてね。

①リストを確認
${this.commandSampleList}

②リストから削除
${this.commandSampleDelete}

③リストに追加
${this.commandSampleAdd}

④リストから全削除
${this.commandSampleDeleteAll}

※xxx, yyyには品目名を入力してね。`;
    }

    splitted.shift(); // 冒頭の「買い出し」を削除
    const command = splitted[splitted.length - 1];

    switch (command) {
      case 'リスト':
        return this.getList();
      case '買ったよ':
        splitted.pop(); // 末尾の「買ったよ」を削除
        return this.delete(splitted);
      case '欲しい':
        splitted.pop(); // 末尾の「欲しい」を削除
        return this.add(splitted);
      case '全消し':
        return this.deleteAll();
      default:
        return '「リスト」「買ったよ」「欲しい」「全消し」のどれかで話しかけて…！！！';
    }
  }

  /**
   * 買い物リストを取得する
   */
  private async getList(): Promise<string> {
    const values = await this.sheet.getValues('買い出しリスト', 'A2:B');
    
    const messageNone = `今登録されている品目はないよ。
ほしいものがあったら

${this.commandSampleAdd}

で教えてね！`;

    if (!values || values.length === 0) {
      return messageNone;
    }

    let text = `買い出しリストには、いま以下の品目が登録されてるよ！\n\n`;
    let isNone = true;

    for (const row of values) {
      if (row[1] !== '済') {
        isNone = false;
        text += `${row[0]}\n`;
      }
    }

    if (isNone) {
      return messageNone;
    }

    text += `\n買い出しが終わったら\n\n${this.commandSampleDelete}\n\nでリストから削除できるよ！`;
    return text;
  }

  /**
   * 買い物リストから品目を削除する
   */
  private async delete(items: string[]): Promise<string> {
    const messageNoTarget = `教えてもらった品目がリストに無いよ！\n\n${this.commandSampleList}\n\nでリストにある品目を確認してね`;

    if (items.length === 0) {
      return messageNoTarget;
    }

    const values = await this.sheet.getValues('買い出しリスト', 'A2:B');
    if (!values || values.length === 0) {
      return messageNoTarget;
    }

    let isFound = false;
    for (let i = 0; i < values.length; i++) {
      if (items.includes(values[i][0]) && values[i][1] !== '済') {
        await this.sheet.setValues('買い出しリスト', `B${i + 2}`, [['済']]);
        isFound = true;
      }
    }

    if (!isFound) {
      return messageNoTarget;
    }

    return 'リストから品目を消しておいたよ〜';
  }

  /**
   * 買い物リストに品目を追加する
   */
  private async add(items: string[]): Promise<string> {
    if (items.length === 0) {
      return `品目が指定されていないみたいだよ。\n\n${this.commandSampleAdd}\n\nで追加してね！`;
    }

    const values = items.map(item => [item, '']);
    await this.sheet.appendValues('買い出しリスト', values);

    return `買い出しリストに追加しておいたよ！\nリストの内容を見るには\n\n${this.commandSampleList}\n\nで教えてね`;
  }

  /**
   * 買い物リストの全ての品目を削除する
   */
  private async deleteAll(): Promise<string> {
    const messageNoTarget = `まだリストに登録されてるものが無いみたい。\n\n${this.commandSampleList}\n\nでリストにある品目を確認してね`;

    const values = await this.sheet.getValues('買い出しリスト', 'A2:B');
    if (!values || values.length === 0) {
      return messageNoTarget;
    }

    let isFound = false;
    for (let i = 0; i < values.length; i++) {
      if (values[i][1] !== '済') {
        await this.sheet.setValues('買い出しリスト', `B${i + 2}`, [['済']]);
        isFound = true;
      }
    }

    if (!isFound) {
      return messageNoTarget;
    }

    return 'リストから全ての品目を消しておいたよ〜';
  }

  /**
   * チュートリアル用のテンプレートを取得する
   */
  getTemplateColumn() {
    return {
      thumbnailImageUrl: this.imgUrl,
      title: '買い出しリストの管理',
      text: '買い出しリストの操作ができるよ！\nリストは、2人とも参照可能だよ',
      actions: [{
        type: 'message',
        label: 'リストを見てみる',
        text: this.commandSampleList
      }]
    };
  }
} 