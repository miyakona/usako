const AccountBookSummary = require('../../tasks/accountBook/accountBookSummary');
const AccountBook = require('../../classes/accountBook');
const LineMessagingApi = require('../../classes/lineMessagingApi');

jest.mock('../../classes/accountBook');
jest.mock('../../classes/lineMessagingApi');

describe('AccountBookSummary', () => {
  let accountBookSummary;
  let mockAccountBook;
  let mockLineMessagingApi;
  let mockSummarySheet;
  let mockVariableCostSheet;

  beforeEach(() => {
    mockSummarySheet = {
      getRange: jest.fn().mockReturnValue({
        getValues: jest.fn(),
        setValue: jest.fn()
      }),
      getLastRow: jest.fn(),
      getLastColumn: jest.fn(),
    };
    mockVariableCostSheet = {
      clear: jest.fn(),
    };
    mockAccountBook = {
      getVariableCost: jest.fn(),
      getFixedCost: jest.fn(),
      getSummarySheet: jest.fn().mockReturnValue(mockSummarySheet),
      getVariableCostSheet: jest.fn().mockReturnValue(mockVariableCostSheet),
      getSummary: jest.fn(),
      getGraph: jest.fn(),
    };
    mockLineMessagingApi = {
      pushAll: jest.fn(),
    };

    AccountBook.mockImplementation(() => mockAccountBook);
    LineMessagingApi.mockImplementation(() => mockLineMessagingApi);

    accountBookSummary = new AccountBookSummary();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('run', () => {
    it('正しく実行されること', () => {
      const mockVariableCost = [
        ['user1', '2024', '2', '食費', 1000],
        ['user2', '2024', '2', '雑費', 2000],
      ];
      const mockFixedCost = [
        ['ガス', 3000, 'user1'],
        ['電気', 4000, 'user2'],
      ];
      const mockSummary = 'サマリ内容';
      const mockGraph = 'https://example.com/graph';
      const mockIndexes = [
        ['食費'],
        ['雑費'],
        ['ガス'],
        ['電気'],
        ['日付'],
      ];

      mockAccountBook.getVariableCost.mockReturnValue(mockVariableCost);
      mockAccountBook.getFixedCost.mockReturnValue(mockFixedCost);
      mockAccountBook.getSummary.mockReturnValue(mockSummary);
      mockAccountBook.getGraph.mockReturnValue(mockGraph);
      mockSummarySheet.getLastRow.mockReturnValue(5);
      mockSummarySheet.getLastColumn.mockReturnValue(1);
      mockSummarySheet.getRange().getValues.mockReturnValue(mockIndexes);

      accountBookSummary.run();

      expect(mockLineMessagingApi.pushAll).toHaveBeenCalledTimes(2);
      expect(mockVariableCostSheet.clear).toHaveBeenCalled();
    });
  });

  describe('aggregate', () => {
    it('変動費と固定費を正しく集計すること', () => {
      const dt = new Date('2024-02-01');
      const variableCost = [
        ['user1', '2024', '2', '食費', 1000],
        ['user2', '2024', '2', '雑費', 2000],
      ];
      const fixedCost = [
        ['ガス', 3000, 'user1'],
        ['電気', 4000, 'user2'],
      ];

      const result = accountBookSummary.aggregate(dt, variableCost, fixedCost);

      expect(result).toEqual({
        '食費': 1000,
        '雑費': 2000,
        'その他': 0,
        'ガス': 3000,
        '電気': 4000,
        '水道': 0,
        '車': 0,
        '嗜好品': 0,
        '外食': 0,
        '炭酸水': 0,
        '日付': '2024/02'
      });
    });
  });

  describe('update', () => {
    it('サマリシートを正しく更新すること', () => {
      const mockIndexes = [
        ['食費'],
        ['雑費'],
        ['ガス'],
        ['電気'],
        ['日付'],
      ];
      const currentData = {
        '食費': 1000,
        '雑費': 2000,
        'ガス': 3000,
        '電気': 4000,
        '日付': '2024/02'
      };

      mockSummarySheet.getLastRow.mockReturnValue(5);
      mockSummarySheet.getLastColumn.mockReturnValue(1);
      mockSummarySheet.getRange().getValues.mockReturnValue(mockIndexes);

      accountBookSummary.update(mockSummarySheet, currentData);

      expect(mockSummarySheet.getRange).toHaveBeenCalledTimes(12);
    });
  });

  describe('getDiff', () => {
    it('前月比と前年同月比を正しく計算すること', () => {
      const mockIndexes = [
        ['食費'],
        ['雑費'],
        ['ガス'],
        ['電気'],
        ['日付']
      ];
      const mockCurrent = [
        [1000],
        [2000],
        [3000],
        [4000],
        ['2024/02']
      ];
      const mockLastMonth = [
        [800],
        [1800],
        [3000],
        [4000],
        ['2024/01']
      ];
      const mockLastYear = [
        [900],
        [1900],
        [3000],
        [4000],
        ['2023/02']
      ];

      mockSummarySheet.getLastRow.mockReturnValue(5);
      mockSummarySheet.getLastColumn.mockReturnValue(3);
      mockSummarySheet.getRange().getValues
        .mockReturnValueOnce(mockIndexes)
        .mockReturnValueOnce(mockCurrent)
        .mockReturnValueOnce(mockLastMonth)
        .mockReturnValueOnce(mockLastYear);

      const result = accountBookSummary.getDiff(mockSummarySheet);

      expect(result).toEqual({
        lastMonth: {
          '食費': 200,
          '雑費': 200,
          'ガス': 0,
          '電気': 0
        },
        lastYear: {
          '食費': 100,
          '雑費': 100,
          'ガス': 0,
          '電気': 0
        }
      });
    });
  });

  describe('getMessage', () => {
    it('正しいメッセージを生成すること', () => {
      const diff = {
        lastMonth: {
          '食費': 200,
          '雑費': 200,
          'ガス': 0,
          '電気': 0
        },
        lastYear: {
          '食費': 100,
          '雑費': 100,
          'ガス': 0,
          '電気': 0
        }
      };
      const current = {
        '食費': 1000,
        '雑費': 2000,
        'ガス': 3000,
        '電気': 4000,
        '日付': '2024/02'
      };
      const graph = 'https://example.com/graph';

      const result = accountBookSummary.getMessage(diff, current, graph);

      expect(result).toContain('今月の出費は合計で 10,000 円 でした。');
      expect(result).toContain('今月は、先月に比べて +400 円 でした。');
      expect(result).toContain('去年の同じ月と比べると、 200円 の差があるよ！');
      expect(result).toContain(graph);
    });
  });
}); 