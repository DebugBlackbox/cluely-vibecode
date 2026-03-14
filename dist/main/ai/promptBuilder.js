"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMessages = buildMessages;
const constants_1 = require("../../shared/constants");
function buildMessages(params) {
    const { systemPrompt, userPrompt, screenshotBase64, fileContexts } = params;
    const resolvedSystemPrompt = systemPrompt.trim() || constants_1.DEFAULT_SYSTEM_PROMPT;
    const parts = [];
    // Part 1: system instruction text
    let instructionText = resolvedSystemPrompt;
    // Part 2: file context section
    if (fileContexts.length > 0) {
        instructionText += '\n\n[CONTEXT FILES]\n';
        for (const fc of fileContexts) {
            const truncated = fc.content.length > constants_1.MAX_FILE_PROMPT_CHARS
                ? fc.content.slice(0, constants_1.MAX_FILE_PROMPT_CHARS)
                : fc.content;
            instructionText += `Filename: ${fc.filename}\n${truncated}\n---\n`;
        }
    }
    // Part 3: user prompt section
    if (userPrompt.trim().length > 0) {
        instructionText += `\n[USER PROMPT]\n${userPrompt.trim()}`;
    }
    parts.push({ text: instructionText });
    // Part 4: screenshot as vision inline data
    parts.push({
        inlineData: {
            mimeType: 'image/png',
            data: screenshotBase64,
        },
    });
    // Warn if total estimated character count exceeds threshold
    const totalChars = instructionText.length + screenshotBase64.length;
    if (totalChars > constants_1.TOTAL_CHAR_WARN_THRESHOLD) {
        console.warn(`promptBuilder: estimated character count (${totalChars}) exceeds warning threshold (${constants_1.TOTAL_CHAR_WARN_THRESHOLD})`);
    }
    const message = {
        role: 'user',
        parts,
    };
    return [message];
}
