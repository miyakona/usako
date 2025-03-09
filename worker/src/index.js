"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const messageHandler_1 = require("./handlers/messageHandler");
const postbackHandler_1 = require("./handlers/postbackHandler");
exports.default = {
    async fetch(request, env, ctx) {
        // リクエストの処理
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, X-Line-Signature'
                }
            });
        }
        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }
        // LINE署名の検証
        const signature = request.headers.get('X-Line-Signature');
        if (!signature) {
            return new Response('Unauthorized: Missing signature', { status: 401 });
        }
        // リクエストボディの取得と解析
        let parsedBody;
        try {
            const body = await request.text();
            parsedBody = JSON.parse(body);
        }
        catch (error) {
            console.error('Initial parse error:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : String(error);
            return new Response(`Invalid JSON: ${errorMessage}`, { status: 400 });
        }
        console.log('Parsed body:', JSON.stringify(parsedBody, null, 2));
        // イベントが空の場合の処理
        if (!parsedBody.events || parsedBody.events.length === 0) {
            console.log('Received webhook with no events');
            return new Response('No events', { status: 200 });
        }
        // イベントの処理
        console.log('Before event processing');
        const messageHandler = new messageHandler_1.MessageHandler(env);
        const postbackHandler = new postbackHandler_1.PostbackHandler(env);
        console.log(`Total events to process: ${parsedBody.events.length}`);
        console.log('MessageHandler initialized:', !!messageHandler);
        console.log('PostbackHandler initialized:', !!postbackHandler);
        const processingErrors = [];
        for (const event of parsedBody.events) {
            try {
                console.log(`Starting to process event: ${JSON.stringify(event, null, 2)}`);
                // イベントタイプに応じた処理を明示的に追加
                switch (event.type) {
                    case 'message':
                        console.log('Processing message event');
                        if (event.message?.type === 'text' && event.message.text && event.replyToken) {
                            console.log(`Calling handleMessage with: replyToken=${event.replyToken}, message=${event.message.text}, userId=${event.source?.userId}`);
                            await messageHandler.handleMessage(event.replyToken, event.message.text, event.source?.userId ?? '');
                        }
                        else {
                            console.log('Skipping non-text message or missing reply token');
                        }
                        break;
                    case 'postback':
                        console.log('Processing postback event');
                        if (event.postback?.data && event.replyToken) {
                            console.log(`Calling handlePostback with: replyToken=${event.replyToken}, data=${event.postback.data}, userId=${event.source?.userId}`);
                            await postbackHandler.handlePostback(event.replyToken, event.postback.data, event.source?.userId ?? '');
                        }
                        else {
                            console.log('Skipping postback without data or missing reply token');
                        }
                        break;
                    default:
                        console.log(`Unhandled event type: ${event.type}`);
                }
                console.log('Event processing completed successfully');
            }
            catch (error) {
                console.error('Error during event processing:', error);
                console.error('Error details:', {
                    type: typeof error,
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : 'No stack trace'
                });
                processingErrors.push(error);
            }
        }
        console.log(`Processed ${parsedBody.events.length - processingErrors.length} events successfully`);
        if (processingErrors.length > 0) {
            console.error('Errors during event processing:', processingErrors);
            return new Response('Partial processing error', { status: 500 });
        }
        return new Response('OK', { status: 200 });
    },
};
/**
 * LINEの署名を検証する
 */
async function verifySignature(body, signature, channelSecret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(channelSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const result = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedSignature = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(result))));
    return signature === expectedSignature;
}
/**
 * LINEイベントを処理する
 */
async function handleEvent(event, messageHandler, postbackHandler) {
    const { type, replyToken, source } = event;
    console.log(`Processing event: type=${type}, replyToken=${replyToken}`);
    console.log('Full event details:', JSON.stringify(event, null, 2));
    if (!replyToken) {
        console.log('Skipping event: No reply token');
        return;
    }
    try {
        switch (type) {
            case 'message':
                if (event.message?.type === 'text' && event.message.text) {
                    console.log(`Message event: text=${event.message.text}, userId=${source?.userId}`);
                    console.log('Calling messageHandler.handleMessage');
                    await messageHandler.handleMessage(replyToken, event.message.text, source?.userId);
                    console.log('messageHandler.handleMessage completed successfully');
                }
                else {
                    console.log(`Unsupported message type: ${event.message?.type}`);
                }
                break;
            case 'postback':
                if (event.postback?.data) {
                    console.log(`Postback event: data=${event.postback.data}, userId=${source?.userId}`);
                    console.log('Calling postbackHandler.handlePostback');
                    await postbackHandler.handlePostback(replyToken, event.postback.data, source?.userId ?? '');
                    console.log('postbackHandler.handlePostback completed successfully');
                }
                else {
                    console.log('Skipping postback: No postback data');
                }
                break;
            default:
                console.log(`Unhandled event type: ${type}`);
                break;
        }
    }
    catch (error) {
        console.error(`Error handling ${type} event:`, error instanceof Error ? error.message : error);
        console.error('Full event details:', JSON.stringify(event, null, 2));
        console.error('Error stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        // エラーを再スローしない
        throw error; // エラーを再スローして、呼び出し元で捕捉できるようにする
    }
}
