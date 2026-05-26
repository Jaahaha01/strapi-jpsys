import sharp from 'sharp';
import type { Core } from '@strapi/strapi';
import { registerAutoTranslateMiddleware } from './utils/auto-translate';
import { setupInitialData } from './utils/setup';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    registerAutoTranslateMiddleware({ strapi });

    // Intercept Strapi CE feature-detection endpoints that return 404 by design.
    // The admin panel always calls these to check if EE features are available.
    // Returning 200 with null silences browser console noise without affecting functionality.
    (strapi as any).server.app.use(async (ctx: any, next: any) => {
      await next();

      if (
        ctx.status === 404 &&
        (ctx.path.startsWith('/content-manager/preview/url/') ||
          ctx.path.startsWith('/i18n/ai-localization-jobs/') ||
          ctx.path.startsWith('/admin/ai-feature-config'))
      ) {
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
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    if (sharp) {
      // Limit sharp memory cache to 128MB to prevent OOM crashes on Strapi Cloud
      sharp.cache({ memory: 128 });
      // Force sharp to process one image at a time to reduce CPU/RAM peaks
      sharp.concurrency(1);
    }
    
    // Set up default settings, locales, and permissions
    await setupInitialData({ strapi });
  },
};
