export default {
  config: {
    locales: ['th', 'ja'],
  },
  bootstrap(app: any) {
    // Override console.warn and console.error to filter out noisy Strapi v5 development warnings
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args) => {
      const msg = typeof args[0] === 'string' ? args[0] : '';
      
      // Filter out Vite externalized module warnings
      if (msg.includes('Module "path" has been externalized') ||
          msg.includes('Module "fs" has been externalized') ||
          msg.includes('Module "url" has been externalized') ||
          msg.includes('Module "source-map-js" has been externalized')) {
        return;
      }
      
      // Filter out React Router v7 future flag warning
      if (msg.includes('React Router Future Flag Warning')) {
        return;
      }

      // Filter out useRBAC deprecation warning
      if (msg.includes('useRBAC: The first argument should be an array of permissions')) {
        return;
      }

      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      const msg = typeof args[0] === 'string' ? args[0] : '';
      
      // Filter out styled-components unknown prop warning
      if (msg.includes('styled-components: it looks like an unknown prop')) {
        return;
      }

      // Filter out incorrect <label for=...> warnings
      if (msg.includes('Incorrect use of <label for=FORM_ELEMENT>')) {
        return;
      }

      originalError.apply(console, args);
    };
  },
};
