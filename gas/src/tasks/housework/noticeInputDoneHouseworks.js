const commandBase = require('../../classes/commandBase');

class NoticeInputDoneHouseworks extends commandBase { // eslint-disable-line no-unused-vars, no-undef

  constructor() {
    super('家事入力警告バッチ');
  }

  main () {
    super.main();
  }

  /**
   * 月末の深夜に書き込まないように警告する
   * ※アーカイブは ArchiveHouseworks クラスにて
   * 毎週土曜 PM9〜10時
   */
  run() {
    Logger.log('called ' + this.constructor.name + ':run()');
    const dt = new Date();
    dt.setDate(dt.getDate() + 1);
    // その月の第一日曜日の前日ならアーカイブを通知
    if ((Math.floor((dt.getDate() - 1 ) / 7) + 1) == 1) {
      const line = new LineMessagingApi(); // eslint-disable-line no-undef
          line.pushAll(`2時〜3時の間に今月の家事実績をアーカイブするよ。
入力は控えてね！`);
    }
  }
}

function noticeInputDoneHouseworks () { // eslint-disable-line no-unused-vars
  const batch = new NoticeInputDoneHouseworks();
  batch.main();
}

module.exports = NoticeInputDoneHouseworks;