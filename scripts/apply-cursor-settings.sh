#!/bin/bash

# プロジェクトのルートディレクトリを取得
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ユーザーのVSCode設定ディレクトリを取得
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    VSCODE_SETTINGS_DIR="$HOME/Library/Application Support/Code/User"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    VSCODE_SETTINGS_DIR="$APPDATA/Code/User"
else
    # Linux
    VSCODE_SETTINGS_DIR="$HOME/.config/Code/User"
fi

# VSCode設定ディレクトリが存在しない場合は作成
mkdir -p "$VSCODE_SETTINGS_DIR"

# プロジェクトの設定ファイル
PROJECT_SETTINGS="$PROJECT_ROOT/.cursor-settings.json"

# ユーザーの設定ファイル
USER_SETTINGS="$VSCODE_SETTINGS_DIR/settings.json"

# 設定ファイルが存在しない場合は作成
if [ ! -f "$USER_SETTINGS" ]; then
    echo "Creating new settings.json..."
    echo "{}" > "$USER_SETTINGS"
fi

# プロジェクトの設定を読み込む
PROJECT_SETTINGS_CONTENT=$(cat "$PROJECT_SETTINGS")

# ユーザーの設定を読み込む
USER_SETTINGS_CONTENT=$(cat "$USER_SETTINGS")

# 既存の設定を更新または追加
if [ -z "$USER_SETTINGS_CONTENT" ]; then
    echo "$PROJECT_SETTINGS_CONTENT" > "$USER_SETTINGS"
else
    # jqを使用して設定をマージ
    if command -v jq &> /dev/null; then
        echo "$USER_SETTINGS_CONTENT" | jq -s '.[0] * .[1]' - "$PROJECT_SETTINGS" > "$USER_SETTINGS"
    else
        echo "Warning: jq is not installed. Please install jq for better settings merging."
        echo "$PROJECT_SETTINGS_CONTENT" > "$USER_SETTINGS"
    fi
fi

echo "Cursor settings have been applied to your VSCode settings."
