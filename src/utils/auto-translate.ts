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

type TranslateProvider = 'google' | 'libretranslate' | 'openai';

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

const getDisabledReason = () => {
  const flag = process.env.AUTO_TRANSLATE_ENABLED;

  if (flag && ['false', '0', 'off', 'no'].includes(flag.toLowerCase())) {
    return 'AUTO_TRANSLATE_ENABLED is false';
  }

  const configuredProvider = process.env.AUTO_TRANSLATE_PROVIDER?.toLowerCase();

  if (configuredProvider && !['google', 'libretranslate', 'openai'].includes(configuredProvider)) {
    return 'AUTO_TRANSLATE_PROVIDER must be google, libretranslate, or openai';
  }

  const provider = getProvider();

  if (!provider) {
    return 'no translation provider configured';
  }

  if (provider === 'google' && !process.env.GOOGLE_TRANSLATE_API_KEY) {
    return 'GOOGLE_TRANSLATE_API_KEY is missing';
  }

  if (provider === 'libretranslate' && !process.env.LIBRETRANSLATE_URL) {
    return 'LIBRETRANSLATE_URL is missing';
  }

  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    return 'OPENAI_API_KEY is missing';
  }

  return null;
};

const isEnabled = () => {
  return getDisabledReason() === null;
};

const shouldRunInBackground = () => {
  return process.env.AUTO_TRANSLATE_BACKGROUND?.toLowerCase() === 'true';
};

const getProvider = (): TranslateProvider | null => {
  const provider = process.env.AUTO_TRANSLATE_PROVIDER?.toLowerCase();

  if (provider === 'google' || provider === 'libretranslate' || provider === 'openai') {
    return provider;
  }

  if (process.env.OPENAI_API_KEY) {
    return 'openai';
  }

  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    return 'google';
  }

  if (process.env.LIBRETRANSLATE_URL) {
    return 'libretranslate';
  }

  return null;
};

const isLocalizedAttribute = (attribute?: Attribute) => {
  return attribute?.pluginOptions?.i18n?.localized === true;
};

const shouldTranslateString = (fieldName: string, value: string) => {
  const normalizedFieldName = fieldName.toLowerCase();
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  if (TECHNICAL_FIELD_HINTS.some((hint) => normalizedFieldName.includes(hint))) {
    return false;
  }

  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return false;
  }

  return true;
};

const getTargetLocalesFromEnv = (locales: string[]) => {
  const configured = process.env.AUTO_TRANSLATE_TARGET_LOCALES;

  if (!configured) {
    return locales;
  }

  const allowList = new Set(
    configured
      .split(',')
      .map((locale) => locale.trim())
      .filter(Boolean)
  );

  return locales.filter((locale) => allowList.has(locale));
};

const decodeHtmlEntities = (value: string) => {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

const toTranslationLocale = (locale: string) => {
  return locale.split('-')[0] || locale;
};

const getMediaId = (value: unknown): unknown => {
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: unknown }).id;
  }

  return value;
};

const normalizeMediaValue = (value: unknown, attribute: Attribute) => {
  if (value == null) {
    return value;
  }

  if (attribute.multiple && Array.isArray(value)) {
    return value.map(getMediaId);
  }

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
    refs.push({
      holder: result,
      key,
      text: value,
    });
  }
};

const buildBlocksPayload = (value: unknown, refs: TranslationRef[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => buildBlocksPayload(item, refs));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

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
    if (!(key in source)) {
      continue;
    }

    const value = source[key];
    const shouldInclude = includeAllFields || isLocalizedAttribute(attribute);

    if (!shouldInclude) {
      continue;
    }

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
        if (!item || typeof item !== 'object') {
          return item;
        }

        const componentUid = (item as { __component?: string }).__component;
        const componentSchema = componentUid ? ((strapi as any).getModel(componentUid) as ModelSchema) : null;

        if (!componentSchema) {
          return item;
        }

        return {
          __component: componentUid,
          ...buildPayloadForSchema(strapi, componentSchema, item as Record<string, unknown>, refs, true),
        };
      });
      continue;
    }

    if (['relation', 'password'].includes(attribute.type ?? '')) {
      continue;
    }

    result[key] = value;
  }

  return result;
};

const translateWithGoogle = async (texts: string[], sourceLocale: string, targetLocale: string) => {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_TRANSLATE_API_KEY is required for Google Translate');
  }

  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: texts,
      source: toTranslationLocale(sourceLocale),
      target: toTranslationLocale(targetLocale),
      format: 'text',
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Translate failed with ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as {
    data?: {
      translations?: Array<{
        translatedText?: string;
      }>;
    };
  };

  return (body.data?.translations ?? []).map((translation) =>
    decodeHtmlEntities(translation.translatedText ?? '')
  );
};

const translateWithLibreTranslate = async (texts: string[], sourceLocale: string, targetLocale: string) => {
  const baseUrl = process.env.LIBRETRANSLATE_URL;

  if (!baseUrl) {
    throw new Error('LIBRETRANSLATE_URL is required for LibreTranslate');
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/translate`;
  const translations: string[] = [];

  for (const text of texts) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

    const body = (await response.json()) as {
      translatedText?: string;
    };

    translations.push(body.translatedText ?? '');
  }

  return translations;
};

const extractOpenAIOutputText = (body: any) => {
  if (typeof body?.output_text === 'string') {
    return body.output_text;
  }

  const message = body?.output?.find((item: any) => item?.type === 'message');
  const outputText = message?.content?.find((item: any) => item?.type === 'output_text');

  return outputText?.text;
};

const translateWithOpenAI = async (texts: string[], sourceLocale: string, targetLocale: string) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_TRANSLATE_MODEL || 'gpt-4.1-mini';

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for OpenAI translation');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content:
            'You are an AI translation engine for website CMS content. Return JSON only. Translate naturally for business website copy. Preserve brand names, URLs, emails, phone numbers, code-like values, numbers, and formatting. Keep the output array in the exact same order and length as the input array.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            sourceLocale: toTranslationLocale(sourceLocale),
            targetLocale: toTranslationLocale(targetLocale),
            texts,
          }),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'translation_result',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              translations: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
            required: ['translations'],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI translation failed with ${response.status} ${response.statusText}: ${errorText}`);
  }

  const body = await response.json();
  const outputText = extractOpenAIOutputText(body);

  if (!outputText) {
    throw new Error('OpenAI translation returned no output text');
  }

  const parsed = JSON.parse(outputText) as {
    translations?: string[];
  };

  if (!Array.isArray(parsed.translations)) {
    throw new Error('OpenAI translation returned invalid translations array');
  }

  return texts.map((text, index) => parsed.translations?.[index] ?? text);
};

const translateTexts = async (texts: string[], sourceLocale: string, targetLocale: string) => {
  if (texts.length === 0) {
    return [];
  }

  const provider = getProvider();

  if (provider === 'google') {
    return translateWithGoogle(texts, sourceLocale, targetLocale);
  }

  if (provider === 'libretranslate') {
    return translateWithLibreTranslate(texts, sourceLocale, targetLocale);
  }

  if (provider === 'openai') {
    return translateWithOpenAI(texts, sourceLocale, targetLocale);
  }

  throw new Error('AUTO_TRANSLATE_PROVIDER must be google, libretranslate, or openai');
};

const getDeepPopulate = async (strapi: Core.Strapi, uid: string) => {
  const populateBuilder = (strapi as any).plugin('content-manager')?.service('populate-builder');

  if (!populateBuilder) {
    return '*';
  }

  return populateBuilder(uid).populateDeep(Infinity).build();
};

const getDefaultLocale = async (strapi: Core.Strapi) => {
  return (strapi as any).plugin('i18n').service('locales').getDefaultLocale();
};

const getResultDocumentId = (result: any, params: Record<string, unknown>) => {
  return result?.documentId ?? result?.entries?.[0]?.documentId ?? params.documentId;
};

const getResultLocale = async (strapi: Core.Strapi, result: any, params: Record<string, unknown>) => {
  return result?.locale ?? result?.entries?.[0]?.locale ?? params.locale ?? (await getDefaultLocale(strapi));
};

const isPublishedResult = (result: any) => {
  return Boolean(result?.publishedAt ?? result?.entries?.[0]?.publishedAt);
};

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

  if (!schema || schema.pluginOptions?.i18n?.localized !== true || !i18nContentTypes?.isLocalizedContentType(schema)) {
    return;
  }

  const documentId = getResultDocumentId(result, params);
  const sourceLocale = await getResultLocale(strapi, result, params);

  if (!documentId || !sourceLocale) {
    return;
  }

  const locales = (await (strapi as any).plugin('i18n').service('locales').find()) as LocaleRecord[];
  const targetLocales = getTargetLocalesFromEnv(
    locales.map((locale) => locale.code).filter((locale) => locale !== sourceLocale)
  );

  if (targetLocales.length === 0) {
    return;
  }

  const populate = await getDeepPopulate(strapi, uid);
  const sourceDocument = await (strapi as any).documents(uid).findOne({
    documentId,
    locale: sourceLocale,
    populate,
  } as any);

  if (!sourceDocument) {
    return;
  }

  for (const targetLocale of targetLocales) {
    const translationRefs: TranslationRef[] = [];
    const translatedData = buildPayloadForSchema(
      strapi,
      schema,
      sourceDocument as Record<string, unknown>,
      translationRefs
    );
    const translatedTexts = await translateTexts(
      translationRefs.map((ref) => ref.text),
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
};

export const registerAutoTranslateMiddleware = ({ strapi }: { strapi: Core.Strapi }) => {
  if (isEnabled()) {
    strapi.log.info(`[auto-translate] Enabled with ${getProvider()} provider`);
  } else {
    strapi.log.warn(`[auto-translate] Disabled: ${getDisabledReason()}`);
  }

  strapi.documents.use(async (context, next) => {
    const params = context.params as Record<string, unknown>;

    if (params?.[INTERNAL_UPDATE_PARAM]) {
      return next();
    }

    const result = await next();

    if (!['create', 'update', 'publish'].includes(context.action)) {
      return result;
    }

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
