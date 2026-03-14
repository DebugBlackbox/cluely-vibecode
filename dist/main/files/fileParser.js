"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFile = parseFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const types_1 = require("../../shared/types");
const constants_1 = require("../../shared/constants");
const persistentStore_1 = require("../store/persistentStore");
function collapseWhitespace(text) {
    // Collapse 3+ consecutive newlines to 2
    return text.replace(/\n{3,}/g, '\n\n').trim();
}
function truncate(text, maxChars) {
    if (text.length <= maxChars)
        return text;
    return text.slice(0, maxChars);
}
function hashBuffer(buffer) {
    return crypto_1.default.createHash('sha256').update(buffer).digest('hex');
}
async function parseFile(filePath) {
    const ext = path_1.default.extname(filePath).toLowerCase();
    const filename = path_1.default.basename(filePath);
    // Validate extension before reading (avoids ENOENT for unsupported types)
    const supported = ['.pdf', '.docx', '.txt', '.md'];
    if (!supported.includes(ext)) {
        throw new types_1.UnsupportedFileTypeError(ext);
    }
    const buffer = fs_1.default.readFileSync(filePath);
    const hash = hashBuffer(buffer);
    // Check cache first
    const cached = (0, persistentStore_1.getCachedParsedFile)(hash);
    if (cached !== undefined) {
        return { filename, content: cached };
    }
    let rawText;
    switch (ext) {
        case '.pdf': {
            const data = await (0, pdf_parse_1.default)(buffer);
            rawText = data.text;
            break;
        }
        case '.docx': {
            const result = await mammoth_1.default.extractRawText({ buffer });
            rawText = result.value;
            break;
        }
        case '.txt':
        case '.md': {
            rawText = buffer.toString('utf-8');
            break;
        }
        default:
            throw new types_1.UnsupportedFileTypeError(ext);
    }
    const cleaned = collapseWhitespace(rawText);
    const content = truncate(cleaned, constants_1.MAX_FILE_CHARS);
    // Store in cache
    (0, persistentStore_1.setCachedParsedFile)(hash, content);
    return { filename, content };
}
