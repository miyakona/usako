"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHandler = void 0;
class ChatHandler {
    constructor(lineService, sheetsService) {
        this.imgUrl = 'https://example.com/chat.jpg'; // 実際の画像URLに置き換える
        this.lineService = lineService;
        this.sheetsService = sheetsService;
    }
    /**
     * チュートリアルに表示するためのテンプレートに利用する配列を取得する
     */
    getTemplateColumn() {
        return {
            thumbnailImageUrl: this.imgUrl,
            title: 'うさことおしゃべり',
            text: '登録された言葉以外で話しかけると、私とおしゃべりできるよ♪',
            actions: [{
                    type: 'message',
                    label: 'おしゃべり！',
                    text: 'うさこ〜〜〜'
                }]
        };
    }
    /**
     * メッセージを処理する
     */
    async handleMessage(message) {
        return await this.sheetsService.getRandomChatMessage();
    }
}
exports.ChatHandler = ChatHandler;
