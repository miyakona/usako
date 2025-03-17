// LINE メッセージの型定義
export interface LineMessage {
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker';
  text?: string;
  originalContentUrl?: string;
  previewImageUrl?: string;
}

// LINEイベントの型定義
export interface LineEventBase {
  type: string;
  replyToken?: string;
  source: {
    type: 'user' | 'group' | 'room';
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  timestamp: number;
}

export interface LineMessageEvent extends LineEventBase {
  type: 'message';
  message: LineMessage;
}

export interface LinePostbackEvent extends LineEventBase {
  type: 'postback';
  postback: {
    data: string;
    params?: {
      date?: string;
      time?: string;
      datetime?: string;
    };
  };
}

export interface LineFollowEvent extends LineEventBase {
  type: 'follow';
}

export interface LineUnfollowEvent extends LineEventBase {
  type: 'unfollow';
}

export interface LineJoinEvent extends LineEventBase {
  type: 'join';
}

export interface LineLeaveEvent extends LineEventBase {
  type: 'leave';
}

// すべてのイベント型を統合
export type LineEvent = 
  | LineMessageEvent 
  | LinePostbackEvent 
  | LineFollowEvent 
  | LineUnfollowEvent 
  | LineJoinEvent 
  | LineLeaveEvent;

// LINEメッセージアクションの型定義
export interface LineMessageAction {
  type: 'message' | 'postback' | 'uri';
  label: string;
  text?: string;
  data?: string;
  uri?: string;
} 