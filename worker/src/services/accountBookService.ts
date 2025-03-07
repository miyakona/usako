export interface AccountBookService {
  /**
   * 変動費を取得する
   * @returns 変動費の配列
   */
  getVariableCost(): any[];

  /**
   * 固定費を取得する
   * @returns 固定費の配列
   */
  getFixedCost(): any[];

  /**
   * サマリーシートを取得する
   * @returns サマリーシート
   */
  getSummarySheet(): Promise<any>;

  /**
   * 変動費シートを取得する
   * @returns 変動費シート
   */
  getVariableCostSheet(): Promise<any>;

  /**
   * サマリーを取得する
   * @returns サマリー文字列
   */
  getSummary(): Promise<string>;

  /**
   * グラフのURLを取得する
   * @returns グラフのURL
   */
  getGraph(): Promise<string>;
} 