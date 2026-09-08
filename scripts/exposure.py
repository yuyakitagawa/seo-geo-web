#!/usr/bin/env python3
"""infini-gram で語の出現回数を数える（報告のみ。ファイルは一切変更しない）。

公開されている事前学習コーパス（RedPajama など）に、その文字列が何回出てくるかを数える。
「AIがそのブランド名をどれだけ読んでいるか」の代理指標として使う。

使い方:
  python3 scripts/exposure.py 日本 東京 Ahrefs ミエルカ
  python3 scripts/exposure.py --file terms.txt
  python3 scripts/exposure.py --index v4_piletrain_llama Ahrefs Semrush

注意:
  - RedPajama は GPT / Gemini の学習データそのものではない。あくまで公開コーパスの代理。
  - 日本語はトークナイザが文字単位に割るため、部分一致を含む（「日本」は「日本語」も数える）。
    小さい数字はむしろ過大に出るので、桁の比較にだけ使う。
  - 対照群（「日本」「東京」など確実に多い語）を必ず一緒に測る。
    対照群まで小さければ、コーパスにその言語が無いだけで、ブランドの評価にならない。
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import unicodedata
import urllib.error
import urllib.request

API = "https://api.infini-gram.io/"
DEFAULT_INDEX = "v4_rpj_llama_s4"
RETRIES = 3
SLEEP = 1.0


def display_width(s: str) -> int:
    """全角を2桁として数える（表の桁を揃えるため）。"""
    return sum(2 if unicodedata.east_asian_width(c) in "WF" else 1 for c in s)


def pad(s: str, width: int) -> str:
    return s + " " * max(0, width - display_width(s))


def count(term: str, index: str) -> int | None:
    """出現回数を返す。取得できなければ None（0 と区別する）。"""
    body = json.dumps({"index": index, "query_type": "count", "query": term}).encode()
    for attempt in range(1, RETRIES + 1):
        req = urllib.request.Request(
            API, data=body, headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as res:
                data = json.loads(res.read())
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            print(f"  ! {term}: {e}（{attempt}/{RETRIES}）", file=sys.stderr)
            time.sleep(attempt * 5)
            continue
        if "error" in data:
            print(f"  ! {term}: {data['error']}", file=sys.stderr)
            return None
        if isinstance(data.get("count"), int):
            return data["count"]
        print(f"  ! {term}: 想定外の応答 {data}", file=sys.stderr)
        time.sleep(attempt * 5)
    return None


def main() -> int:
    p = argparse.ArgumentParser(description="infini-gram で語の出現回数を数える")
    p.add_argument("terms", nargs="*", help="数える語")
    p.add_argument("--file", help="1行1語のテキストファイル（# 以降は無視）")
    p.add_argument("--index", default=DEFAULT_INDEX, help=f"コーパス（既定: {DEFAULT_INDEX}）")
    args = p.parse_args()

    terms = list(args.terms)
    if args.file:
        with open(args.file, encoding="utf-8") as f:
            for line in f:
                line = line.split("#", 1)[0].strip()
                if line:
                    terms.append(line)
    if not terms:
        p.error("語を1つ以上指定するか --file を渡す")

    print(f"index: {args.index}\n", file=sys.stderr)

    results: list[tuple[str, int | None]] = []
    for i, term in enumerate(terms):
        results.append((term, count(term, args.index)))
        if i < len(terms) - 1:
            time.sleep(SLEEP)

    ok = [n for _, n in results if n is not None]
    top = max(ok) if ok else 0
    w = max(display_width(t) for t, _ in results)

    print(f"{pad('語', w)}  {'件数':>12}  {'最多比':>10}")
    print("-" * (w + 26))
    for term, n in results:
        if n is None:
            print(f"{pad(term, w)}  {'ERR':>12}  {'-':>10}")
        elif n == 0 or top == 0:
            print(f"{pad(term, w)}  {n:>12,}  {'-':>10}")
        else:
            print(f"{pad(term, w)}  {n:>12,}  {n / top:>10.5f}")

    failed = sum(1 for _, n in results if n is None)
    if failed:
        print(f"\n{failed}語が取得できなかった（ERR）。0件と混同しないこと。", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
