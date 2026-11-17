import { describe, expect, it } from "vitest";
import { chatText, extraBodyFromEnv } from "@/lib/ai/provider";

const config = { url: "https://ai.example/v1/chat", key: "secret-key", model: "m" };
const reply = (status: number, body: unknown) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("chatText", () => {
  it("returns the answer without a reasoning block", async () => {
    const text = await chatText(
      { system: "s", user: "u" },
      {
        config,
        fetchImpl: reply(200, {
          choices: [{ message: { content: "<think>hmm</think>Hello" } }],
        }),
      }
    );
    expect(text).toBe("Hello");
  });

  it("reports the status and message of a refusal, never the key", async () => {
    const errors: string[] = [];
    const text = await chatText(
      { system: "s", user: "u" },
      {
        config,
        fetchImpl: reply(404, { detail: "Function not found for model m" }),
        onError: (message) => errors.push(message),
      }
    );
    expect(text).toBeNull();
    expect(errors[0]).toMatch(/^404 /);
    expect(errors[0]).toContain("not found");
    expect(errors[0]).not.toContain("secret-key");
  });

  it("reports an empty answer", async () => {
    const errors: string[] = [];
    await chatText(
      { system: "s", user: "u" },
      {
        config,
        fetchImpl: reply(200, { choices: [{ message: { content: "<think>x</think>" } }] }),
        onError: (message) => errors.push(message),
      }
    );
    expect(errors[0]).toContain("empty answer from m");
    expect(errors[0]).toContain("finish=");
  });

  it("is null without a config", async () => {
    expect(await chatText({ system: "s", user: "u" }, { config: null })).toBeNull();
  });
});

describe("extraBodyFromEnv", () => {
  const env = (value: Record<string, string>) => value as unknown as NodeJS.ProcessEnv;
  it("reads a JSON object and never lets it replace the model or messages", () => {
    expect(extraBodyFromEnv(env({}))).toEqual({});
    expect(
      extraBodyFromEnv(
        env({ AI_EXTRA_BODY: '{"chat_template_kwargs":{"enable_thinking":false},"model":"x","messages":[]}' })
      )
    ).toEqual({ chat_template_kwargs: { enable_thinking: false } });
    expect(extraBodyFromEnv(env({ AI_EXTRA_BODY: "not json" }))).toEqual({});
    expect(extraBodyFromEnv(env({ AI_EXTRA_BODY: "[1]" }))).toEqual({});
  });
});
