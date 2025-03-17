import { D1Database } from '../types/d1';

// データ型定義
export interface VariableCost {
  id?: number;
  date: string;
  category: string;
  amount: number;
  description?: string;
  user_id: string;
}

export interface Housework {
  id?: number;
  task: string;
  assignee: string;
  status: 'pending' | 'completed';
  due_date?: string;
}

export interface PurchaseItem {
  id?: number;
  item_name: string;
  quantity: number;
  status: 'pending' | 'purchased';
  user_id: string;
  created_at?: string;
}

export class D1Repository {
  private db: D1Database;

  constructor(db: D1Database) {
    if (!db) {
      console.error('D1Repository: データベースが未定義です');
      throw new Error('データベース接続が設定されていません');
    }
    
    // データベースインスタンスの詳細をログ出力
    console.log('D1Repository 初期化:', {
      dbType: typeof db,
      dbKeys: Object.keys(db),
      dbToString: db.toString(),
      dbName: (db as any).name,
      dbId: (db as any).id
    });

    this.db = db;
  }

  // 家計簿データの取得
  async getVariableCosts(
    userId: string, 
    options: { 
      limit?: number; 
      offset?: number; 
      startDate?: string; 
      endDate?: string 
    } = {}
  ): Promise<VariableCost[]> {
    try {
      // テーブルの存在確認
      const tableCheckStmt = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='variable_costs'
      `);
      
      console.log('テーブル存在確認クエリ実行前');
      const tableCheckResult = await tableCheckStmt.all();
      console.log('テーブル存在確認結果:', {
        tableCheckResult,
        tableExists: tableCheckResult.results.length > 0
      });

      if (tableCheckResult.results.length === 0) {
        console.error('テーブル variable_costs が存在しません');
        throw new Error('テーブルが見つかりません');
      }

      console.log('getVariableCosts 呼び出し:', { 
        userId, 
        options,
        dbInfo: {
          type: typeof this.db,
          keys: Object.keys(this.db),
          toString: this.db.toString()
        }
      });

      const { limit = 50, offset = 0, startDate, endDate } = options;
      
      let query = 'SELECT * FROM variable_costs WHERE user_id = ?';
      const params: any[] = [userId];

      if (startDate) {
        query += ' AND date >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND date <= ?';
        params.push(endDate);
      }

      query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      console.log('実行クエリ詳細:', { 
        query, 
        params,
        paramTypes: params.map(p => typeof p)
      });

      // クエリ準備と実行のデバッグ
      let stmt;
      try {
        stmt = this.db.prepare(query);
        console.log('ステートメント生成成功:', {
          stmtType: typeof stmt,
          stmtKeys: Object.keys(stmt)
        });
      } catch (prepareError) {
        console.error('ステートメント準備エラー:', {
          error: prepareError,
          errorName: prepareError instanceof Error ? prepareError.name : 'Unknown',
          errorMessage: prepareError instanceof Error ? prepareError.message : 'Unknown'
        });
        throw prepareError;
      }

      // バインドと実行のデバッグ
      let result;
      try {
        result = await stmt.bind(...params).all<VariableCost>();
        console.log('クエリ実行結果:', {
          resultType: typeof result,
          resultKeys: Object.keys(result),
          resultsLength: result.results ? result.results.length : 'N/A',
          success: result.success,
          lastRowId: result.lastRowId
        });
      } catch (executeError) {
        console.error('クエリ実行エラー:', {
          error: executeError,
          errorName: executeError instanceof Error ? executeError.name : 'Unknown',
          errorMessage: executeError instanceof Error ? executeError.message : 'Unknown'
        });
        throw executeError;
      }
      
      return result.results || [];
    } catch (error) {
      console.error('家計簿データ取得エラー:', {
        error,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw new Error('家計簿データの取得に失敗しました: ' + 
        (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // 家計簿データの追加
  async addVariableCost(cost: VariableCost): Promise<number | null> {
    try {
      console.log('addVariableCost 呼び出し:', { cost });

      const stmt = this.db.prepare(
        'INSERT INTO variable_costs (date, category, amount, description, user_id) VALUES (?, ?, ?, ?, ?)'
      );

      console.log('INSERT ステートメント準備:', {
        stmtType: typeof stmt,
        stmtKeys: Object.keys(stmt)
      });

      const result = await stmt.bind(
        cost.date, 
        cost.category, 
        cost.amount, 
        cost.description || null, 
        cost.user_id
      ).run();

      console.log('INSERT 実行結果:', {
        result,
        success: result.success,
        lastRowId: result.lastRowId
      });

      return result.success ? result.lastRowId : null;
    } catch (error) {
      console.error('家計簿データ追加エラー:', {
        error,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown'
      });
      throw new Error('家計簿データの追加に失敗しました');
    }
  }

  // 家事管理データの取得
  async getHouseworkList(
    assignee?: string, 
    status?: 'pending' | 'completed'
  ): Promise<Housework[]> {
    try {
      let query = 'SELECT * FROM housework WHERE 1=1';
      const params: any[] = [];

      if (assignee) {
        query += ' AND assignee = ?';
        params.push(assignee);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY due_date ASC';

      const stmt = this.db.prepare(query);
      const result = await stmt.bind(...params).all<Housework>();
      
      return result.results || [];
    } catch (error) {
      console.error('家事リスト取得エラー:', error);
      throw new Error('家事リストの取得に失敗しました');
    }
  }

  // 買い物リストの取得
  async getPurchaseList(
    userId: string, 
    status?: 'pending' | 'purchased'
  ): Promise<PurchaseItem[]> {
    try {
      let query = 'SELECT * FROM purchase_list WHERE user_id = ?';
      const params: any[] = [userId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC';

      const stmt = this.db.prepare(query);
      const result = await stmt.bind(...params).all<PurchaseItem>();
      
      return result.results || [];
    } catch (error) {
      console.error('買い物リスト取得エラー:', error);
      throw new Error('買い物リストの取得に失敗しました');
    }
  }

  // 買い物リストへのアイテム追加
  async addPurchaseItem(item: PurchaseItem): Promise<number | null> {
    try {
      const stmt = this.db.prepare(
        'INSERT INTO purchase_list (item_name, quantity, status, user_id, created_at) VALUES (?, ?, ?, ?, datetime("now"))'
      );

      const result = await stmt.bind(
        item.item_name, 
        item.quantity, 
        item.status || 'pending', 
        item.user_id
      ).run();

      return result.success ? result.lastRowId : null;
    } catch (error) {
      console.error('買い物リストアイテム追加エラー:', error);
      throw new Error('買い物リストへのアイテム追加に失敗しました');
    }
  }

  // トランザクション内での複数操作サポート
  async runTransaction<T>(
    operation: (tx: D1Database) => Promise<T>
  ): Promise<T> {
    try {
      // D1のトランザクション開始
      await this.db.prepare('BEGIN TRANSACTION').run();

      // 操作の実行
      const result = await operation(this.db);

      // トランザクションのコミット
      await this.db.prepare('COMMIT').run();

      return result;
    } catch (error) {
      // エラー発生時はロールバック
      await this.db.prepare('ROLLBACK').run();
      console.error('トランザクション実行エラー:', error);
      throw error;
    }
  }
} 