class RemindInputDoneHouseworks extends commandBase { // eslint-disable-line no-unused-vars, no-undef

  constructor() {
    super('実施済家事入力のリマインドバッチ');
  }

  main () {
    super.main();
  }

  /**
   * 週ごとの実施済家事の入力をリマインドする
   * 毎週土曜 PM11〜12時
   */
  run() {
    Logger.log('called ' + this.constructor.name + ':run()');
    const line = new LineMessagingApi(); // eslint-disable-line no-undef
    line.pushAll(`今週もおつかれさま！
家事の報告は今日の12時までに済ませてね。
遅れると、1時からの集計に間に合わないよ！`);
  }
}

function remindInputDoneHouseworks () { // eslint-disable-line no-unused-vars
  const batch = new RemindInputDoneHouseworks();
  batch.main();
}