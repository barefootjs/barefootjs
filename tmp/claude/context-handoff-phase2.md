# Context Handoff: Per-Item Signals (#730)

## ブランチ

`fix/kanban-add-task-button` — main から分岐。per-item signals + accessor 変換の WIP。

## 完了したこと

### Runtime (packages/dom/src/map-array.ts)
- `ItemScope<T>` に `setItem` 追加
- `createItemScope` で per-item signal 作成、renderItem に accessor を渡す
- 同キー diff: `setItem(newValue)` で DOM 保持（dispose + re-render しない）
- unit test: 185 pass

### Compiler: accessor 変換 (packages/jsx/src/ir-to-client-js/emit-control-flow.ts)
- `wrapLoopParamAsAccessor(expr, paramName)` ユーティリティ (utils.ts)
- 全 emit 関数で renderItem 内の `item.text` → `item().text` に変換
- 適用箇所: テンプレート、component props、reactive effects、mapPreamble
- **適用しない箇所**: keyFn (plain value)、event delegation (array lookup)

### IR: slotId for loop expressions (packages/jsx/src/jsx-to-ir.ts)
- `TransformContext.loopParams: Set<string>` 追加
- `transformMapCall` でループパラメータを登録/解除
- `transformExpression` で loop param 参照の expression にも slotId 付与
- adapter-tests fixtures 更新済み

### Reactive collection 拡張 (packages/jsx/src/ir-to-client-js/reactivity.ts)
- `collectLoopChildReactiveTexts`: loop param 参照も収集対象
- `collectLoopChildReactiveAttrs`: 同上
- `collectLoopChildConditionals`: 同上

## 残っている問題: 48 E2E fail

### 根本原因
**ConditionalBranchLoop** (条件分岐内のループ、Cart/Checkout/Mail 等) の `pseudoElem` に `childReactiveTexts`/`childReactiveAttrs`/`childConditionals` が設定されていない。

### 影響するファイル

1. **`packages/jsx/src/ir-to-client-js/types.ts`** — `ConditionalBranchLoop` 型にフィールド追加:
   ```ts
   interface ConditionalBranchLoop {
     // 既存フィールド...
     childReactiveTexts?: LoopChildReactiveText[]
     childReactiveAttrs?: LoopChildReactiveAttr[]
     childConditionals?: LoopChildConditional[]
   }
   ```

2. **`packages/jsx/src/ir-to-client-js/collect-elements.ts`** — branch loop 収集パス (line ~520-540) で `collectLoopChildReactiveTexts`/`Attrs`/`Conditionals` を呼ぶ

3. **`packages/jsx/src/ir-to-client-js/emit-control-flow.ts`** — `emitCompositeBranchLoop` (line ~172) の `pseudoElem` にフィールドを設定

### 修正手順

1. `ConditionalBranchLoop` 型にフィールド追加
2. `collect-elements.ts` の branch loop 収集で reactive texts/attrs/conditionals を収集
3. `emitCompositeBranchLoop` の pseudoElem に設定
4. clean build + E2E テスト

### 修正後に確認すべきこと

- `bun test --filter "packages/"` — 1247+ pass
- `npx playwright test` — 1010 pass
- Comments block の controlled textarea (editText signal) でフォーカス維持

### controlled textarea の検証

全 E2E pass 後:
1. `site/ui/components/comments-demo.tsx` に `editText` signal を追加
2. Textarea を `value={editText()} onInput={...}` の controlled パターンに変更
3. Playwright MCP でフォーカス維持を確認
4. チカチカしないことを確認

## テスト結果

- Package tests: 1247 pass, 0 fail
- E2E: 962 pass, 48 fail (ConditionalBranchLoop の reactive fields 未設定)

## ファイル変更一覧

| ファイル | 状態 |
|---|---|
| packages/dom/src/map-array.ts | ✅ 完了 |
| packages/dom/src/reactive.ts | ✅ 完了 (createRoot Listener isolation) |
| packages/dom/__tests__/map-array.test.ts | ✅ 完了 |
| packages/jsx/src/jsx-to-ir.ts | ✅ 完了 (loopParams + slotId) |
| packages/jsx/src/ir-to-client-js/utils.ts | ✅ 完了 (wrapLoopParamAsAccessor) |
| packages/jsx/src/ir-to-client-js/emit-control-flow.ts | ✅ 完了 (accessor 変換) |
| packages/jsx/src/ir-to-client-js/reactivity.ts | ✅ 完了 (collection 拡張) |
| packages/jsx/src/ir-to-client-js/collect-elements.ts | ✅ 完了 (loopParam 引数追加) |
| packages/jsx/src/ir-to-client-js/types.ts | ⬜ 要変更 (ConditionalBranchLoop) |
| packages/adapter-tests/fixtures/*.ts | ✅ 更新済み |
| site/ui/e2e/kanban.spec.ts | ✅ skip 解除済み |
| site/ui/components/comments-demo.tsx | ⬜ 検証後に controlled に変更 |
