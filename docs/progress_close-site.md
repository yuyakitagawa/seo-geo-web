# サイト閉鎖（2026-10-25 起草）

運営者の判断で seo-geo-lab.com を閉鎖する。方式は「全URLに 410 Gone」。リポジトリのコードと記事は残す（再開できるように）。

## リポジトリ側（このブランチ）
- [x] `worker/index.ts`: 全URL（ページ・`/api/*`・robots.txt・sitemap.xml）に 410 と閉鎖のお知らせを返す。`X-Robots-Tag: noindex`。
      robots.txt も 410 にする（4xx の robots.txt はクロール制限なし扱いなので、各URLの 410 が検索エンジンに届く）。
- [x] `wrangler.jsonc`: `assets` ブロックを外した（`out/` を配信しない）。
- [x] `.github/workflows/daily-articles.yml`: 定期実行（cron）を外した。手動実行だけ残る。
- [x] `wrangler dev` で確認: `/` `/articles/1` `/robots.txt` `/sitemap.xml` `/api/audit`（GET/POST）が 410、`x-robots-tag: noindex`。
- [x] 作業中だった Storyblok 対応は `claude/storyblok-disclaimer` にコミットして保存（main には入れない）。
- [ ] main へマージ → Cloudflare の本番デプロイ後、`curl -I https://seo-geo-lab.com/` が 410 になることを確認。

## 外部サービス（運営者が行う。順番どおり）
1. [ ] 本番が 410 になったのを確認したら、Search Console で「削除」→「一時的に削除」（任意。410 だけでも数週間で落ちる）。サイトマップの登録も削除。
2. [ ] AdSense: サイト一覧から seo-geo-lab.com を削除（アカウントを閉じるなら残高の支払い基準額を確認してから）。
3. [ ] Vercel: プロジェクトを削除し Pro を解約（本番は 2026-09-29 から Cloudflare なので影響なし）。
4. [ ] Storyblok / Resend / LINE Bot: 使っていなければスペース・APIキー・チャネルを削除。
5. [ ] Supabase: `seogeo_audit_log` と関数 `seogeo_log_audit` を削除（相乗りしているプロジェクトなので、プロジェクトごとは消さない）。
6. [ ] Anthropic API キー: GitHub Actions Secrets の `ANTHROPIC_API_KEY` を削除し、コンソールでキーを無効化。
7. [ ] GitHub: 必要ならリポジトリをアーカイブ（Settings → Archive）。アーカイブ後は Actions も止まる。
8. [ ] 公式X（@seogeolab）: 閉鎖の告知を固定するか、アカウントを削除。
9. [ ] 410 を数か月返し続けてから、Cloudflare の Worker とゾーンを削除し、お名前.com でドメインの自動更新を止める。
      **ドメインを早く手放すと、第三者に取られて旧URLへの被リンクを悪用される**（期限切れドメインの転売）ので、少なくとも検索結果から消えるまでは保持する。

## 再開するとき
`worker/index.ts` `wrangler.jsonc` `.github/workflows/daily-articles.yml` を閉鎖前のコミットに戻す（このブランチのマージコミットを revert）。
