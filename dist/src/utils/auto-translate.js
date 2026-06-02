"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAutoTranslateMiddleware = void 0;
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
let loggedDisabledReason = null;
// ---------------------------------------------------------------------------
// Provider detection & validation
// ---------------------------------------------------------------------------
const getProvider = () => {
    var _a;
    const provider = (_a = process.env.AUTO_TRANSLATE_PROVIDER) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (provider === 'microsoft' ||
        provider === 'google' ||
        provider === 'libretranslate' ||
        provider === 'mymemory' ||
        provider === 'deepl') {
        return provider;
    }
    // Auto-detect from available keys/config
    if (process.env.DEEPL_API_KEY)
        return 'deepl';
    if (process.env.MICROSOFT_TRANSLATOR_API_KEY)
        return 'microsoft';
    if (process.env.GOOGLE_TRANSLATE_API_KEY)
        return 'google';
    if (process.env.LIBRETRANSLATE_URL)
        return 'libretranslate';
    if (process.env.MYMEMORY_EMAIL)
        return 'mymemory';
    return null;
};
const getDisabledReason = () => {
    var _a;
    const flag = process.env.AUTO_TRANSLATE_ENABLED;
    if (flag && ['false', '0', 'off', 'no'].includes(flag.toLowerCase())) {
        return 'AUTO_TRANSLATE_ENABLED is false';
    }
    const configuredProvider = (_a = process.env.AUTO_TRANSLATE_PROVIDER) === null || _a === void 0 ? void 0 : _a.toLowerCase();
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
const shouldRunInBackground = () => { var _a; return ((_a = process.env.AUTO_TRANSLATE_BACKGROUND) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'true'; };
// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------
const isLocalizedAttribute = (attribute) => { var _a, _b; return ((_b = (_a = attribute === null || attribute === void 0 ? void 0 : attribute.pluginOptions) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.localized) === true; };
const shouldTranslateString = (fieldName, value) => {
    const normalizedFieldName = fieldName.toLowerCase();
    const trimmed = value.trim();
    if (!trimmed)
        return false;
    if (TECHNICAL_FIELD_HINTS.some((hint) => normalizedFieldName.includes(hint)))
        return false;
    if (/^https?:\/\//i.test(trimmed) ||
        /^mailto:/i.test(trimmed) ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return false;
    }
    return true;
};
const getTargetLocalesFromEnv = (locales) => {
    const configured = process.env.AUTO_TRANSLATE_TARGET_LOCALES;
    if (!configured)
        return locales;
    const allowList = new Set(configured
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean));
    return locales.filter((l) => allowList.has(l));
};
const toTranslationLocale = (locale) => locale.split('-')[0] || locale;
const getMediaId = (value) => {
    if (value && typeof value === 'object' && 'id' in value) {
        return value.id;
    }
    return value;
};
const normalizeMediaValue = (value, attribute) => {
    if (value == null)
        return value;
    if (attribute.multiple && Array.isArray(value))
        return value.map(getMediaId);
    return getMediaId(value);
};
const addStringForTranslation = (result, key, value, refs) => {
    if (typeof value !== 'string') {
        result[key] = value;
        return;
    }
    result[key] = value;
    if (shouldTranslateString(key, value)) {
        refs.push({ holder: result, key, text: value });
    }
};
const buildBlocksPayload = (value, refs) => {
    if (Array.isArray(value))
        return value.map((item) => buildBlocksPayload(item, refs));
    if (!value || typeof value !== 'object')
        return value;
    const result = {};
    for (const [key, childValue] of Object.entries(value)) {
        if (key === 'text') {
            addStringForTranslation(result, key, childValue, refs);
            continue;
        }
        result[key] = buildBlocksPayload(childValue, refs);
    }
    return result;
};
const buildPayloadForSchema = (strapi, schema, source, refs, includeAllFields = false) => {
    var _a, _b, _c;
    const result = {};
    for (const [key, attribute] of Object.entries((_a = schema.attributes) !== null && _a !== void 0 ? _a : {})) {
        if (!(key in source))
            continue;
        const value = source[key];
        const shouldInclude = includeAllFields || isLocalizedAttribute(attribute);
        if (!shouldInclude)
            continue;
        if (TRANSLATABLE_TYPES.has((_b = attribute.type) !== null && _b !== void 0 ? _b : '')) {
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
            const componentSchema = strapi.getModel(attribute.component);
            if (attribute.repeatable && Array.isArray(value)) {
                result[key] = value.map((item) => item && typeof item === 'object'
                    ? buildPayloadForSchema(strapi, componentSchema, item, refs, true)
                    : item);
            }
            else if (value && typeof value === 'object') {
                result[key] = buildPayloadForSchema(strapi, componentSchema, value, refs, true);
            }
            else {
                result[key] = value;
            }
            continue;
        }
        if (attribute.type === 'dynamiczone' && Array.isArray(value)) {
            result[key] = value.map((item) => {
                if (!item || typeof item !== 'object')
                    return item;
                const componentUid = item.__component;
                const componentSchema = componentUid
                    ? strapi.getModel(componentUid)
                    : null;
                if (!componentSchema)
                    return item;
                return {
                    __component: componentUid,
                    ...buildPayloadForSchema(strapi, componentSchema, item, refs, true),
                };
            });
            continue;
        }
        if (['relation', 'password'].includes((_c = attribute.type) !== null && _c !== void 0 ? _c : ''))
            continue;
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
const translateWithMicrosoft = async (texts, sourceLocale, targetLocales) => {
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
    const headers = {
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
    const body = (await response.json());
    // Build result map: { 'th': ['t1', 't2', ...], 'ja': ['t1', 't2', ...] }
    const result = Object.fromEntries(targetLocales.map((l) => [l, []]));
    for (const item of body) {
        for (const translation of item.translations) {
            // Find matching locale (e.g. 'th' matches locale code 'th' or 'th-TH')
            const locale = targetLocales.find((l) => toTranslationLocale(l) === translation.to);
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
const translateWithGoogle = async (texts, sourceLocale, targetLocale) => {
    var _a, _b;
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey)
        throw new Error('GOOGLE_TRANSLATE_API_KEY is required');
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    const body = (await response.json());
    return ((_b = (_a = body.data) === null || _a === void 0 ? void 0 : _a.translations) !== null && _b !== void 0 ? _b : []).map((t) => { var _a; return (_a = t.translatedText) !== null && _a !== void 0 ? _a : ''; });
};
// ---------------------------------------------------------------------------
// LibreTranslate (single target)
// ---------------------------------------------------------------------------
const translateWithLibreTranslate = async (texts, sourceLocale, targetLocale) => {
    var _a;
    const baseUrl = process.env.LIBRETRANSLATE_URL;
    if (!baseUrl)
        throw new Error('LIBRETRANSLATE_URL is required');
    const endpoint = `${baseUrl.replace(/\/$/, '')}/translate`;
    const translations = [];
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
        const body = (await response.json());
        translations.push((_a = body.translatedText) !== null && _a !== void 0 ? _a : '');
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
const translateWithMyMemory = async (texts, sourceLocale, targetLocale) => {
    var _a, _b, _c;
    const email = (_a = process.env.MYMEMORY_EMAIL) !== null && _a !== void 0 ? _a : '';
    const langPair = `${toTranslationLocale(sourceLocale)}|${toTranslationLocale(targetLocale)}`;
    const translations = [];
    for (const text of texts) {
        // MyMemory has a 500-character limit per request — chunk if needed
        const chunks = [];
        for (let i = 0; i < text.length; i += 500) {
            chunks.push(text.slice(i, i + 500));
        }
        const chunkResults = [];
        for (const chunk of chunks) {
            const params = new URLSearchParams({ q: chunk, langpair: langPair });
            if (email)
                params.set('de', email);
            const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`MyMemory failed with ${response.status} ${response.statusText}`);
            }
            const body = (await response.json());
            if (body.quotaFinished) {
                throw new Error('MyMemory daily quota exceeded. Set MYMEMORY_EMAIL for 5x more quota, or wait until tomorrow.');
            }
            chunkResults.push((_c = (_b = body.responseData) === null || _b === void 0 ? void 0 : _b.translatedText) !== null && _c !== void 0 ? _c : chunk);
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
const translateWithDeepL = async (texts, sourceLocale, targetLocale) => {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey)
        throw new Error('DEEPL_API_KEY is required for DeepL Translator');
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
    const body = (await response.json());
    return body.translations.map((t) => t.text);
};
// ---------------------------------------------------------------------------
// Per-locale translate helper (DeepL / Google / LibreTranslate / MyMemory)
// ---------------------------------------------------------------------------
const translateTexts = async (texts, sourceLocale, targetLocale) => {
    if (texts.length === 0)
        return [];
    const provider = getProvider();
    if (provider === 'deepl')
        return translateWithDeepL(texts, sourceLocale, targetLocale);
    if (provider === 'google')
        return translateWithGoogle(texts, sourceLocale, targetLocale);
    if (provider === 'libretranslate')
        return translateWithLibreTranslate(texts, sourceLocale, targetLocale);
    if (provider === 'mymemory')
        return translateWithMyMemory(texts, sourceLocale, targetLocale);
    throw new Error('Use translateWithMicrosoft for the microsoft provider');
};
// ---------------------------------------------------------------------------
// Strapi document helpers
// ---------------------------------------------------------------------------
const getDeepPopulate = async (strapi, uid) => {
    var _a;
    const populateBuilder = (_a = strapi.plugin('content-manager')) === null || _a === void 0 ? void 0 : _a.service('populate-builder');
    if (!populateBuilder)
        return '*';
    return populateBuilder(uid).populateDeep(Infinity).build();
};
const getDefaultLocale = async (strapi) => strapi.plugin('i18n').service('locales').getDefaultLocale();
const getResultDocumentId = (result, params) => { var _a, _b, _c, _d; return (_d = (_a = result === null || result === void 0 ? void 0 : result.documentId) !== null && _a !== void 0 ? _a : (_c = (_b = result === null || result === void 0 ? void 0 : result.entries) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.documentId) !== null && _d !== void 0 ? _d : params.documentId; };
const getResultLocale = async (strapi, result, params) => {
    var _a, _b, _c, _d, _e;
    return (_e = (_d = (_a = result === null || result === void 0 ? void 0 : result.locale) !== null && _a !== void 0 ? _a : (_c = (_b = result === null || result === void 0 ? void 0 : result.entries) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.locale) !== null && _d !== void 0 ? _d : params.locale) !== null && _e !== void 0 ? _e : (await getDefaultLocale(strapi));
};
// ---------------------------------------------------------------------------
// Main sync function
// ---------------------------------------------------------------------------
const syncDocumentTranslations = async (strapi, uid, result, params, action) => {
    var _a, _b, _c, _d;
    const disabledReason = getDisabledReason();
    if (disabledReason) {
        if (loggedDisabledReason !== disabledReason) {
            strapi.log.warn(`[auto-translate] Disabled: ${disabledReason}`);
            loggedDisabledReason = disabledReason;
        }
        return;
    }
    const schema = strapi.getModel(uid);
    const i18nContentTypes = (_a = strapi.plugin('i18n')) === null || _a === void 0 ? void 0 : _a.service('content-types');
    if (!schema ||
        ((_c = (_b = schema.pluginOptions) === null || _b === void 0 ? void 0 : _b.i18n) === null || _c === void 0 ? void 0 : _c.localized) !== true ||
        !(i18nContentTypes === null || i18nContentTypes === void 0 ? void 0 : i18nContentTypes.isLocalizedContentType(schema))) {
        return;
    }
    const documentId = getResultDocumentId(result, params);
    const sourceLocale = await getResultLocale(strapi, result, params);
    if (!documentId || !sourceLocale)
        return;
    // IMPORTANT: Only auto-translate or auto-publish if editing the primary locale ('en').
    // This prevents translation loops when manually editing 'th' or 'ja'.
    const defaultLoc = await getDefaultLocale(strapi);
    if (sourceLocale !== 'en' && sourceLocale !== defaultLoc) {
        return;
    }
    const locales = (await strapi.plugin('i18n').service('locales').find());
    const targetLocales = getTargetLocalesFromEnv(locales.map((l) => l.code).filter((l) => l !== sourceLocale));
    if (targetLocales.length === 0)
        return;
    if (action === 'publish') {
        strapi.log.info(`[auto-translate] Publishing target locales for document ${documentId}`);
        for (const targetLocale of targetLocales) {
            try {
                await strapi.documents(uid).publish({
                    documentId,
                    locale: targetLocale,
                });
            }
            catch (error) {
                strapi.log.warn(`[auto-translate] Could not auto-publish ${targetLocale} for ${documentId}. It may not have a draft.`);
            }
        }
        return;
    }
    const populate = await getDeepPopulate(strapi, uid);
    const sourceDocument = await strapi.documents(uid).findOne({
        documentId,
        locale: sourceLocale,
        populate,
    });
    if (!sourceDocument)
        return;
    const provider = getProvider();
    if (provider === 'microsoft') {
        // ─── Microsoft: ONE API call for all target locales ──────────────────────
        const masterRefs = [];
        // Build payload once just to collect the texts to translate
        buildPayloadForSchema(strapi, schema, sourceDocument, masterRefs);
        const texts = masterRefs.map((r) => r.text);
        const allTranslations = await translateWithMicrosoft(texts, sourceLocale, targetLocales);
        for (const targetLocale of targetLocales) {
            // Build a fresh payload for each locale so refs point to unique objects
            const localeRefs = [];
            const localeData = buildPayloadForSchema(strapi, schema, sourceDocument, localeRefs);
            const localeTexts = (_d = allTranslations[targetLocale]) !== null && _d !== void 0 ? _d : [];
            localeRefs.forEach((ref, index) => {
                var _a;
                ref.holder[ref.key] = (_a = localeTexts[index]) !== null && _a !== void 0 ? _a : ref.text;
            });
            await strapi.documents(uid).update({
                [INTERNAL_UPDATE_PARAM]: true,
                documentId,
                locale: targetLocale,
                data: localeData,
                fields: [],
            });
        }
    }
    else {
        // ─── Google / LibreTranslate: one call per locale ────────────────────────
        for (const targetLocale of targetLocales) {
            const translationRefs = [];
            const translatedData = buildPayloadForSchema(strapi, schema, sourceDocument, translationRefs);
            const translatedTexts = await translateTexts(translationRefs.map((r) => r.text), sourceLocale, targetLocale);
            translationRefs.forEach((ref, index) => {
                var _a;
                ref.holder[ref.key] = (_a = translatedTexts[index]) !== null && _a !== void 0 ? _a : ref.text;
            });
            await strapi.documents(uid).update({
                [INTERNAL_UPDATE_PARAM]: true,
                documentId,
                locale: targetLocale,
                data: translatedData,
                fields: [],
            });
        }
    }
};
// ---------------------------------------------------------------------------
// Middleware registration
// ---------------------------------------------------------------------------
const registerAutoTranslateMiddleware = ({ strapi }) => {
    if (isEnabled()) {
        strapi.log.info(`[auto-translate] Enabled with ${getProvider()} provider`);
    }
    else {
        strapi.log.warn(`[auto-translate] Disabled: ${getDisabledReason()}`);
    }
    strapi.documents.use(async (context, next) => {
        const params = context.params;
        if (params === null || params === void 0 ? void 0 : params[INTERNAL_UPDATE_PARAM])
            return next();
        const result = await next();
        if (!['create', 'update', 'publish'].includes(context.action))
            return result;
        const syncTranslations = () => syncDocumentTranslations(strapi, context.contentType.uid, result, params, context.action).catch((error) => {
            strapi.log.error('[auto-translate] Failed to sync localizations', error);
        });
        if (shouldRunInBackground()) {
            syncTranslations();
        }
        else {
            await syncTranslations();
        }
        return result;
    });
};
exports.registerAutoTranslateMiddleware = registerAutoTranslateMiddleware;
