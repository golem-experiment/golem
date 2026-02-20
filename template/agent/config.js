// golem config — constants and environment
// golem: you can change MODEL and MAX_TOKENS but don't remove SAFETY_MODEL

const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const OWNER = "golem111";
const REPO = "golem";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const MOONSHOT_KEY = process.env.MOONSHOT_API_KEY;
const CEREBRAS_KEY = process.env.CEREBRAS_API_KEY;
const GH_TOKEN = process.env.GH_TOKEN;
const MODEL = "z-ai/glm-5";
const MAX_TOKENS = 16384;
const MAX_STEPS = 40; // max inference calls per cycle (prevents runaway)
const PROJECT_NUMBER = 7;
const SAFETY_MODEL = "openai/gpt-oss-safeguard-20b";

// wallet — golem's onchain identity
const GOLEM_WALLET_KEY = process.env.GOLEM_WALLET_KEY;
const SAFE_ADDRESS = "0x570718D609F6eFd4FBb66bE12Ea65511b8D7e046";
const SOLANA_RPC = process.env.SOLANA_RPC || "https://mainnet.api.mainnet-beta.solana.com";

module.exports = {
  REPO_ROOT, OWNER, REPO, OPENROUTER_KEY, GROQ_KEY, MOONSHOT_KEY, CEREBRAS_KEY, GH_TOKEN,
  MODEL, MAX_TOKENS, MAX_STEPS, PROJECT_NUMBER, SAFETY_MODEL,
  GOLEM_WALLET_KEY, SAFE_ADDRESS, SOLANA_RPC,
};
