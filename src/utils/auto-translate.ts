import type { Core } from '@strapi/strapi';

const INTERNAL_UPDATE_PARAM = '__autoTranslateInternal';

const TRANSLATABLE_TYPES = new Set(['string', 'text', 'richtext']);
const TECHNICAL_FIELD_HINTS = [
  'url',
  'uri',
  'email',
  'phone',
  'tel',
  'videoid',
  'youtube',
  'map',
  'maps',
  'slug',
  'date',
];

type TranslateProvider = 'microsoft' | 'google' | 'libretranslate' | 'mymemory' | 'deepl';

let loggedDisabledReason: string | null = null;

type TranslationRef = {
  holder: Record<string, unknown>;
  key: string;
  text: string;
};

type LocaleRecord = {
  code: string;
};

type Attribute = {
  type?: string;
  component?: string;
  repeatable?: boolean;
  multiple?: boolean;
  pluginOptions?: {
    i18n?: {
      localized?: boolean;
    };
  };
};

type ModelSchema = {
  uid: string;
  attributes?: Record<string, Attribute>;
  pluginOptions?: {
    i18n?: {
      localized?: boolean;
    };
  };
};

// ---------------------------------------------------------------------------
// Provider detection & validation
// ---------------------------------------------------------------------------

const getProvider = (): TranslateProvider | null => {
  const provider = process.env.AUTO_TRANSLATE_PROVIDER?.toLowerCase();

  if (
    provider === 'microsoft' ||
    provider === 'google' ||
    provider === 'libretranslate' ||
    provider === 'mymemory' ||
    provider === 'deepl'
  ) {
    return provider;
  }

  // Auto-detect from available keys/config
  if (process.env.DEEPL_API_KEY) return 'deepl';
  if (process.env.MICROSOFT_TRANSLATOR_API_KEY) return 'microsoft';
  if (process.env.GOOGLE_TRANSLATE_API_KEY) return 'google';
  if (process.env.LIBRETRANSLATE_URL) return 'libretranslate';
  if (process.env.MYMEMORY_EMAIL) return 'mymemory';

  return null;
};

const getDisabledReason = () => {
  const flag = process.env.AUTO_TRANSLATE_ENABLED;

  if (flag && ['false', '0', 'off', 'no'].includes(flag.toLowerCase())) {
    return 'AUTO_TRANSLATE_ENABLED is false';
  }

  const configuredProvider = process.env.AUTO_TRANSLATE_PROVIDER?.toLowerCase();

  if (configuredProvider && !['microsoft', 'google', 'libretranslate', 'mymemory', 'deepl'].includes(configuredProvider)) {
    return 'AUTO_TRANSLATE_PROVIDER must be deepl, microsoft, google, libretranslate, or mymemory';
  }

  const provider = getProvider();

  if (!provider) {
    return 'no translation provider configured (set DEEPL_API_KEY)';
  }

  if (provider === 'deepl' && !process.env.DEEPL_API_KEY) {
    return 'DEEPL_API_KEY is missing';
  }

  if (provider === 'microsoft' && !process.env.MICROSOFT_TRANSLATOR_API_KEY) {
    return 'MICROSOFT_TRANSLATOR_API_KEY is missing';
  }

  if (provider === 'google' && !process.env.GOOGLE_TRANSLATE_API_KEY) {
    return 'GOOGLE_TRANSLATE_API_KEY is missing';
  }

  if (provider === 'libretranslate' && !process.env.LIBRETRANSLATE_URL) {
    return 'LIBRETRANSLATE_URL is missing';
  }

  // MyMemory and DeepL work without hard requirements for auto-detection

  return null;
};

const isEnabled = () => getDisabledReason() === null;

const shouldRunInBackground = () =>
  process.env.AUTO_TRANSLATE_BACKGROUND?.toLowerCase() === 'true';

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

const isLocalizedAttribute = (attribute?: Attribute) =>
  attribute?.pluginOptions?.i18n?.localized === true;

const shouldTranslateString = (fieldName: string, value: string) => {
  const normalizedFieldName = fieldName.toLowerCase();
  const trimmed = value.trim();

  if (!trimmed) return false;

  if (TECHNICAL_FIELD_HINTS.some((hint) => normalizedFieldName.includes(hint))) return false;

  if (
    /^https?:\/\//i.test(trimmed) ||
    /^mailto:/i.test(trimmed) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  ) {
    return false;
  }

  return true;
};

const getTargetLocalesFromEnv = (locales: string[]) => {
  const configured = process.env.AUTO_TRANSLATE_TARGET_LOCALES;

  if (!configured) return locales;

  const allowList = new Set(
    configured
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean)
  );

  return locales.filter((l) => allowList.has(l));
};

const toTranslationLocale = (locale: string) => locale.split('-')[0] || locale;

const getMediaId = (value: unknown): unknown => {
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: unknown }).id;
  }
  return value;
};

const normalizeMediaValue = (value: unknown, attribute: Attribute) => {
  if (value == null) return value;
  if (attribute.multiple && Array.isArray(value)) return value.map(getMediaId);
  return getMediaId(value);
};

const addStringForTranslation = (
  result: Record<string, unknown>,
  key: string,
  value: unknown,
  refs: TranslationRef[]
) => {
  if (typeof value !== 'string') {
    result[key] = value;
    return;
  }

  result[key] = value;

  if (shouldTranslateString(key, value)) {
    refs.push({ holder: result, key, text: value });
  }
};

const buildBlocksPayload = (value: unknown, refs: TranslationRef[]): unknown => {
  if (Array.isArray(value)) return value.map((item) => buildBlocksPayload(item, refs));

  if (!value || typeof value !== 'object') return value;

  const result: Record<string, unknown> = {};

  for (const [key, childValue] of Object.entries(value)) {
    if (key === 'text') {
      addStringForTranslation(result, key, childValue, refs);
      continue;
    }
    result[key] = buildBlocksPayload(childValue, refs);
  }

  return result;
};

const buildPayloadForSchema = (
  strapi: Core.Strapi,
  schema: ModelSchema,
  source: Record<string, unknown>,
  refs: TranslationRef[],
  includeAllFields = false
) => {
  const result: Record<string, unknown> = {};

  for (const [key, attribute] of Object.entries(schema.attributes ?? {})) {
    if (!(key in source)) continue;

    const value = source[key];
    const shouldInclude = includeAllFields || isLocalizedAttribute(attribute);

    if (!shouldInclude) continue;

    if (TRANSLATABLE_TYPES.has(attribute.type ?? '')) {
      addStringForTranslation(result, key, value, refs);
      continue;
    }

    if (attribute.type === 'blocks') {
      result[key] = buildBlocksPayload(value, refs);
      continue;
    }

    if (attribute.type === 'media') {
      result[key] = normalizeMediaValue(value, attribute);
      continue;
    }

    if (attribute.type === 'component' && attribute.component) {
      const componentSchema = (strapi as any).getModel(attribute.component) as ModelSchema;

      if (attribute.repeatable && Array.isArray(value)) {
        result[key] = value.map((item) =>
          item && typeof item === 'object'
            ? buildPayloadForSchema(strapi, componentSchema, item as Record<string, unknown>, refs, true)
            : item
        );
      } else if (value && typeof value === 'object') {
        result[key] = buildPayloadForSchema(
          strapi,
          componentSchema,
          value as Record<string, unknown>,
          refs,
          true
        );
      } else {
        result[key] = value;
      }
      continue;
    }

    if (attribute.type === 'dynamiczone' && Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (!item || typeof item !== 'object') return item;

        const componentUid = (item as { __component?: string }).__component;
        const componentSchema = componentUid
          ? ((strapi as any).getModel(componentUid) as ModelSchema)
          : null;

        if (!componentSchema) return item;

        return {
          __component: componentUid,
          ...buildPayloadForSchema(
            strapi,
            componentSchema,
            item as Record<string, unknown>,
            refs,
            true
          ),
        };
      });
      continue;
    }

    if (['relation', 'password'].includes(attribute.type ?? '')) continue;

    result[key] = value;
  }

  return result;
};

// ---------------------------------------------------------------------------
// Microsoft Translator — translates to MULTIPLE locales in ONE API call
// ---------------------------------------------------------------------------

/**
 * Translate texts to multiple target locales in a single API call.
 * Returns a map of locale code → translated strings array.
 */
const translateWithMicrosoft = async (
  texts: string[],
  sourceLocale: string,
  targetLocales: string[]
): Promise<Record<string, string[]>> => {
  if (texts.length === 0) {
    return Object.fromEntries(targetLocales.map((l) => [l, []]));
  }

  const apiKey = process.env.MICROSOFT_TRANSLATOR_API_KEY;
  const region = process.env.MICROSOFT_TRANSLATOR_REGION;

  if (!apiKey) {
    throw new Error('MICROSOFT_TRANSLATOR_API_KEY is required for Microsoft Translator');
  }

  const from = toTranslationLocale(sourceLocale);
  const toParams = targetLocales.map((l) => `to=${encodeURIComponent(toTranslationLocale(l))}`).join('&');
  const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${from}&${toParams}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': apiKey,
  };

  if (region) {
    headers['Ocp-Apim-Subscription-Region'] = region;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(texts.map((text) => ({ text }))),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Microsoft Translator failed with ${response.status}: ${errorText}`);
  }

  const body = (await response.json()) as Array<{
    translations: Array<{ text: string; to: string }>;
  }>;

  // Build result map: { 'th': ['t1', 't2', ...], 'ja': ['t1', 't2', ...] }
  const result: Record<string, string[]> = Object.fromEntries(targetLocales.map((l) => [l, []]));

  for (const item of body) {
    for (const translation of item.translations) {
      // Find matching locale (e.g. 'th' matches locale code 'th' or 'th-TH')
      const locale = targetLocales.find(
        (l) => toTranslationLocale(l) === translation.to
      );
      if (locale) {
        result[locale].push(translation.text);
      }
    }
  }

  return result;
};

// ---------------------------------------------------------------------------
// Google Translate (single target)
// ---------------------------------------------------------------------------

const translateWithGoogle = async (
  texts: string[],
  sourceLocale: string,
  targetLocale: string
): Promise<string[]> => {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

  if (!apiKey) throw new Error('GOOGLE_TRANSLATE_API_KEY is required');

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts,
        source: toTranslationLocale(sourceLocale),
        target: toTranslationLocale(targetLocale),
        format: 'text',
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Translate failed with ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as {
    data?: { translations?: Array<{ translatedText?: string }> };
  };

  return (body.data?.translations ?? []).map((t) => t.translatedText ?? '');
};

// ---------------------------------------------------------------------------
// LibreTranslate (single target)
// ---------------------------------------------------------------------------

const translateWithLibreTranslate = async (
  texts: string[],
  sourceLocale: string,
  targetLocale: string
): Promise<string[]> => {
  const baseUrl = process.env.LIBRETRANSLATE_URL;

  if (!baseUrl) throw new Error('LIBRETRANSLATE_URL is required');

  const endpoint = `${baseUrl.replace(/\/$/, '')}/translate`;
  const translations: string[] = [];

  for (const text of texts) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: toTranslationLocale(sourceLocale),
        target: toTranslationLocale(targetLocale),
        format: 'text',
        api_key: process.env.LIBRETRANSLATE_API_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate failed with ${response.status} ${response.statusText}`);
    }

    const body = (await response.json()) as { translatedText?: string };
    translations.push(body.translatedText ?? '');
  }

  return translations;
};

// ---------------------------------------------------------------------------
// MyMemory — Free, no credit card, 5000 words/day with email registration
// ---------------------------------------------------------------------------

/**
 * MyMemory free translation API.
 * Set MYMEMORY_EMAIL for 5000 words/day quota (vs 1000 without email).
 * Supports TH and JA.
 */
const translateWithMyMemory = async (
  texts: string[],
  sourceLocale: string,
  targetLocale: string
): Promise<string[]> => {
  const email = process.env.MYMEMORY_EMAIL ?? '';
  const langPair = `${toTranslationLocale(sourceLocale)}|${toTranslationLocale(targetLocale)}`;
  const translations: string[] = [];

  for (const text of texts) {
    // MyMemory has a 500-character limit per request — chunk if needed
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += 500) {
      chunks.push(text.slice(i, i + 500));
    }

    const chunkResults: string[] = [];

    for (const chunk of chunks) {
      const params = new URLSearchParams({ q: chunk, langpair: langPair });
      if (email) params.set('de', email);

      const response = await fetch(
        `https://api.mymemory.translated.net/get?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`MyMemory failed with ${response.status} ${response.statusText}`);
      }

      const body = (await response.json()) as {
        responseStatus: number;
        responseData: { translatedText: string };
        quotaFinished?: boolean;
      };

      if (body.quotaFinished) {
        throw new Error(
          'MyMemory daily quota exceeded. Set MYMEMORY_EMAIL for 5x more quota, or wait until tomorrow.'
        );
      }

      chunkResults.push(body.responseData?.translatedText ?? chunk);
    }

    translations.push(chunkResults.join(''));
  }

  return translations;
};

// ---------------------------------------------------------------------------
// DeepL Translator — Free 500K chars/month (JA supported, TH not supported)
// ---------------------------------------------------------------------------

/**
 * DeepL API translation.
 * Free tier: 500,000 characters/month — no charge within limit.
 * Supports TH (Thai) and JA (Japanese) — sign up at deepl.com/pro-api
 * Free API keys end with ':fx'  (e.g. abc123:fx)
 */
const translateWithDeepL = async (
  texts: string[],
  sourceLocale: string,
  targetLocale: string
): Promise<string[]> => {
  const apiKey = process.env.DEEPL_API_KEY;

  if (!apiKey) throw new Error('DEEPL_API_KEY is required for DeepL Translator');

  // Free tier uses api-free.deepl.com, paid uses api.deepl.com
  const isFree = apiKey.endsWith(':fx');
  const baseUrl = isFree
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: texts,
      source_lang: toTranslationLocale(sourceLocale).toUpperCase(),
      target_lang: toTranslationLocale(targetLocale).toUpperCase(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepL translation failed with ${response.status}: ${errorText}`);
  }

  const body = (await response.json()) as {
    translations: Array<{ text: string; detected_source_language: string }>;
  };

  return body.translations.map((t) => t.text);
};

// ---------------------------------------------------------------------------
// Per-locale translate helper (DeepL / Google / LibreTranslate / MyMemory)
// ---------------------------------------------------------------------------

const translateTexts = async (
  texts: string[],
  sourceLocale: string,
  targetLocale: string
): Promise<string[]> => {
  if (texts.length === 0) return [];

  const provider = getProvider();

  if (provider === 'deepl') return translateWithDeepL(texts, sourceLocale, targetLocale);
  if (provider === 'google') return translateWithGoogle(texts, sourceLocale, targetLocale);
  if (provider === 'libretranslate') return translateWithLibreTranslate(texts, sourceLocale, targetLocale);
  if (provider === 'mymemory') return translateWithMyMemory(texts, sourceLocale, targetLocale);

  throw new Error('Use translateWithMicrosoft for the microsoft provider');
};


// ---------------------------------------------------------------------------
// Strapi document helpers
// ---------------------------------------------------------------------------

const getDeepPopulate = async (strapi: Core.Strapi, uid: string) => {
  const populateBuilder = (strapi as any).plugin('content-manager')?.service('populate-builder');
  if (!populateBuilder) return '*';
  return populateBuilder(uid).populateDeep(Infinity).build();
};

const getDefaultLocale = async (strapi: Core.Strapi) =>
  (strapi as any).plugin('i18n').service('locales').getDefaultLocale();

const getResultDocumentId = (result: any, params: Record<string, unknown>) =>
  result?.documentId ?? result?.entries?.[0]?.documentId ?? params.documentId;

const getResultLocale = async (
  strapi: Core.Strapi,
  result: any,
  params: Record<string, unknown>
) =>
  result?.locale ??
  result?.entries?.[0]?.locale ??
  params.locale ??
  (await getDefaultLocale(strapi));

// ---------------------------------------------------------------------------
// Main sync function
// ---------------------------------------------------------------------------

const syncDocumentTranslations = async (
  strapi: Core.Strapi,
  uid: string,
  result: any,
  params: Record<string, unknown>
) => {
  const disabledReason = getDisabledReason();

  if (disabledReason) {
    if (loggedDisabledReason !== disabledReason) {
      strapi.log.warn(`[auto-translate] Disabled: ${disabledReason}`);
      loggedDisabledReason = disabledReason;
    }
    return;
  }

  const schema = (strapi as any).getModel(uid) as ModelSchema;
  const i18nContentTypes = (strapi as any).plugin('i18n')?.service('content-types');

  if (
    !schema ||
    schema.pluginOptions?.i18n?.localized !== true ||
    !i18nContentTypes?.isLocalizedContentType(schema)
  ) {
    return;
  }

  const documentId = getResultDocumentId(result, params);
  const sourceLocale = await getResultLocale(strapi, result, params);

  if (!documentId || !sourceLocale) return;

  const locales = (await (strapi as any).plugin('i18n').service('locales').find()) as LocaleRecord[];
  const targetLocales = getTargetLocalesFromEnv(
    locales.map((l) => l.code).filter((l) => l !== sourceLocale)
  );

  if (targetLocales.length === 0) return;

  const populate = await getDeepPopulate(strapi, uid);
  const sourceDocument = await (strapi as any).documents(uid).findOne({
    documentId,
    locale: sourceLocale,
    populate,
  } as any);

  if (!sourceDocument) return;

  const provider = getProvider();

  if (provider === 'microsoft') {
    // ─── Microsoft: ONE API call for all target locales ──────────────────────
    const masterRefs: TranslationRef[] = [];
    // Build payload once just to collect the texts to translate
    buildPayloadForSchema(strapi, schema, sourceDocument as Record<string, unknown>, masterRefs);

    const texts = masterRefs.map((r) => r.text);

    const allTranslations = await translateWithMicrosoft(texts, sourceLocale, targetLocales);

    for (const targetLocale of targetLocales) {
      // Build a fresh payload for each locale so refs point to unique objects
      const localeRefs: TranslationRef[] = [];
      const localeData = buildPayloadForSchema(
        strapi,
        schema,
        sourceDocument as Record<string, unknown>,
        localeRefs
      );

      const localeTexts = allTranslations[targetLocale] ?? [];
      localeRefs.forEach((ref, index) => {
        ref.holder[ref.key] = localeTexts[index] ?? ref.text;
      });

      await (strapi as any).documents(uid).update({
        [INTERNAL_UPDATE_PARAM]: true,
        documentId,
        locale: targetLocale,
        data: localeData,
        fields: [],
      } as any);
    }
  } else {
    // ─── Google / LibreTranslate: one call per locale ────────────────────────
    for (const targetLocale of targetLocales) {
      const translationRefs: TranslationRef[] = [];
      const translatedData = buildPayloadForSchema(
        strapi,
        schema,
        sourceDocument as Record<string, unknown>,
        translationRefs
      );

      const translatedTexts = await translateTexts(
        translationRefs.map((r) => r.text),
        sourceLocale,
        targetLocale
      );

      translationRefs.forEach((ref, index) => {
        ref.holder[ref.key] = translatedTexts[index] ?? ref.text;
      });

      await (strapi as any).documents(uid).update({
        [INTERNAL_UPDATE_PARAM]: true,
        documentId,
        locale: targetLocale,
        data: translatedData,
        fields: [],
      } as any);
    }
  }
};

// ---------------------------------------------------------------------------
// Middleware registration
// ---------------------------------------------------------------------------

export const registerAutoTranslateMiddleware = ({ strapi }: { strapi: Core.Strapi }) => {
  if (isEnabled()) {
    strapi.log.info(`[auto-translate] Enabled with ${getProvider()} provider`);
  } else {
    strapi.log.warn(`[auto-translate] Disabled: ${getDisabledReason()}`);
  }

  strapi.documents.use(async (context, next) => {
    const params = context.params as Record<string, unknown>;

    if (params?.[INTERNAL_UPDATE_PARAM]) return next();

    const result = await next();

    if (!['create', 'update', 'publish'].includes(context.action)) return result;

    const syncTranslations = () =>
      syncDocumentTranslations(strapi, context.contentType.uid, result, params).catch((error) => {
        strapi.log.error('[auto-translate] Failed to sync localizations', error);
      });

    if (shouldRunInBackground()) {
      syncTranslations();
    } else {
      await syncTranslations();
    }

    return result;
  });
};
