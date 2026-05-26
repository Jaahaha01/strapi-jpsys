import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
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

export default config;
