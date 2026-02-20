async function dispatch(env) {
  const res = await fetch(
    "https://api.github.com/repos/golem-experiment/golem/actions/workflows/golem.yml/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "golem-cron",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, error: text };
  }
  return { ok: true, status: res.status };
}

export default {
  async scheduled(event, env) {
    const result = await dispatch(env);
    if (!result.ok) {
      console.error(`dispatch failed: ${result.status} ${result.error}`);
    }
  },

  async fetch(request, env) {
    const result = await dispatch(env);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
