const Purchase = require('../../classes/purchase');

describe('Purchase', () => {
  let purchase;
  let mockSheet;
  let mockProperties;

  beforeEach(() => {
    // モックの設定
    const mockRange = {
      getValues: jest.fn(),
      setValue: jest.fn(),
    };

    mockSheet = {
      getRange: jest.fn().mockReturnValue(mockRange),
      getLastRow: jest.fn().mockReturnValue(3),
      setActiveCell: jest.fn().mockReturnThis(),
      setValue: jest.fn(),
    };

    mockProperties = {
      getScriptProperties: jest.fn().mockReturnValue({
        getProperty: jest.fn().mockImplementation((key) => {
          const properties = {
            'MAIN_SHEET': 'https://example.com/spreadsheet',
            'IMG_PURCHASE': 'https://example.com/image.jpg',
          };
          return properties[key] || null;
        }),
      }),
    };

    global.SpreadsheetApp = {
      openByUrl: jest.fn().mockReturnValue({
        getSheetByName: jest.fn().mockReturnValue(mockSheet),
      }),
    };

    global.PropertiesService = mockProperties;
    global.Logger = {
      log: jest.fn(),
    };

    purchase = new Purchase();
  });

  describe('constructor', () => {
    it('プロパティが正しく設定されること', () => {
      expect(purchase.imgUrl).toBe('https://example.com/image.jpg');
      expect(purchase.commandSampleAdd).toBe(`買い出し
xxx
yyy
欲しい`);
      expect(purchase.commandSampleDelete).toBe(`買い出し
xxx
yyy
買ったよ`);
      expect(purchase.commandSampleList).toBe(`買い出し
リスト`);
      expect(purchase.commandSampleDeleteAll).toBe(`買い出し
全消し`);
    });
  });

  describe('getTemplateColumn', () => {
    it('正しいテンプレートを返すこと', () => {
      const result = purchase.getTemplateColumn();

      expect(result).toEqual({
        thumbnailImageUrl: 'https://example.com/image.jpg',
        title: '買い出しリストの管理',
        text: '買い出しリストの操作ができるよ！\nリストは、2人とも参照可能だよ',
        actions: [{
          type: 'message',
          label: 'リストを見てみる',
          text: purchase.commandSampleList,
        }],
      });
    });
  });

  describe('getMessage', () => {
    it('リストコマンドでgetListを呼び出すこと', () => {
      purchase.getList = jest.fn().mockReturnValue('テスト用のリスト');
      const result = purchase.getMessage(purchase.commandSampleList);

      expect(result).toBe('テスト用のリスト');
      expect(purchase.getList).toHaveBeenCalled();
    });

    it('買ったよコマンドでdeleteを呼び出すこと', () => {
      purchase.delete = jest.fn().mockReturnValue('テスト用の削除結果');
      const result = purchase.getMessage(`買い出し
品物1
品物2
買ったよ`);

      expect(result).toBe('テスト用の削除結果');
      expect(purchase.delete).toHaveBeenCalledWith(['品物1', '品物2']);
    });

    it('欲しいコマンドでaddを呼び出すこと', () => {
      purchase.add = jest.fn().mockReturnValue('テスト用の追加結果');
      const result = purchase.getMessage(`買い出し
品物1
品物2
欲しい`);

      expect(result).toBe('テスト用の追加結果');
      expect(purchase.add).toHaveBeenCalledWith(['品物1', '品物2']);
    });

    it('全消しコマンドでdeleteAllを呼び出すこと', () => {
      purchase.deleteAll = jest.fn().mockReturnValue('テスト用の全削除結果');
      const result = purchase.getMessage(`買い出し
全消し`);

      expect(result).toBe('テスト用の全削除結果');
      expect(purchase.deleteAll).toHaveBeenCalled();
    });

    it('不正なコマンドでエラーメッセージを返すこと', () => {
      const result = purchase.getMessage(`買い出し
不正なコマンド`);

      expect(result).toBe('「リスト」「買ったよ」「欲しい」のどれかで話しかけて…！！！');
    });

    it('フォーマットエラーでエラーメッセージを返すこと', () => {
      const result = purchase.getMessage('買い出し');

      expect(result).toContain('フォーマットエラーだよ！');
      expect(result).toContain('①リストを確認');
      expect(result).toContain('②リストから削除');
      expect(result).toContain('③リストに追加');
      expect(result).toContain('③リストから全削除');
    });
  });

  describe('getList', () => {
    it('リストが空の場合、適切なメッセージを返すこと', () => {
      mockSheet.getLastRow.mockReturnValue(1);
      const result = purchase.getList();

      expect(result).toContain('今登録されている品目はないよ。');
      expect(result).toContain(purchase.commandSampleAdd);
    });

    it('リストに未完了の品目がある場合、リストを返すこと', () => {
      mockSheet.getLastRow.mockReturnValue(3);
      mockSheet.getRange().getValues.mockReturnValue([
        ['品物1', '未'],
        ['品物2', '済'],
      ]);

      const result = purchase.getList();

      expect(result).toContain('買い出しリストには、いま以下の品目が登録されてるよ！');
      expect(result).toContain('品物1');
      expect(result).not.toContain('品物2');
      expect(result).toContain(purchase.commandSampleDelete);
    });

    it('リストに未完了の品目がない場合、空のメッセージを返すこと', () => {
      mockSheet.getLastRow.mockReturnValue(3);
      mockSheet.getRange().getValues.mockReturnValue([
        ['品物1', '済'],
        ['品物2', '済'],
      ]);

      const result = purchase.getList();

      expect(result).toContain('今登録されている品目はないよ。');
      expect(result).toContain(purchase.commandSampleAdd);
    });
  });

  describe('deleteAll', () => {
    it('リストが空の場合、適切なメッセージを返すこと', () => {
      mockSheet.getLastRow.mockReturnValue(1);
      const result = purchase.deleteAll();

      expect(result).toContain('まだリストに登録されてるものが無いみたい。');
      expect(result).toContain(purchase.commandSampleList);
    });

    it('リストに未完了の品目がある場合、削除して完了メッセージを返すこと', () => {
      mockSheet.getLastRow.mockReturnValue(3);
      mockSheet.getRange().getValues.mockReturnValue([
        ['品物1', '未'],
        ['品物2', '済'],
      ]);

      const result = purchase.deleteAll();

      expect(result).toBe('リストから品目を消しておいたよ〜');
      expect(mockSheet.getRange().setValue).toHaveBeenCalledWith('済');
    });

    it('リストに未完了の品目がない場合、空のメッセージを返すこと', () => {
      mockSheet.getLastRow.mockReturnValue(3);
      mockSheet.getRange().getValues.mockReturnValue([
        ['品物1', '済'],
        ['品物2', '済'],
      ]);

      const result = purchase.deleteAll();

      expect(result).toContain('まだリストに登録されてるものが無いみたい。');
      expect(result).toContain(purchase.commandSampleList);
    });
  });

  describe('delete', () => {
    it('リストが空の場合、適切なメッセージを返すこと', () => {
      mockSheet.getLastRow.mockReturnValue(1);
      const result = purchase.delete(['品物1']);

      expect(result).toContain('教えてもらった品目がリストに無いよ！');
      expect(result).toContain(purchase.commandSampleList);
    });

    it('指定した品目が存在する場合、削除して完了メッセージを返すこと', () => {
      mockSheet.getLastRow.mockReturnValue(3);
      mockSheet.getRange().getValues.mockReturnValue([
        ['品物1', '未'],
        ['品物2', '済'],
      ]);

      const result = purchase.delete(['品物1']);

      expect(result).toBe('リストから品目を消しておいたよ〜');
      expect(mockSheet.getRange().setValue).toHaveBeenCalledWith('済');
    });

    it('指定した品目が存在しない場合、エラーメッセージを返すこと', () => {
      mockSheet.getLastRow.mockReturnValue(3);
      mockSheet.getRange().getValues.mockReturnValue([
        ['品物1', '済'],
        ['品物2', '済'],
      ]);

      const result = purchase.delete(['品物3']);

      expect(result).toContain('教えてもらった品目がリストに無いよ！');
      expect(result).toContain(purchase.commandSampleList);
    });
  });

  describe('add', () => {
    it('品目が指定されていない場合、エラーメッセージを返すこと', () => {
      const result = purchase.add([]);

      expect(result).toContain('品目が指定されていないみたいだよ。');
      expect(result).toContain(purchase.commandSampleAdd);
    });

    it('品目を追加して完了メッセージを返すこと', () => {
      const items = ['品物1', '品物2'];
      const result = purchase.add(items);

      expect(result).toContain('買い出しリストに追加しておいたよ！');
      expect(result).toContain(purchase.commandSampleList);
      expect(mockSheet.setActiveCell).toHaveBeenCalledTimes(2);
      expect(mockSheet.setValue).toHaveBeenCalledTimes(2);
      items.forEach(item => {
        expect(mockSheet.setValue).toHaveBeenCalledWith(item);
      });
    });
  });

  describe('getSheet', () => {
    it('シートを返すこと', () => {
      expect(purchase.getSheet()).toBe(mockSheet);
    });
  });
}); 