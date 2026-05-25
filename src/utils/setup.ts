import type { Core } from '@strapi/strapi';

export const setupInitialData = async ({ strapi }: { strapi: Core.Strapi }) => {
  try {
    // 1. Setup Locales
    const i18nService = strapi.plugin('i18n').service('locales');
    const existingLocales = await i18nService.find();
    const existingCodes = existingLocales.map((l: any) => l.code);

    const localesToAdd = [
      { code: 'en', name: 'English (en)' },
      { code: 'th', name: 'Thai (th)' },
      { code: 'ja', name: 'Japanese (ja)' },
    ];

    for (const locale of localesToAdd) {
      if (!existingCodes.includes(locale.code)) {
        strapi.log.info(`Adding locale: ${locale.name}`);
        await i18nService.create(locale);
      }
    }

    // 2. Setup Public Permissions for "find" and "findOne"
    const roleService = strapi.plugin('users-permissions').service('role');
    const roles = await roleService.find();
    const publicRole = roles.find((r: any) => r.type === 'public');

    if (publicRole) {
      // Get all api content types
      const apiContentTypes = Object.keys(strapi.contentTypes).filter(key => key.startsWith('api::'));

      const actionsToEnable = ['find', 'findOne'];

      for (const apiType of apiContentTypes) {
        // apiType is something like 'api::company.company'
        // Action names are 'api::company.company.find'
        for (const action of actionsToEnable) {
          const actionName = `${apiType}.${action}`;

          // Check if permission already exists
          const existingPermission = await strapi.query('plugin::users-permissions.permission').findOne({
            where: {
              action: actionName,
              role: publicRole.id,
            },
          });

          if (!existingPermission) {
            strapi.log.info(`Granting public permission for ${actionName}`);
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action: actionName,
                role: publicRole.id,
              },
            });
          }
        }
      }
    }
  } catch (error) {
    strapi.log.error('Error in setupInitialData:', error);
  }
};
