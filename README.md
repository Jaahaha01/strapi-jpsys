# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## Auto translate localized content

This project registers a Strapi v5 Document Service middleware that runs after localized content is created or updated. It translates localized text fields into the other configured i18n locales and copies technical localized values such as URLs, emails, phone numbers, map URLs, dates, and video IDs without translating them.

Configure AI translation in `.env`:

```
AUTO_TRANSLATE_ENABLED=true
AUTO_TRANSLATE_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
OPENAI_TRANSLATE_MODEL=gpt-4.1-mini
```

Or use Google Translate:

```
AUTO_TRANSLATE_ENABLED=true
AUTO_TRANSLATE_PROVIDER=google
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key
```

Or use LibreTranslate:

```
AUTO_TRANSLATE_ENABLED=true
AUTO_TRANSLATE_PROVIDER=libretranslate
LIBRETRANSLATE_URL=https://your-libretranslate-host
LIBRETRANSLATE_API_KEY=optional-api-key
```

Optionally limit target locales:

```
AUTO_TRANSLATE_TARGET_LOCALES=en,ja,th
```

By default, Strapi waits for translation to finish before the save request completes. This is more reliable on free deploys. To run translation in the background instead:

```
AUTO_TRANSLATE_BACKGROUND=true
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
"# strapi-jpsys" 
