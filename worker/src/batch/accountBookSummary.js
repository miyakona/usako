"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountBookSummaryHandler = void 0;
const googleSheets_1 = require("../services/googleSheets");
const commandBaseHandler_1 = require("../handlers/commandBaseHandler");
class AccountBookSummaryHandler extends commandBaseHandler_1.CommandBaseHandler {
    constructor(env, lineService, sheetsService) {
        super(env, lineService);
        this.sheetsService = sheetsService || new googleSheets_1.GoogleSheetsService(env);
    }
    /**
     * 実行メソッド
     */
    async run() {
        try {
            // 月次の支出サマリを取得
            const monthlySummary = await this.sheetsService.getAccountBookSummary();
            // サマリをLINEで通知
            await this.lineService.pushAll(monthlySummary);
        }
        catch (error) {
            // エラー時の処理
            await this.handleError('出費のサマリ通知バッチ', error);
        }
    }
    /**
     * handleMessageメソッドの実装（バッチ処理では使用しない）
     */
    async handleMessage(replyToken, message, userId) {
        // バッチ処理のため、このメソッドは使用されない
        throw new Error('Not implemented');
    }
    /**
     * エラーハンドリング
     */
    async handleError(context, error) {
        const errorMessage = `${context}の実行に失敗しました。
エラーメッセージ: ${error.message}

スタックトレース:
${error.stack || ''}`;
        console.error(errorMessage);
        await this.lineService.pushAll(errorMessage);
    }
}
exports.AccountBookSummaryHandler = AccountBookSummaryHandler;
