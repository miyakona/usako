class LineMessagingApi{ // eslint-disable-line no-unused-vars

  constructor () {
    this.channelAccessToken = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
  }

  /**
   * ユーザー全員に向けてpush通知を送信する
   *
   * @param string text  送信メッセージの内容
   */
  pushAll(text) {
    Logger.log('called ' + this.constructor.name + ':pushAll()');
    this.push(text, PropertiesService.getScriptProperties().getProperty('USER1_ID'));
    this.push(text, PropertiesService.getScriptProperties().getProperty('USER2_ID'));
  }

  /**
   * テキストの返信をする
   *
   * @param string replyToken 返信用トークン
   * @param string text 送信文章
   */
  replyText(replyToken, text) {
    Logger.log('called ' + this.constructor.name + ':replyText()');
    const postData = {
        "replyToken" : replyToken,
        "messages" : [
          {
              "type" : "text",
              "text" : String(text)
          }
        ]
    };
    this.reply(postData);
  }

  /**
   * テンプレートボタンメッセージの返信をする
   *
   * @param string replyToken 返信用トークン
   * @param string altText 代替テキスト
   * @param string thumbnailImageUrl 画像URL
   * @param string imageAspectRatio 画像のアスペクト比
   * @param string imageSize 画像の表示形式
   * @param string title タイトル
   * @param string text メッセージテキスト
   * @param string actions タップされたときのアクション
   */
  replyTemplateButton(replyToken, altText, thumbnailImageUrl, imageAspectRatio, imageSize, title, text, actions) {
    Logger.log('called ' + this.constructor.name + ':replyTemplateButton()');
    const postData = {
      "replyToken" : replyToken,
      "messages" : [
        {
          "type": "template",
          "altText": altText,
          "template": {
            "type": "buttons",
            "thumbnailImageUrl": thumbnailImageUrl,
            "imageAspectRatio": imageAspectRatio,
            "imageSize": imageSize,
            "title": title,
            "text": text,
            "actions": actions
          }
        }
      ]
    };
    this.reply(postData);
  }

  /**
   * テンプレートカルーセルメッセージを返信する
   *
   * @param string replyToken 返信用トークン
   * @param array columns カラムオブジェクトの配列
   */
  replyTemplateCarousel(replyToken, columns) {
    Logger.log('called ' + this.constructor.name + ':replyTemplateCarousel()');
    const postData = {
      "replyToken" : replyToken,
      "messages" : [
        {
          "type": "template",
          "altText": '機能一覧の表示',
          "template": {
            "type": "carousel",
            "columns":columns,
            "imageAspectRatio": 'square',
            "imageSize" : 'contain'
          }
        }
      ]
    };
    this.reply(postData);
  }

  /**
   * LINEで返事を送信する
   *
   * @param array postData 返信内容の配列
   */
  reply(postData) {
    Logger.log('called ' + this.constructor.name + ':reply()');
    UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", this.getOptions(postData));
  }

  /**
   * プッシュメッセージAPI
   *
   * @param string text  送信メッセージの内容
   * @param string to    ユーザID
   */
  push(text, to) {
    Logger.log('called ' + this.constructor.name + ':push()');
    const postData = {
      'to' : to,
      'messages' : [
        {
          'type' : 'text',
          'text' : text
        }
      ]
    };
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', this.getOptions(postData));
  }

  /**
   * 各APIで共通の設定配列を取得する
   *
   * @param array postData 送信内容の配列
   * @return array 設定配列
   */
   getOptions(postData) {
    Logger.log('called ' + this.constructor.name + ':getOptions()');
     return {
        'method' : 'post',
        'headers' : {
          'Content-Type' : 'application/json',
          'Authorization' : 'Bearer ' + this.channelAccessToken
        },
        'payload' : JSON.stringify(postData),
        'muteHttpExceptions' : true
      };
   }
}

module.exports = LineMessagingApi;