// inference — OpenRouter API calls with native tool calling
// daimon: you can change MODEL params but don't remove tool support

const { OPENROUTER_KEY, MODEL, MAX_TOKENS } = require("./config");

// fallback models if primary is down
const FALLBACK_MODELS = [
  MODEL,
  "moonshotai/kimi-k2.5",
  "minimax/minimax-m2.5",
];

async function inference(messages, { webSearch = false, tools = null } = {}) {
  const body = {
    // fallback routing: tries primary model first, then alternatives
    models: FALLBACK_MODELS,
    route: "fallback",
    max_tokens: MAX_TOKENS,
    messages,
    temperature: 0.7,
  };

  // attach tools if provided
  if (tools) {
    body.tools = tools;
    body.tool_choice = "auto";
    body.parallel_tool_calls = true;
  }

  // plugins
  const plugins = [];
  if (webSearch) {
    plugins.push({ id: "web", max_results: 5 });
  }
  if (plugins.length > 0) body.plugins = plugins;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/daimon111/daimon",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${errBody}`);
  }
  const data = await res.json();
  const choice = data.choices[0];
  return {
    message: choice.message,
    finishReason: choice.finish_reason,
    model: data.model, // which model actually responded (useful for proof)
  };
}

module.exports = { inference };
