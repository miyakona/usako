const commandBase = require('../classes/commandBase');

class NoticeTrashDay extends commandBase { // eslint-disable-line no-unused-vars, no-undef

  constructor() {
    super('ゴミの日通知バッチ');
  }

  main () {
    super.main();
  }

  /**
   * ゴミ捨て通知
   * 毎日 PM8〜9時
   */
  run() {
    Logger.log('called ' + this.constructor.name + ':run()');
    const dt = new Date();
    dt.setDate(dt.getDate() + 1);
    const comment = [];

    // 翌日が第何週目かを求める
    const firstDayOfMonth = new Date(dt.getFullYear(), dt.getMonth(), 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const dayOfMonth = dt.getDate();
    const isTheWhatWeekly = Math.floor((dayOfMonth + firstDayOfWeek - 1) / 7) + 1;
    const day = dt.getDay();

    // 土曜日と日曜日は通知しない
    if (day === 0 || day === 6) {
      return;
    }

    // 曜日に応じてゴミの種類を判定
    switch(day) {
      // 月曜日のごみ
      case 1:
        comment.push('可燃ごみ');
        break;
      // 火曜日のごみ
      case 2:
        if (isTheWhatWeekly === 2 || isTheWhatWeekly === 4) {
          comment.push('不燃ごみ');
        }
        if (isTheWhatWeekly === 1 || isTheWhatWeekly === 3) {
          comment.push('資源再生物');
        }
        break;
      // 水曜日のごみ
      case 3:
        comment.push('プラクル');
        break;
      // 木曜日のごみ
      case 4:
        comment.push('可燃ごみ');
        break;
    }

    // ごみの日じゃない場合は何もしない
    if (comment.length < 1) {
      return;
    }

    const line = new LineMessagingApi(); // eslint-disable-line no-undef
    line.pushAll('明日は ' + comment.join('、') + ' のゴミの日だよ！\n準備忘れずに！');
  }
}

function noticeTrashday () { // eslint-disable-line no-unused-vars
  const batch = new NoticeTrashDay();
  batch.main();
}

module.exports = NoticeTrashDay;