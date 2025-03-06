const AccountBook = require('../../claasess/accountBook');

// モックの設定
jest.mock('google-apps-script', () => ({
  SpreadsheetApp: {
    openByUrl: jest.fn(),
    getActiveSpreadsheet: jest.fn(),
    setActiveSheet: jest.fn(),
  },
  PropertiesService: {
    getScriptProperties: jest.fn(() => ({
      getProperty: jest.fn((key) => {
        const properties = {
          'MAIN_SHEET': 'https://example.com/spreadsheet',
          'GRAPH_ACCOUNT_BOOK': 'https://example.com/graph',
          'IMG_ACCOUNT_BOOK': 'https://example.com/image',
          'FORM_ACCOUNT_BOOK': 'https://example.com/form',
          'USER1_NAME': 'User1',
          'USER2_NAME': 'User2',
        };
        return properties[key];
      }),
    })),
  },
}));

describe('AccountBook', () => {
  let accountBook;
  let mockSheet;
  let mockSpreadsheet;
  let mockProperties;
  let originalDate;

  beforeEach(() => {
    mockSheet = {
      clear: jest.fn(),
      getLastRow: jest.fn(),
      getRange: jest.fn(),
      getValues: jest.fn()
    };
    mockSheet.getRange.mockReturnValue({
      getValues: jest.fn()
    });

    mockSpreadsheet = {
      getSheetByName: jest.fn().mockReturnValue(mockSheet)
    };

    mockProperties = {
      getProperty: jest.fn().mockImplementation((key) => {
        switch (key) {
          case 'GRAPH_ACCOUNT_BOOK':
            return 'https://example.com/graph';
          case 'IMG_ACCOUNT_BOOK':
            return 'https://example.com/image';
          case 'USER1_NAME':
            return 'user1';
          case 'USER2_NAME':
            return 'user2';
          default:
            return '';
        }
      })
    };

    SpreadsheetApp.openByUrl = jest.fn().mockReturnValue(mockSpreadsheet);
    SpreadsheetApp.getActiveSpreadsheet = jest.fn().mockReturnValue(mockSpreadsheet);
    PropertiesService.getScriptProperties = jest.fn().mockReturnValue(mockProperties);

    accountBook = new AccountBook();
  });

  afterEach(() => {
    if (originalDate) {
      global.Date = originalDate;
    }
  });

  describe('getMessage', () => {
    describe('26日以降の場合、来月の月を返す', () => {
      it('1月26日に実行する場合、2月を返す', () => {
        const mockDate = new Date('2024-01-26');
        originalDate = global.Date;
        global.Date = jest.fn(() => mockDate);
        global.Date.prototype = Object.create(Date.prototype);
        global.Date.prototype.getDate = jest.fn(() => 26);
        global.Date.prototype.getMonth = jest.fn(() => 0); // 0-based month (January)
        global.Date.prototype.getFullYear = jest.fn(() => 2024);

        const result = accountBook.getMessage('report');
        expect(result).toContain('entry.220269951=2024&entry.1155173829=02');
      });

      it('12月26日に実行する場合、翌年1月を返す', () => {
        const mockDate = new Date('2024-12-26');
        originalDate = global.Date;
        global.Date = jest.fn(() => mockDate);
        global.Date.prototype = Object.create(Date.prototype);
        global.Date.prototype.getDate = jest.fn(() => 26);
        global.Date.prototype.getMonth = jest.fn(() => 11); // 0-based month (December)
        global.Date.prototype.getFullYear = jest.fn(() => 2024);

        const result = accountBook.getMessage('report');
        expect(result).toContain('entry.220269951=2025&entry.1155173829=01');
      });
    });

    it('26日以前の場合、今月の月を返す', () => {
      const mockDate = new Date('2024-12-25');
      originalDate = global.Date;
      global.Date = jest.fn(() => mockDate);
      global.Date.prototype = Object.create(Date.prototype);
      global.Date.prototype.getDate = jest.fn(() => 25);
      global.Date.prototype.getMonth = jest.fn(() => 11); // 0-based month (December)
      global.Date.prototype.getFullYear = jest.fn(() => 2024);

      const result = accountBook.getMessage('report');
      expect(result).toContain('entry.220269951=2024&entry.1155173829=12');
    });
  });

  describe('getTemplateColumn', () => {
    it('正しいテンプレートを返すこと', () => {
      const result = accountBook.getTemplateColumn();
      expect(result).toEqual({
        "thumbnailImageUrl": "https://example.com/image",
        "title": "家計簿管理",
        "text": "生活費の報告と、報告内容の確認ができるよ\n毎月25日に決算だよ！",
        "actions": [{
          "type": "message",
          "label": "使ってみる",
          "text": "家計簿"
        }]
      });
    });
  });

  describe('getButtonTemplateAction', () => {
    it('正しいボタンテンプレートを返すこと', () => {
      const result = accountBook.getButtonTemplateAction();
      expect(result).toEqual({
        "action": [
          {
            "type": "postback",
            "label": "出費を書き込む",
            "data": '{"type":"accountBook", "action":"report"}'
          },
          {
            "type": "postback",
            "label": "報告済の支出を確認する",
            "data": '{"type":"accountBook", "action":"check"}'
          },
          {
            "type": "postback",
            "label": "支払額の中間報告を見る",
            "data": '{"type":"accountBook", "action":"summary"}'
          }
        ],
        "image": "https://example.com/image",
        "imageAspectRatio": "square",
        "imageSize": "contain",
        "title": "家計簿",
        "altText": "家計管理テンプレート",
        "text": "家計管理だね。\n報告？それとも確認？"
      });
    });
  });

  describe('getReported', () => {
    it('報告済の支出を正しく取得すること', () => {
      const mockValues = [
        ['user1', '2024', '2', '食費', 1000],
        ['user2', '2024', '2', '雑費', 2000],
      ];
      mockSheet.getRange().getValues.mockReturnValue(mockValues);

      const result = accountBook.getReported();
      expect(result).toBeDefined();
      expect(result).toContain('食費: 1000円（user1）');
      expect(result).toContain('雑費: 2000円（user2）');
    });
  });

  describe('getSummary', () => {
    it('サマリを正しく取得すること', () => {
      const mockValues = [
        ['食費', 1000],
        ['雑費', 2000],
        ['その他', 0],
        ['ガス', 3000],
        ['電気', 4000],
        ['水道', 0],
        ['嗜好品', 0],
        ['外食', 0],
        ['炭酸水', 0],
        ['車', 0],
        ['日付', '2024/02'],
      ];
      mockSheet.getRange().getValues.mockReturnValue(mockValues);

      const result = accountBook.getSummary();
      expect(result).toBeDefined();
      expect(result).toContain('user1さん支払い分 : 0円');
      expect(result).toContain('user2さん支払い分 : 0円');
      expect(result).toContain('食費 : 1000円');
      expect(result).toContain('雑費 : 2000円');
      expect(result).toContain('ガス : 3000円');
      expect(result).toContain('電気 : 4000円');
    });
  });

  describe('getPayment', () => {
    it('支払額を正しく計算すること', () => {
      const variableCost = [
        ['user1', '2024', '2', '食費', 1000],
        ['user2', '2024', '2', '雑費', 2000],
      ];
      const fixedCost = [
        ['ガス', 3000, 'user1'],
        ['電気', 4000, 'user2'],
      ];

      const result = accountBook.getPayment(variableCost, fixedCost);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('user1');
      expect(result).toHaveProperty('user2');
      expect(result.user1).toBe(3000); // user2の支払いの半額
      expect(result.user2).toBe(2000); // user1の支払いの半額
    });
  });

  describe('getDetail', () => {
    it('詳細を正しく取得すること', () => {
      const variableCost = [
        ['user1', '2024', '2', '食費', 1000],
        ['user2', '2024', '2', '雑費', 2000],
      ];
      const fixedCost = [
        ['ガス', 3000, 'user1'],
        ['電気', 4000, 'user2'],
      ];

      const result = accountBook.getDetail(variableCost, fixedCost);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
      expect(result[0]).toEqual(['食費', 1000, 'user1']);
      expect(result[1]).toEqual(['雑費', 2000, 'user2']);
      expect(result[2]).toEqual(['ガス', 3000, 'user1']);
      expect(result[3]).toEqual(['電気', 4000, 'user2']);
    });
  });

  describe('getVariableCost', () => {
    it('変動費を正しく取得すること', () => {
      const mockValues = [
        ['2024', '2', '食費', '食費', 1000],
        ['2024', '2', '雑費', '雑費', 2000],
      ];
      mockSheet.getRange().getValues.mockReturnValue(mockValues);

      const result = accountBook.getVariableCost();
      expect(result).toEqual(mockValues);
    });
  });

  describe('getFixedCost', () => {
    it('固定費を正しく取得すること', () => {
      const mockValues = [
        ['ガス', 3000],
        ['電気', 4000],
      ];
      mockSheet.getRange().getValues.mockReturnValue(mockValues);

      const result = accountBook.getFixedCost();
      expect(result).toEqual(mockValues);
    });
  });

  describe('getSummarySheet', () => {
    it('サマリシートを正しく取得すること', () => {
      const result = accountBook.getSummarySheet();
      expect(result).toBe(mockSheet);
    });
  });

  describe('getVariableCostSheet', () => {
    it('変動費シートを正しく取得すること', () => {
      const result = accountBook.getVariableCostSheet();
      expect(result).toBe(mockSheet);
    });
  });

  describe('getGraph', () => {
    it('グラフURLを正しく取得すること', () => {
      const result = accountBook.getGraph();
      expect(result).toBe('https://example.com/graph');
    });
  });
}); 