# お問い合わせフォーム（LINE / メール通知）

サイト内のフォームから送信 → サーバー（/api/contact）が LINE Push とメール（Resend）へ転送する。
本文はサイト側のDBには一切保存しない（転送のみ）。

- [x] 1. `src/lib/rateLimit.ts` を切り出す（`rateLimited` / `clientIp` を fetchPage.ts から移動、既存2ルートの参照を更新）
- [x] 2. `src/lib/contact.ts`（純関数：入力の検証・通知文の組み立て・定数）
- [x] 3. `src/lib/contact-notify.ts`（送信先：LINE Messaging API / Resend。envが無い経路は黙って飛ばす）
- [x] 4. `src/app/api/contact/route.ts`（POST。回数制限・ハニーポット・長さ上限）
- [x] 5. `src/components/ContactForm.tsx`（クライアント。送信中／完了／失敗の3状態）
- [x] 6. `/contact` にフォームを設置（envが未設定なら従来の窓口リストだけ）
- [x] 7. `/privacy` の記載を実装に合わせる（2章「フォームは設置していません」を修正、保存しないことを明記）
- [x] 8. `.env.example` / `README.md` / `CLAUDE.md` を更新
- [x] 9. `npm run typecheck && npm run build`
