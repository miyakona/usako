import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

// .envファイルを読み込む
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

function setSecrets() {
  const requiredSecrets = [
    'LINE_CHANNEL_SECRET',
    'LINE_CHANNEL_ACCESS_TOKEN',
    'GOOGLE_SERVICE_ACCOUNT_KEY',
    'GOOGLE_SHEETS_CREDENTIALS',
    'GOOGLE_SHEETS_SPREADSHEET_ID',
    'IMG_PURCHASE'
  ];

  requiredSecrets.forEach(secretKey => {
    const secretValue = process.env[secretKey];
    
    if (!secretValue) {
      console.warn(`Warning: ${secretKey} is not set in .env file`);
      return;
    }

    try {
      console.log(`Setting secret: ${secretKey}`);
      execSync(`npx wrangler secret put ${secretKey}`, { 
        input: Buffer.from(secretValue), 
        stdio: ['pipe', 'inherit', 'inherit'] 
      });
    } catch (error) {
      console.error(`Failed to set secret ${secretKey}:`, error);
    }
  });

  console.log('All secrets have been set successfully.');
}

// スクリプトを実行
setSecrets(); 