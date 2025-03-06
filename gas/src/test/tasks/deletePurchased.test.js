const DeletePurchased = require('../../tasks/deletePurchased');
const Purchase = require('../../claasess/purchase');

jest.mock('../../claasess/purchase');

describe('DeletePurchased', () => {
  let deletePurchased;
  let mockSheet;
  let mockPurchase;

  beforeEach(() => {
    // モックの設定
    mockSheet = {
      getRange: jest.fn().mockReturnValue({
        getValues: jest.fn(),
      }),
      getLastRow: jest.fn().mockReturnValue(3),
      deleteRow: jest.fn(),
    };

    mockPurchase = {
      getSheet: jest.fn().mockReturnValue(mockSheet),
    };

    Purchase.mockImplementation(() => mockPurchase);

    deletePurchased = new DeletePurchased();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('正しい名前で初期化されること', () => {
      expect(deletePurchased.name).toBe('買い出しリスト整理バッチ');
    });
  });

  describe('run', () => {
    it('リストが空の場合、何も実行しないこと', () => {
      mockSheet.getLastRow.mockReturnValue(1);
      deletePurchased.run();

      expect(mockSheet.deleteRow).not.toHaveBeenCalled();
    });

    it('完了済みの品目を削除すること', () => {
      mockSheet.getLastRow.mockReturnValue(3);
      mockSheet.getRange().getValues.mockReturnValue([
        ['品物1', '未'],
        ['品物2', '済'],
        ['品物3', '済'],
      ]);

      deletePurchased.run();

      expect(mockSheet.deleteRow).toHaveBeenCalledTimes(2);
      expect(mockSheet.deleteRow).toHaveBeenCalledWith(3); // 品物2の行
      expect(mockSheet.deleteRow).toHaveBeenCalledWith(4); // 品物3の行
    });

    it('未完了の品目は削除しないこと', () => {
      mockSheet.getLastRow.mockReturnValue(3);
      mockSheet.getRange().getValues.mockReturnValue([
        ['品物1', '未'],
        ['品物2', '未'],
        ['品物3', '済'],
      ]);

      deletePurchased.run();

      expect(mockSheet.deleteRow).toHaveBeenCalledTimes(1);
      expect(mockSheet.deleteRow).toHaveBeenCalledWith(4); // 品物3の行のみ
    });
  });
}); 