"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineMessagingService = void 0;
class LineMessagingService {
    constructor(env) {
        this.channelAccessToken = env.LINE_CHANNEL_ACCESS_TOKEN;
    }
    /**
     * テキストメッセージを返信する
     */
    async replyText(replyToken, text) {
        const message = {
            type: 'text',
            text: text
        };
        await this.reply(replyToken, [message]);
    }
    /**
     * ボタンテンプレートを返信する
     */
    async replyTemplateButton(replyToken, altText, options) {
        const message = {
            type: 'template',
            altText: altText,
            template: {
                type: 'buttons',
                thumbnailImageUrl: options.thumbnailImageUrl,
                imageAspectRatio: options.imageAspectRatio,
                imageSize: options.imageSize,
                title: options.title,
                text: options.text,
                actions: options.actions
            }
        };
        await this.reply(replyToken, [message]);
    }
    /**
     * カルーセルテンプレートを返信する
     */
    async replyTemplateCarousel(replyToken, columns) {
        const message = {
            type: 'template',
            altText: 'カルーセルテンプレート',
            template: {
                type: 'carousel',
                columns: columns
            }
        };
        await this.reply(replyToken, [message]);
    }
    /**
     * メッセージを返信する
     */
    async reply(replyToken, messages) {
        const postData = {
            replyToken: replyToken,
            messages: messages
        };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.channelAccessToken}`
            },
            body: JSON.stringify(postData)
        };
        const response = await fetch('https://api.line.me/v2/bot/message/reply', options);
        if (!response.ok) {
            throw new Error('Failed to send message');
        }
    }
    /**
     * メッセージをプッシュする
     */
    async push(text, to) {
        const message = {
            type: 'text',
            text: text
        };
        const postData = {
            to: to,
            messages: [message]
        };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.channelAccessToken}`
            },
            body: JSON.stringify(postData)
        };
        const response = await fetch('https://api.line.me/v2/bot/message/push', options);
        if (!response.ok) {
            throw new Error('Failed to send message');
        }
    }
    /**
     * 全ユーザーにメッセージをプッシュする
     */
    async pushAll(text) {
        // 実際の実装では、ユーザーIDのリストを取得して各ユーザーにプッシュする必要があります
        // この例では簡略化のため、特定のユーザーIDを環境変数から取得することを想定しています
        console.log('Push to all users:', text);
    }
}
exports.LineMessagingService = LineMessagingService;
