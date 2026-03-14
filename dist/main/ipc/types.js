"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedFileTypeError = exports.IPC = void 0;
// Re-export IPC channel constants
var constants_1 = require("../../shared/constants");
Object.defineProperty(exports, "IPC", { enumerable: true, get: function () { return constants_1.IPC; } });
var types_1 = require("../../shared/types");
Object.defineProperty(exports, "UnsupportedFileTypeError", { enumerable: true, get: function () { return types_1.UnsupportedFileTypeError; } });
