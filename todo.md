# ICC Support Staff Dashboard - TODO

## データベース・スキーマ
- [x] PINセッション管理テーブル（pin_sessions）
- [x] スタッフマスターテーブル（staff）
- [x] スタッフ状況テーブル（staff_status）
- [x] タスクテーブル（tasks）
- [x] 会場・エリアマスターテーブル（venues, areas）
- [x] テトリスデータテーブル（tetris_entries）
- [x] pnpm db:push でマイグレーション実行

## 認証機能
- [x] 共通PIN（1234）によるログイン
- [x] 「この端末を信頼する」30日間セッション維持
- [x] PIN失敗時のレート制限（5回失敗で10分ロック）
- [x] 管理者によるPIN変更機能
- [x] PIN変更時の既存セッション失効機能
- [x] ログアウト機能

## バックエンド（tRPC routers）
- [x] pin router: login, logout, check, changePin
- [x] staff router: list, updateStatus
- [x] task router: list, create, update, delete, complete
- [x] venue router: list（会場・エリアマスター）
- [x] tetris router: list（スケジュールデータ）
- [x] admin router: changePin, revokeAllSessions

## フロントエンド
- [x] デザインテーマ設定（index.css）
- [x] PINログイン画面（テンキーUI）
- [x] ボトムナビゲーション（6項目）
- [x] ダッシュボード画面
- [x] スタッフ状況一覧・更新画面
- [x] タスク管理画面（一覧・作成・編集・完了・削除）
- [x] 会場マップ画面（7フロア タブ切替・フルスクリーン）
- [x] テトリス閲覧画面（人別ビュー・時間軸ビュー）
- [x] 管理者画面（PIN変更・セッション失効）

## 会場マップ画像
- [x] 取得済み画像をS3にアップロード（1F/3F/3F詳細/4F/34F/34Fレイアウト/32F）
- [x] CDN URLをコードに反映

## テトリスデータ
- [x] シードデータ作成（3/1〜3/5、5名分）
- [x] DBへの投入

## テスト
- [x] PIN認証のvitestテスト（正常系・異常系）
- [x] スタッフ・タスク・テトリス・会場の認証ガードテスト
- [x] ログアウトテスト（全10テストパス）

## チェックポイント
- [x] 最終チェックポイント保存

## UI改善：スタッフ状況
- [x] カード展開型UI（タップでカードが開いてステータスボタンが出る）
- [x] ステータスをワンタップで変更（モーダル不要）
- [x] 会場・エリア・作業内容はカード展開後に編集可能
- [x] ステータス色をカード背景に反映（視認性向上）
- [ ] 自分のカードを先頭に表示する機能（将来拡張）
