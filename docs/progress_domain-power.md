# ドメインパワー診断（/tools/domain-power）

自作ツール3本目。入力されたドメインについて **被リンク元ドメイン数** と **ドメインの登録情報（年齢・有効期限・状態）** を出す。

## 判定に使うデータ源
| 項目 | 取得元 | キー | 備考 |
| --- | --- | --- | --- |
| 被リンク元ドメイン数 / Open PageRank / 世界順位 | Open PageRank API（Common Crawl のリンクグラフ由来） | `OPEN_PAGERANK_API_KEY` が要る | 未設定なら「未計測」で表示し、登録情報だけ返す |
| 登録日・有効期限・レジストラ・EPPステータス・DNSSEC・ネームサーバー | RDAP（IANA のブートストラップ `https://data.iana.org/rdap/dns.json` → 権威RDAPサーバー） | 不要 | RFC 9083 / RFC 9224 |
| .jp / .co.jp などの登録年月日・状態 | JPRS WHOIS（`whois.jprs.jp:43`） | 不要 | **.jp は IANA の RDAP ブートストラップに載っていない**ため、RDAPでは取れない |

## 手順
- [x] 1. 入力の正規化（`src/lib/domain.ts`。URL・ホスト名から登録ドメインを取り出す）
- [x] 2. RDAP クライアント（`src/lib/rdap.ts`）
- [x] 3. JPRS WHOIS クライアント（`src/lib/whoisJp.ts`。ホストは固定、.jp のみ）
- [x] 4. Open PageRank クライアント（`src/lib/openPageRank.ts`。キーが無ければ null）
- [x] 5. 判定の純関数（`src/lib/domainPower.ts`）
- [x] 6. API（`src/app/api/domain-power/route.ts`）
- [x] 7. 画面（`src/components/DomainPower.tsx` / `src/app/tools/domain-power/page.tsx`）
- [x] 8. 一覧・導線・README・.env.example の更新
- [x] 9. `npm test` / `npm run typecheck` / `npm run build`

## 未確認事項（本番で最初に確かめる）
Claude の作業環境は外部への通信が遮断されていたため、下記は**実通信で検証していない**。

- Open PageRank API の実レスポンス（`POST https://openpagerank.keywordseverywhere.com/v1/domains/bulk` / Bearer / `results[].referring_domains`）。
  キーを発行して `OPEN_PAGERANK_API_KEY` を入れた直後に、`/tools/domain-power` で1回叩いて形を確認する。
  形が違ったら直すのは `src/lib/openPageRank.ts` の `parse()` だけで済むようにしてある。
- JPRS WHOIS の応答（Vercel の Node ランタイムから 43/tcp が出られるか、ラベルが `[登録年月日]` のままか）。
  出られない・形が違う場合は「取得できませんでした」と出るだけで、ページは壊れない。

## 決めたこと
- **合成スコア（0〜100の「ドメインパワー」）は作らない。** 素の数値（被リンク元ドメイン数・Open PageRank・登録からの年数）をそのまま出す。
  重み付けの根拠が出せない数字を1つにまとめると、サイトの他のページ（一次情報主義）と矛盾する。
- Public Suffix List は丸ごと持たず、`src/lib/domain.ts` に日本語圏＋主要国の複数ラベル接尾辞だけを手で並べる。
  漏れたTLDは「最後の1ラベル」で扱うので、判定が壊れるのではなく粗くなる。
