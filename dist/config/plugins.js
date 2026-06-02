"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = ({ env }) => ({
    upload: {
        config: {
            sizeLimit: 250 * 1024 * 1024, // 250MB in bytes
        },
    },
    'content-manager': {
        config: {
            preview: {
                enabled: false,
            },
        },
    },
});
exports.default = config;
