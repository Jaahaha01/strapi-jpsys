"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const auto_translate_1 = require("./utils/auto-translate");
const setup_1 = require("./utils/setup");
exports.default = {
    /**
     * An asynchronous register function that runs before
     * your application is initialized.
     *
     * This gives you an opportunity to extend code.
     */
    register({ strapi }) {
        (0, auto_translate_1.registerAutoTranslateMiddleware)({ strapi });
        // Intercept Strapi CE feature-detection endpoints that return 404 by design.
        // The admin panel always calls these to check if EE features are available.
        // Returning 200 with null silences browser console noise without affecting functionality.
        strapi.server.app.use(async (ctx, next) => {
            await next();
            if (ctx.status === 404 &&
                (ctx.path.startsWith('/content-manager/preview/url/') ||
                    ctx.path.startsWith('/i18n/ai-localization-jobs/') ||
                    ctx.path.startsWith('/admin/ai-feature-config'))) {
                ctx.body = { data: null };
                ctx.status = 200;
            }
        });
    },
    /**
     * An asynchronous bootstrap function that runs before
     * your application gets started.
     *
     * This gives you an opportunity to set up your data model,
     * run jobs, or perform some special logic.
     */
    async bootstrap({ strapi }) {
        if (sharp_1.default) {
            // Limit sharp memory cache to 128MB to prevent OOM crashes on Strapi Cloud
            sharp_1.default.cache({ memory: 128 });
            // Force sharp to process one image at a time to reduce CPU/RAM peaks
            sharp_1.default.concurrency(1);
        }
        // Set up default settings, locales, and permissions
        await (0, setup_1.setupInitialData)({ strapi });
    },
};
