import axios from 'axios';
import { URL } from '@/utils/constants';

/** Map offer language to translate API language (de uses en content). */
export function resolveContentLang(offerLanguage) {
    const lang = String(offerLanguage || 'en').toLowerCase();
    if (lang === 'hr') return 'hr';
    return 'en';
}

export function getLineDescription(item, offerLanguage) {
    const lang = resolveContentLang(offerLanguage);
    if (lang === 'hr') {
        return String(item?.descriptionHr ?? item?.description ?? '').trim();
    }
    return String(item?.descriptionEn ?? item?.description ?? '').trim();
}

export async function translateText(text, sourceLang, targetLang) {
    const input = String(text ?? '').trim();
    if (!input) return '';
    if (sourceLang === targetLang) return input;

    const response = await axios.post(`${URL}/translate`, {
        text: input,
        sourceLang,
        targetLang,
    });
    if (response?.data?.code !== 200) {
        throw new Error(response?.data?.message || 'Translation failed');
    }
    return String(response?.data?.data?.text ?? '').trim();
}

/**
 * After user edits description in the current offer language,
 * store it and fill the other language via translate.
 */
export async function syncLineDescriptions(item, offerLanguage, rawText) {
    const text = String(rawText ?? '').trim();
    const lang = resolveContentLang(offerLanguage);
    const next = { ...item };

    if (lang === 'hr') {
        next.descriptionHr = text;
        if (!text) {
            next.descriptionEn = '';
            return next;
        }
        try {
            next.descriptionEn = await translateText(text, 'hr', 'en');
        } catch {
            // Keep source language text even if translation fails.
            if (!next.descriptionEn) next.descriptionEn = text;
        }
    } else {
        next.descriptionEn = text;
        if (!text) {
            next.descriptionHr = '';
            return next;
        }
        try {
            next.descriptionHr = await translateText(text, 'en', 'hr');
        } catch {
            if (!next.descriptionHr) next.descriptionHr = text;
        }
    }
    return next;
}

/** When offer language changes, ensure target description exists. */
export async function ensureDescriptionForLanguage(item, offerLanguage) {
    const lang = resolveContentLang(offerLanguage);
    const en = String(item?.descriptionEn ?? '').trim();
    const hr = String(item?.descriptionHr ?? '').trim();

    if (lang === 'hr') {
        if (hr || !en) return item;
        try {
            const translated = await translateText(en, 'en', 'hr');
            return { ...item, descriptionHr: translated };
        } catch {
            return item;
        }
    }

    if (en || !hr) return item;
    try {
        const translated = await translateText(hr, 'hr', 'en');
        return { ...item, descriptionEn: translated };
    } catch {
        return item;
    }
}
