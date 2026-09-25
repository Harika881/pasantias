// FILE: packages/providers/src/utils/jsonRepair.test.ts
import { describe, it, expect, vi } from "vitest";
import { completeJsonWithRepair, extractJsonCandidate } from "./jsonRepair";

describe("extractJsonCandidate", () => {
  it("strips markdown fences", () => {
    const raw = "```json\n{\"a\":1}\n```";
    expect(extractJsonCandidate(raw)).toBe('{"a":1}');
  });
});

describe("completeJsonWithRepair", () => {
  it("self-corrects malformed JSON on retry", async () => {
    let call = 0;
    const complete = vi.fn(async () => {
      call++;
      return call === 1 ? "{ bad json," : '{"ok": true}';
    });
    const result = await completeJsonWithRepair(complete, "system", "user");
    expect(result).toEqual({ ok: true });
    expect(complete).toHaveBeenCalledTimes(2);
  });
});