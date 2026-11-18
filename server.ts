import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import express, { type NextFunction, type Request, type Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

interface RateBucket {
  timestamps: number[];
}

const agentRateBuckets = new Map<string, RateBucket>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 24;

function checkAgentRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const bucket = agentRateBuckets.get(ip) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= RATE_MAX_REQUESTS) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + RATE_WINDOW_MS - now) / 1000));
    agentRateBuckets.set(ip, bucket);
    return { allowed: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  agentRateBuckets.set(ip, bucket);

  // Periodically prune stale IPs to bound memory usage
  if (agentRateBuckets.size > 1000) {
    for (const [key, entry] of agentRateBuckets.entries()) {
      if (entry.timestamps.every((t) => t <= cutoff)) {
        agentRateBuckets.delete(key);
      }
    }
  }

  return { allowed: true, retryAfterSec: 0 };
}

function createAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_NOT_CONFIGURED');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getGreetingSalutation(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface AgentAnalyzeBody {
  input?: string;
  userName?: string;
  cleanDays?: number;
  dailySpendNgn?: number;
  hasActiveGoal?: boolean;
  activeGoalTitle?: string;
  goalsCount?: number;
  localHour?: number;
}

interface AgentCoachBody {
  message?: string;
  userName?: string;
  cleanDays?: number;
  estimatedSavedNgn?: number;
  dailySpendNgn?: number;
  hasActiveGoal?: boolean;
  activeGoalTitle?: string;
  goalsCount?: number;
  recentBlockedCount?: number;
  localHour?: number;
}

const AGENT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    riskLevel: {
      type: Type.STRING,
      description: 'One of: safe, caution, high_risk, gambling_login',
    },
    shouldAutoBlock: {
      type: Type.BOOLEAN,
      description:
        'True whenever the input references a gambling domain, mirror, betting promo, casino, sportsbook login, or risky betting search.',
    },
    isLoginAttempt: {
      type: Type.BOOLEAN,
      description:
        'True if the user input looks like an attempt to sign in or log into a gambling site/app.',
    },
    detectedDomain: {
      type: Type.STRING,
      description:
        'Clean lowercase domain hostname if detected (e.g. sportybet-mirror.ng), otherwise empty string.',
    },
    category: {
      type: Type.STRING,
      description: 'One of: Sportsbooks, Casino & Slots, Poker & Bingo, Crypto Betting, Recovery Safe',
    },
    shouldRemindGoal: {
      type: Type.BOOLEAN,
      description: 'True when the user does not have an active recovery goal yet.',
    },
    coachMessage: {
      type: Type.STRING,
      description:
        'Warm, human, grounded message under 55 words. Speak naturally like a trusted friend and supportive coach, never stiff or robotic.',
    },
    suggestedGoalTitle: {
      type: Type.STRING,
      description: 'Short actionable recovery or Naira savings goal title if helpful (max 60 chars).',
    },
    suggestedGoalTargetDays: {
      type: Type.INTEGER,
      description: 'Suggested goal target days between 1 and 90.',
    },
    suggestedGoalAmountNgn: {
      type: Type.INTEGER,
      description: 'Suggested Naira savings target >= 0.',
    },
    suggestedGoalWhy: {
      type: Type.STRING,
      description: 'Short motivational why note under 120 chars.',
    },
  },
  required: [
    'riskLevel',
    'shouldAutoBlock',
    'isLoginAttempt',
    'detectedDomain',
    'category',
    'shouldRemindGoal',
    'coachMessage',
    'suggestedGoalTitle',
    'suggestedGoalTargetDays',
    'suggestedGoalAmountNgn',
    'suggestedGoalWhy',
  ],
};

async function runCoachJson(prompt: string, systemInstruction: string) {
  const ai = createAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: AGENT_RESPONSE_SCHEMA,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
    },
  });

  const text = (response.text ?? '').trim();
  if (!text) {
    throw new Error('EMPTY_AI_RESPONSE');
  }
  return JSON.parse(text) as Record<string, unknown>;
}

function handleAgentError(res: Response, error: unknown): void {
  const rawMessage = error instanceof Error ? error.message : '';
  if (rawMessage === 'AI_NOT_CONFIGURED') {
    res.status(503).json({
      error: 'GambleAware AI is getting ready. Use Check Site above anytime — blocking still works 24/7.',
    });
    return;
  }
  if (rawMessage.includes('429') || rawMessage.toLowerCase().includes('quota')) {
    res.status(429).json({
      error: 'GambleAware AI is busy right now. Take a slow breath and try again in a minute.',
    });
    return;
  }
  res.status(502).json({
    error: 'Could not reach GambleAware AI right now. Your site & app blocker is still active.',
  });
}

function requireTrustedClient(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store');
  const clientHeader = req.get('x-gambleaware-client');
  if (clientHeader !== 'web') {
    res.status(403).json({ error: 'Request not authorized.' });
    return;
  }
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const rate = checkAgentRateLimit(clientIp);
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfterSec));
    res.status(429).json({
      error: `Too many requests. Please wait ${rate.retryAfterSec}s before trying again.`,
    });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader(
      'Content-Security-Policy',
      "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self';",
    );
    next();
  });

  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      aiReady: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.post('/api/agent/analyze', requireTrustedClient, async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as AgentAnalyzeBody;
    const rawInput = typeof body.input === 'string' ? body.input.trim().slice(0, 500) : '';
    if (!rawInput) {
      res.status(400).json({ error: 'Please type a website link or message first.' });
      return;
    }

    const userName = typeof body.userName === 'string' ? body.userName.trim().slice(0, 60) : '';
    const cleanDays = Math.max(0, Number(body.cleanDays) || 0);
    const dailySpendNgn = Math.max(0, Number(body.dailySpendNgn) || 5000);
    const hasActiveGoal = Boolean(body.hasActiveGoal);
    const activeGoalTitle =
      typeof body.activeGoalTitle === 'string' ? body.activeGoalTitle.trim().slice(0, 100) : '';
    const salutation = getGreetingSalutation(
      typeof body.localHour === 'number' ? body.localHour : new Date().getHours(),
    );

    const systemInstruction = [
      'You are GambleAware AI, a warm, empathetic everyday companion that helps people stay free from gambling.',
      'Your tone must feel natural, kind, calm, and conversational — never stiff, robotic, or preachy.',
      'Never mention model names or technical terms like Gemini or WebView.',
      '1) Protect users from online betting, sportsbooks (SportyBet, Bet9ja, BetKing, 1xBet, MSport, Bet365, Stake, etc.), mirror domains, odds/slip portals, and gambling login pages. Mark any gambling site/mirror/promo/login as shouldAutoBlock=true and riskLevel="gambling_login" or "high_risk". Never block mental-health or gambling recovery support sites.',
      '2) If hasActiveGoal is false, always set shouldRemindGoal=true and propose a concrete Nigerian Naira (₦) or clean-day recovery goal sized to their dailySpendNgn.',
    ].join(' ');

    const prompt = [
      `Greeting context: ${salutation}${userName ? `, ${userName}` : ''}`,
      `Clean days: ${cleanDays}, Daily betting spend baseline: ₦${dailySpendNgn}`,
      `Has active recovery goal: ${hasActiveGoal}${activeGoalTitle ? ` (${activeGoalTitle})` : ''}`,
      `Input to inspect: "${rawInput}"`,
      'Analyze whether this link or message involves gambling and should be auto-blocked, and give warm personal encouragement.',
    ].join('\n');

    try {
      const result = await runCoachJson(prompt, systemInstruction);
      res.json(result);
    } catch (error) {
      handleAgentError(res, error);
    }
  });

  app.post('/api/agent/coach', requireTrustedClient, async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as AgentCoachBody;
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 800) : '';
    if (!message) {
      res.status(400).json({ error: 'Please write a short message or paste a link first.' });
      return;
    }

    const userName = typeof body.userName === 'string' ? body.userName.trim().slice(0, 60) : '';
    const cleanDays = Math.max(0, Number(body.cleanDays) || 0);
    const estimatedSavedNgn = Math.max(0, Number(body.estimatedSavedNgn) || 0);
    const dailySpendNgn = Math.max(0, Number(body.dailySpendNgn) || 5000);
    const hasActiveGoal = Boolean(body.hasActiveGoal);
    const activeGoalTitle =
      typeof body.activeGoalTitle === 'string' ? body.activeGoalTitle.trim().slice(0, 100) : '';
    const goalsCount = Math.max(0, Number(body.goalsCount) || 0);
    const recentBlockedCount = Math.max(0, Number(body.recentBlockedCount) || 0);
    const salutation = getGreetingSalutation(
      typeof body.localHour === 'number' ? body.localHour : new Date().getHours(),
    );

    const systemInstruction = [
      'You are GambleAware AI, a supportive friend and gambling recovery companion.',
      'Speak warmly, simply, and naturally — like someone genuinely in their corner (avoid stiff or robotic phrasing, and never mention model names or AI system jargon).',
      'Help the user pause during urges, suggest practical Naira savings or clean-day goals (especially when goalsCount == 0), and immediately flag any gambling website, mirror link, or betting login attempt so the app protects and redirects them.',
      'Return valid JSON matching the schema with a clear coachMessage under 55 words.',
    ].join(' ');

    const prompt = [
      `User: ${salutation}${userName ? `, ${userName}` : ''}`,
      `Progress: ${cleanDays} clean days, ₦${estimatedSavedNgn} saved (baseline ₦${dailySpendNgn}/day), ${recentBlockedCount} blocked attempts.`,
      `Goals count: ${goalsCount}, Active primary goal: ${hasActiveGoal ? activeGoalTitle : 'NONE (gently remind them to set one and suggest a realistic target!)'}`,
      `User message: "${message}"`,
    ].join('\n');

    try {
      const result = await runCoachJson(prompt, systemInstruction);
      res.json(result);
    } catch (error) {
      handleAgentError(res, error);
    }
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GambleAware server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start GambleAware server:', err);
  process.exit(1);
});
