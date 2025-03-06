export const mockTextMessage = {
  destination: 'xxxxxxxxxx',
  events: [
    {
      type: 'message',
      message: {
        type: 'text',
        id: '468789577898262530',
        text: '家事管理'
      },
      webhookEventId: '01H810YECXQQZ37VAXPF6H9E6T',
      deliveryContext: {
        isRedelivery: false
      },
      timestamp: 1692251666727,
      source: {
        type: 'user',
        userId: 'U4af4980629...'
      },
      replyToken: '38ef843bde154d9b91c21320ffd17a0f',
      mode: 'active'
    }
  ]
};

export const mockPostbackData = {
  destination: 'xxxxxxxxxx',
  events: [
    {
      type: 'postback',
      postback: {
        data: '{"type":"housework", "action":"report"}'
      },
      webhookEventId: '01H810YECXQQZ37VAXPF6H9E6T',
      deliveryContext: {
        isRedelivery: false
      },
      timestamp: 1692251666727,
      source: {
        type: 'user',
        userId: 'U4af4980629...'
      },
      replyToken: '38ef843bde154d9b91c21320ffd17a0f',
      mode: 'active'
    }
  ]
};

export const mockPurchaseListMessage = {
  destination: 'xxxxxxxxxx',
  events: [
    {
      type: 'message',
      message: {
        type: 'text',
        id: '468789577898262530',
        text: '買い出し\nリスト'
      },
      webhookEventId: '01H810YECXQQZ37VAXPF6H9E6T',
      deliveryContext: {
        isRedelivery: false
      },
      timestamp: 1692251666727,
      source: {
        type: 'user',
        userId: 'U4af4980629...'
      },
      replyToken: '38ef843bde154d9b91c21320ffd17a0f',
      mode: 'active'
    }
  ]
}; 