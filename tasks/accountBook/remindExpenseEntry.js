class RemindExpenseEntry extends commandBase { // eslint-disable-line no-unused-vars, no-undef

  constructor() {
    super('出費入力のリマインドバッチ');
  }

  main () {
    super.main();
  }

  /**
   * 出費入力のリマインドバッチ
   * 毎月25日 PM7〜8時
   */
  run() {
    Logger.log('called ' + this.constructor.name + ':run()');
    const line = new LineMessagingApi(); // eslint-disable-line no-undef
    line.pushAll(`今月もおつかれさま！
出費の報告は26日の18時までに済ませてね。遅れる場合は、翌月の出費として報告してね！
支払い額の通知、出費全体の通知は26日の19時頃にくるよ！`);
  }
}

function remindExpenseEntry () { // eslint-disable-line no-unused-vars
  const batch = new RemindExpenseEntry();
  batch.main();
}