import { Body, Controller, Post } from '@nestjs/common';
import { TranslateService } from './translate.service';

@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Post()
  translate(
    @Body()
    body: {
      text?: string;
      sourceLang?: string;
      targetLang?: string;
    },
  ) {
    return this.translateService.translateText(
      body?.text ?? '',
      body?.sourceLang ?? 'en',
      body?.targetLang ?? 'hr',
    );
  }
}
