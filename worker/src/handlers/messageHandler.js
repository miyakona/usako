"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
const googleSheets_1 = require("../services/googleSheets");
const purchaseHandler_1 = require("./purchaseHandler");
const chatHandler_1 = require("./chatHandler");
const commandBaseHandler_1 = require("./commandBaseHandler");
class MessageHandler extends commandBaseHandler_1.CommandBaseHandler {
    constructor(env, lineService, googleSheetsService) {
        super(env, lineService);
        this.googleSheetsService = googleSheetsService || new googleSheets_1.GoogleSheetsService(env);
        this.purchaseHandler = new purchaseHandler_1.PurchaseHandler(this.googleSheetsService, this.lineService);
        this.chatHandler = new chatHandler_1.ChatHandler(this.lineService, this.googleSheetsService);
    }
    /**
     * バッチ処理や初期化処理のためのrun()メソッド
     */
    async run() {
        // 必要に応じて初期化処理や定期的なタスクを実装
        console.log('MessageHandlerの初期化または定期処理');
        // 例: 購入ハンドラーの初期化
        await this.purchaseHandler.initialize();
    }
    async handleMessage(replyToken, message, userId) {
        try {
            console.log(`Handling message: ${message}`);
            // コマンドを解析
            const command = this.parseCommand(message);
            console.log('command', command);
            // コマンドに応じた処理
            switch (command) {
                case '家事管理':
                    console.log('家事管理コマンドを処理');
                    await this.handleHouseworkCommand(replyToken);
                    break;
                case '家計簿':
                    console.log('家計簿コマンドを処理');
                    await this.handleAccountBookCommand(replyToken);
                    break;
                case '買い出しリスト':
                    console.log('買い出しリストコマンドを処理');
                    await this.handlePurchaseListCommand(replyToken);
                    break;
                default:
                    // チャットコマンドまたはデフォルト処理
                    if (this.isChatCommand(message)) {
                        console.log('チャットコマンドを処理');
                        const response = await this.chatHandler.handleMessage(message);
                        await this.lineService.replyText(replyToken, response);
                    }
                    else {
                        console.log('デフォルトメッセージを処理');
                        await this.handleDefaultMessage(replyToken);
                    }
            }
        }
        catch (error) {
            await this.handleError(replyToken, error);
        }
    }
    /**
     * 家事管理コマンドの処理
     */
    async handleHouseworkCommand(replyToken) {
        await this.lineService.replyTemplateButton(replyToken, '家事管理テンプレート', {
            thumbnailImageUrl: 'https://example.com/housework.jpg', // 適切な画像URLに置き換え
            imageAspectRatio: 'square',
            imageSize: 'contain',
            title: '家事管理',
            text: '家事に関する操作を選択してください',
            actions: [
                {
                    type: 'postback',
                    label: '報告する',
                    data: JSON.stringify({ type: 'housework', action: 'report' })
                },
                {
                    type: 'postback',
                    label: '確認する',
                    data: JSON.stringify({ type: 'housework', action: 'check' })
                }
            ]
        });
    }
    /**
     * 家計簿コマンドの処理
     */
    async handleAccountBookCommand(replyToken) {
        await this.lineService.replyTemplateButton(replyToken, '家計簿テンプレート', {
            thumbnailImageUrl: 'https://example.com/account-book.jpg', // 適切な画像URLに置き換え
            imageAspectRatio: 'square',
            imageSize: 'contain',
            title: '家計簿',
            text: '家計簿に関する操作を選択してください',
            actions: [
                {
                    type: 'postback',
                    label: '報告する',
                    data: JSON.stringify({ type: 'accountBook', action: 'report' })
                },
                {
                    type: 'postback',
                    label: '確認する',
                    data: JSON.stringify({ type: 'accountBook', action: 'check' })
                },
                {
                    type: 'postback',
                    label: '今月の支出',
                    data: JSON.stringify({ type: 'accountBook', action: 'summary' })
                }
            ]
        });
    }
    /**
     * 買い出しリストコマンドの処理
     */
    async handlePurchaseListCommand(replyToken) {
        await this.lineService.replyText(replyToken, '買い出しリストの操作を選択してください。');
    }
    /**
     * チャットコマンドかどうかを判定
     */
    isChatCommand(message) {
        const chatTriggers = ['うさこ', 'usako', 'Usako'];
        return chatTriggers.some(trigger => message.toLowerCase().includes(trigger.toLowerCase()));
    }
}
exports.MessageHandler = MessageHandler;
exports.default = MessageHandler;
