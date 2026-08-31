# 進捗: プロンプト適合度チェッカー（/tools/prompt-fit）

狙っているプロンプト（AI検索でユーザーが打つ質問）に対して、ページの内容が合っているかを判定し、
足りない語・答えていない見出し・入れるべき直答文を出すツール。

## 方針
- 判定はローカル計算だけで行う。埋め込みAPIもClaude APIも使わない（無料・登録不要・従量課金なしを維持）。
- 日本語は形態素解析なしで扱う。ベクトルは文字bigramのTF-IDF、比較は見出しブロック単位のコサイン類似度。
- 判定本体は `src/lib/promptFit.ts` の純関数。取得（fetch）はAPI側に置く。
- 点数だけを返さない。「どの見出しが答えているか」「どの語が抜けているか」「何を書き足すか」を返す。

## ステップ
- [x] 既存の /tools/page-audit の作り（API・純関数・UI）を確認
- [x] SSRF対策つきの取得処理を `src/lib/fetchPage.ts` に切り出し、/api/audit を差し替え
- [x] `src/lib/promptFit.ts`（ブロック分割・重要語抽出・意図判定・TF-IDF・修正案生成）
- [x] `src/app/api/prompt-fit/route.ts`（URL取得 / テキスト貼り付けの2モード・回数制限）
- [x] `src/components/PromptFit.tsx`（フォームと結果表示）
- [x] `src/app/tools/prompt-fit/page.tsx`（説明・FAQ・JSON-LD）
- [x] `src/lib/apps.ts` に追加（/tools のカードと sitemap が拾う）
- [x] README.md / CLAUDE.md の更新
- [x] typecheck と build
