"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedFileTypeError = void 0;
class UnsupportedFileTypeError extends Error {
    constructor(ext) {
        super(`Unsupported file type: ${ext}`);
        this.name = 'UnsupportedFileTypeError';
    }
}
exports.UnsupportedFileTypeError = UnsupportedFileTypeError;
