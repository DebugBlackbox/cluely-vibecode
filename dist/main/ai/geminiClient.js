"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamResponse = streamResponse;
const generative_ai_1 = require("@google/generative-ai");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const persistentStore_1 = require("../store/persistentStore");
const constants_1 = require("../../shared/constants");
// Track the current abort controller so we can cancel in-flight requests
let currentAbortController = null;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function streamWithRetry(genAI, messages, onToken, onDone, onError, signal, isRetry) {
    const model = genAI.getGenerativeModel({ model: constants_1.GEMINI_MODEL });
    // Build chat history (all but last message) and the current user message
    const history = messages.slice(0, -1).map((m) => ({
        role: m.role,
        parts: m.parts,
    }));
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
        onError(new Error('streamResponse: messages array is empty'));
        return;
    }
    try {
        const chat = model.startChat({ history });
        const result = await chat.sendMessageStream(lastMessage.parts);
        for await (const chunk of result.stream) {
            if (signal.aborted) {
                // Request was cancelled — exit silently
                return;
            }
            const text = chunk.text();
            if (text) {
                onToken(text);
            }
        }
        if (!signal.aborted) {
            onDone();
        }
    }
    catch (err) {
        if (signal.aborted) {
            // Cancelled intentionally — don't surface as error
            return;
        }
        const error = err instanceof Error ? err : new Error(String(err));
        // Detect HTTP 429 rate limit
        const is429 = error.message.includes('429') ||
            error.message.toLowerCase().includes('resource_exhausted') ||
            error.message.toLowerCase().includes('rate limit');
        if (is429 && !isRetry) {
            console.warn('geminiClient: rate limit hit (429), retrying in', constants_1.RATE_LIMIT_RETRY_DELAY_MS, 'ms');
            await sleep(constants_1.RATE_LIMIT_RETRY_DELAY_MS);
            if (signal.aborted)
                return;
            return streamWithRetry(genAI, messages, onToken, onDone, onError, signal, true);
        }
        onError(error);
    }
}
async function streamTestMode(onToken, onDone, signal) {
    const fixturePath = path_1.default.join(__dirname, '..', '..', '..', 'fixtures', 'mock-gemini-response.txt');
    let text;
    try {
        text = fs_1.default.readFileSync(fixturePath, 'utf-8');
    }
    catch {
        text = 'Mock response: fixture file not found.';
    }
    // Stream token by token with delay
    for (const char of text) {
        if (signal.aborted)
            return;
        onToken(char);
        await sleep(constants_1.TEST_TOKEN_DELAY_MS);
    }
    if (!signal.aborted) {
        onDone();
    }
}
async function streamResponse(messages, onToken, onDone, onError) {
    // Cancel any in-flight request
    if (currentAbortController) {
        currentAbortController.abort();
    }
    const controller = new AbortController();
    currentAbortController = controller;
    const { signal } = controller;
    const isTestMode = process.env.ELECTRON_IS_TEST === '1';
    if (isTestMode) {
        await streamTestMode(onToken, onDone, signal);
        return;
    }
    const apiKey = (0, persistentStore_1.getApiKey)();
    if (!apiKey) {
        onError(new Error('Gemini API key is not set'));
        return;
    }
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    await streamWithRetry(genAI, messages, onToken, onDone, onError, signal, false);
}
