import { LineEvent, LineMessage } from '../types/index';
import { LineService } from '../services/line-service';
import { D1Repository, VariableCost, Housework, PurchaseItem } from '../repositories/d1-repository';
import { envConfig } from '../config/env';

// メッセージタイプの定義
type MessageType = 
  | '家計簿'
  | '家事管理'
  | '買い出しリスト'
  | 'ヘルプ';

export class MessageHandler {
  constructor(
    private lineService: LineService,
    private d1Repository: D1Repository
  ) {}

  // メインのメッセージ処理メソッド
  async handleMessage(event: LineEvent): Promise<LineMessage | null> {
    console.log('🔍 handleMessage呼び出し:', JSON.stringify(event, null, 2));

    if (event.type !== 'message' || event.message.type !== 'text') {
      console.log('❌ 非テキストメッセージのため処理をスキップ');
      return null;
    }

    const text = event.message.text || '';
    const userId = event.source.userId;

    if (!userId) {
      console.warn('⚠️ ユーザーIDが見つかりません');
      return null;
    }

    try {
      // メッセージの種類を判定
      const messageType = this.detectMessageType(text);
      console.log(`📋 検出されたメッセージタイプ: ${messageType}`);
      
      switch (messageType) {
        case '家計簿':
          console.log('💰 家計簿メッセージ処理開始');
          return this.handleVariableCostMessage(userId, text);
        case '家事管理':
          console.log('🧹 家事管理メッセージ処理開始');
          return this.handleHouseworkMessage(userId, text);
        case '買い出しリスト':
          console.log('🛒 買い出しリストメッセージ処理開始');
          return this.handlePurchaseListMessage(userId, text);
        case 'ヘルプ':
          console.log('❓ ヘルプメッセージ処理開始');
          return this.handleHelpMessage();
        default:
          console.log('📝 デフォルトメッセージ処理開始');
          return this.handleDefaultMessage(text);
      }
    } catch (error) {
      console.error('❌ メッセージ処理エラー:', error);
      return this.createErrorMessage();
    }
  }

  // メッセージタイプの判定
  private detectMessageType(text: string): MessageType {
    text = text.trim().toLowerCase();

    if (text.includes('家計簿')) return '家計簿';
    if (text.includes('家事') || text.includes('タスク')) return '家事管理';
    if (text.includes('買い出し') || text.includes('買い物')) return '買い出しリスト';
    if (text.includes('help') || text.includes('ヘルプ')) return 'ヘルプ';

    return '家計簿'; // デフォルトは家計簿
  }

  // 家計簿メッセージ処理
  private async handleVariableCostMessage(userId: string, text: string): Promise<LineMessage> {
    console.log(`💰 家計簿メッセージ処理 - ユーザーID: ${userId}, テキスト: ${text}`);
    
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const costs = await this.d1Repository.getVariableCosts(userId, {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    });

    const totalAmount = costs.reduce((sum, cost) => sum + cost.amount, 0);
    
    const responseMessage = {
      type: 'text',
      text: `今月の家計簿:\n` +
            `総支出: ¥${totalAmount.toLocaleString()}\n` +
            `${costs.map(cost => `${cost.date}: ${cost.category} - ¥${cost.amount.toLocaleString()}`).join('\n')}`
    };

    console.log('📤 家計簿レスポンスメッセージ:', JSON.stringify(responseMessage));
    return responseMessage;
  }

  // 家事管理メッセージ処理
  private async handleHouseworkMessage(userId: string, text: string): Promise<LineMessage> {
    console.log(`🧹 家事管理メッセージ処理 - ユーザーID: ${userId}, テキスト: ${text}`);
    
    const houseworks = await this.d1Repository.getHouseworkList(userId, 'pending');
    
    const responseMessage = houseworks.length === 0 
      ? { type: 'text', text: '現在、保留中の家事タスクはありません。' }
      : {
          type: 'text',
          text: '保留中の家事タスク:\n' +
                `${houseworks.map(task => 
                  `- ${task.task} (期限: ${task.due_date || '未設定'})`
                ).join('\n')}`
        };

    console.log('📤 家事管理レスポンスメッセージ:', JSON.stringify(responseMessage));
    return responseMessage;
  }

  // 買い出しリストメッセージ処理
  private async handlePurchaseListMessage(userId: string, text: string): Promise<LineMessage> {
    console.log(`🛒 買い出しリストメッセージ処理 - ユーザーID: ${userId}, テキスト: ${text}`);
    
    const purchaseItems = await this.d1Repository.getPurchaseList(userId, 'pending');
    
    const responseMessage = purchaseItems.length === 0
      ? { type: 'text', text: '現在、買い出しリストに項目はありません。' }
      : {
          type: 'text',
          text: '買い出しリスト:\n' +
                `${purchaseItems.map(item => 
                  `- ${item.item_name} (${item.quantity}個)`
                ).join('\n')}`
        };

    console.log('📤 買い出しリストレスポンスメッセージ:', JSON.stringify(responseMessage));
    return responseMessage;
  }

  // ヘルプメッセージ
  private handleHelpMessage(): LineMessage {
    return {
      type: 'text',
      text: 'サポートされているコマンド:\n' +
            '- "家計簿": 今月の支出を表示\n' +
            '- "家事管理": 保留中のタスクを表示\n' +
            '- "買い出しリスト": 買い物リストを表示'
    };
  }

  // デフォルトメッセージ処理
  private handleDefaultMessage(text: string): LineMessage {
    return {
      type: 'text',
      text: `「${text}」を理解できませんでした。\n` +
            'ヘルプが必要な場合は "help" と入力してください。'
    };
  }

  // エラーメッセージ
  private createErrorMessage(): LineMessage {
    return {
      type: 'text',
      text: 'システムエラーが発生しました。後でもう一度お試しください。'
    };
  }
} 