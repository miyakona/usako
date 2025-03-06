class commandBase { // eslint-disable-line no-unused-vars

  constructor (name){
    this.name = name;
  }

  /**
   * バッチ実行
   */
  main() {
    try {
      this.run();
    } catch (e) {
      this.notice(e.message, e.stack);
    } finally {
      Logger.log('end ' + this.name);
    }
  }

  /**
   * 失敗時の通知
   *
   * @param string errorMessage エラーメッセージ
   * @param string stack スタックトレース
   */
  notice(errorMessage, stack) {
    const line = new LineMessagingApi(); // eslint-disable-line no-undef
    let message = `${this.name} の実行に失敗しました。

error message: ${errorMessage}

stack trace:
${stack}`;

    Logger.log(message);
    line.pushAll(message);
  }

  /**
   * 実挙動メソッド。
   * 内容は継承先のクラスにて実装。
   */
  run() {}
}

module.exports = commandBase;
