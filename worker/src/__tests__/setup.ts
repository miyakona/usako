// モックの環境変数を設定
process.env.SPREADSHEET_ID = 'test-spreadsheet-id';
process.env.LINE_CHANNEL_SECRET = 'test-channel-secret';
process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-channel-access-token';
process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({
  type: 'service_account',
  project_id: 'test-project',
  private_key: 'test-private-key',
  client_email: 'test@example.com'
}); 