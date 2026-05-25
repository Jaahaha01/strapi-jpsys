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
