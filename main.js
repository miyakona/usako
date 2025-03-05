/**
 * LINEのwebhookに反応する。
 */
function doPost(e) { // eslint-disable-line no-unused-vars
  const posted_json = JSON.parse(e.postData.contents);
  const events = posted_json.events;
  const line = new LineMessagingApi(); // eslint-disable-line no-undef
  Logger.log('called ' + arguments.callee.name);
  try {
    events.forEach(function(event) {
      switch(event.type) {
        case 'postback':
          handlePostback_(event.replyToken, event.postback.data, event.source.userId);
          break;
        case 'message':
          handleMessage_(event.message.text, event.replyToken);
          break;
        default:
          line.replyText(event.replyToken, '想定外のイベントが送信されました。');
          break;
      }
    });
  } catch (e) {
    let message = `error message: ${e.message}

stack trace:
${e.stack}`;
    Logger.log(message);
  } finally {
    Logger.log('end ' + arguments.callee.name);
  }
}

/**
 * 選択に対する返事を送信する
 *
 * @param string replyToken 返信用トークン
 * @param string data        送信されたデータ
 * @param string user_id     送信元のユーザID
 */
function handlePostback_(replyToken, data, user_id) {
  data = JSON.parse(data);
  var text = '';
  const accountBook = new AccountBook(); // eslint-disable-line no-undef
  const housework = new Housework(); // eslint-disable-line no-undef
  switch(data.type)
  {
    case 'housework':
      text = housework.getMessage(data.action, user_id);
      break;

    case 'accountBook':
      text = accountBook.getMessage(data.action);
      break;
  }
  const line = new LineMessagingApi(); // eslint-disable-line no-undef
  line.replyText(replyToken, text);
}

/**
 * 各コマンドに対する応答を管理する
 *
 * @param string messageText 受け取った文章
 * @param string replyToken イベントオブジェクト
 */
function handleMessage_(messageText, replyToken) {
  Logger.log('called ' + arguments.callee.name);

  const line = new LineMessagingApi(); // eslint-disable-line no-undef

  const chat = new Chat(); // eslint-disable-line no-undef
  const purchase = new Purchase(); // eslint-disable-line no-undef
  const housework = new Housework(); // eslint-disable-line no-undef
  const accountBook = new AccountBook(); // eslint-disable-line no-undef

  // コマンド系
  var action = [];
  switch(messageText)
  {
    case '家事管理' :
      Logger.log('called ' + arguments.callee.name + ' 家事管理');
      action = housework.getButtonTemplateAction();
      line.replyTemplateButton(
        replyToken,
        action['altText'],
        action['image'],
        action['imageAspectRatio'],
        action['imageSize'],
        action['title'],
        action['text'],
        action['action']
      );
      break;

    case '家計簿' :
      Logger.log('called ' + arguments.callee.name + ' 家計簿');
      action = accountBook.getButtonTemplateAction();
      line.replyTemplateButton(
        replyToken,
        action['altText'],
        action['image'],
        action['imageAspectRatio'],
        action['imageSize'],
        action['title'],
        action['text'],
        action['action']
      );
      break;

    case 'チュートリアル' :
      Logger.log('called ' + arguments.callee.name + ' チュートリアル');
      line.replyTemplateCarousel(
        replyToken,
        [
          housework.getTemplateColumn(),
          accountBook.getTemplateColumn(),
          purchase.getTemplateColumn(),
          chat.getTemplateColumn()
        ]
      );
      break;
  }

  // 自由記述系
  if (messageText.match(/買い出し/)) {
    Logger.log('called ' + arguments.callee.name + ' 買い出し');
    line.replyText(replyToken, purchase.getMessage(messageText));
  }

  line.replyText(replyToken, chat.getMessage());
}