"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandBaseHandler = void 0;
const lineMessaging_1 = require("../services/lineMessaging");
const googleSheets_1 = require("../services/googleSheets");
class CommandBaseHandler {
    constructor(env, lineService, googleSheets) {
        this.env = env;
        this.lineService = lineService || new lineMessaging_1.LineMessagingService(env);
        this.lineMessaging = this.lineService;
        this.name = this.constructor.name;
        this.googleSheets = googleSheets || new googleSheets_1.GoogleSheetsService(env);
    }
    /**
     * メッセージからコマンドを解析する
     * @param message 受信したメッセージ
     * @returns 解析されたコマンド
     */
    parseCommand(message) {
        // 改行や余分な空白を除去
        const trimmedMessage = message.trim().replace(/\n/g, '');
        // 特定のコマンドパターンを定義
        const commandMappings = {
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
    async handleMessage(replyToken, message, userId) {
        try {
            // ヘルプコマンドの処理
            if (message.startsWith('ヘルプ')) {
                const helpCommand = message.replace('ヘルプ', '').trim();
                if (helpCommand === '') {
                    // 全コマンドのヘルプ
                    await this.lineService.replyText(replyToken, this.generateHelp(['家事管理', '家計簿', '買い出しリスト']));
                    return;
                }
                else {
                    // 特定のコマンドのヘルプ
                    await this.lineService.replyText(replyToken, this.generateHelp(helpCommand) + '\n家事管理コマンドの詳細な使い方を説明します。');
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
        }
        catch (error) {
            await this.handleError(replyToken, error);
        }
    }
    /**
     * デフォルトのメッセージ処理
     * @param replyToken 返信トークン
     */
    async handleDefaultMessage(replyToken) {
        console.log('デフォルトメッセージを処理(handleDefaultMessage)');
        try {
            const randomMessage = await this.googleSheets.getRandomChatMessage();
            await this.lineService.replyText(replyToken, randomMessage);
        }
        catch (error) {
            console.error('Failed to get random chat message:', error);
            // エラー時のフォールバックメッセージ
            await this.lineService.replyText(replyToken, error instanceof Error ? error.message : 'こんにちは！何かお手伝いできることはありますか？');
        }
    }
    /**
     * エラー時の共通処理
     * @param replyToken 返信トークン
     * @param error エラーオブジェクト
     */
    async handleError(replyToken, error) {
        console.error('Error in command handler:', error);
        await this.lineService.replyText(replyToken, 'エラーが発生しました。もう一度お試しください。');
    }
    /**
     * バッチ実行
     */
    async main() {
        try {
            await this.run();
            console.log(`end ${this.name}`);
        }
        catch (e) {
            await this.notice(e instanceof Error ? e.message : String(e), e instanceof Error ? e.stack : '');
        }
    }
    /**
     * 失敗時の通知
     *
     * @param errorMessage エラーメッセージ
     * @param stack スタックトレース
     */
    async notice(errorMessage, stack) {
        const message = `${this.name} の実行に失敗しました。

error message: ${errorMessage}

stack trace:
${stack || ''}`;
        console.error(message);
        await this.lineMessaging.pushAll(message);
    }
    // ヘルプ生成メソッドを追加
    generateHelp(commands) {
        if (typeof commands === 'string') {
            return `${commands}に関するヘルプ情報です。詳細な使い方を説明します。`;
        }
        const commandList = commands.join('、');
        return `以下のコマンドが利用可能です：
${commands.map(cmd => `- ${cmd}`).join('\n')}

各コマンドの詳細なヘルプが必要な場合は、「ヘルプ ${commands[0]}」のように入力してください。`;
    }
}
exports.CommandBaseHandler = CommandBaseHandler;
