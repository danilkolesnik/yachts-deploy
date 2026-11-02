import { Injectable } from '@nestjs/common';

type TranslateLang = 'en' | 'hr' | 'de';

@Injectable()
export class TranslateService {
  private normalizeLang(lang?: string): TranslateLang {
    const value = String(lang ?? '')
      .trim()
      .toLowerCase();
    if (value === 'hr' || value === 'de' || value === 'en') return value;
    return 'en';
  }

  async translateText(
    text: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<{ code: number; data?: { text: string }; message?: string }> {
    const source = this.normalizeLang(sourceLang);
    const target = this.normalizeLang(targetLang);
    const input = String(text ?? '').trim();

    if (!input) {
      return { code: 200, data: { text: '' } };
    }
    if (source === target) {
      return { code: 200, data: { text: input } };
    }

    try {
      const deeplKey = String(process.env.DEEPL_API_KEY || '').trim();
      if (deeplKey) {
        const translated = await this.translateWithDeepL(
          input,
          source,
          target,
          deeplKey,
        );
        return { code: 200, data: { text: translated } };
      }

      const translated = await this.translateWithMyMemory(
        input,
        source,
        target,
      );
      return { code: 200, data: { text: translated } };
    } catch (err) {
      return {
        code: 500,
        message:
          err instanceof Error ? err.message : 'Translation failed',
      };
    }
  }

  private async translateWithDeepL(
    text: string,
    source: TranslateLang,
    target: TranslateLang,
    apiKey: string,
  ): Promise<string> {
    const endpoint = apiKey.endsWith(':fx')
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate';

    const body = new URLSearchParams();
    body.set('auth_key', apiKey);
    body.set('text', text);
    body.set('source_lang', source.toUpperCase());
    body.set('target_lang', target.toUpperCase());

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) {
      throw new Error(`DeepL error: ${response.status}`);
    }
    const json = (await response.json()) as {
      translations?: Array<{ text?: string }>;
    };
    const translated = json?.translations?.[0]?.text;
    if (!translated) {
      throw new Error('DeepL returned empty translation');
    }
    return String(translated);
  }

  private async translateWithMyMemory(
    text: string,
    source: TranslateLang,
    target: TranslateLang,
  ): Promise<string> {
    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q', text);
    url.searchParams.set('langpair', `${source}|${target}`);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`MyMemory error: ${response.status}`);
    }
    const json = (await response.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    const translated = json?.responseData?.translatedText;
    if (!translated || Number(json?.responseStatus) !== 200) {
      throw new Error('MyMemory returned empty translation');
    }
    return String(translated);
  }
}
