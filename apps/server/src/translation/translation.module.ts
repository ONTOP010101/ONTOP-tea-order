import { Module } from '@nestjs/common';
import { TranslationController } from './translation.controller';
import { TranslationService } from './translation.service';
import { BaiduTranslateService } from './baidu-translate.service';

@Module({
  controllers: [TranslationController],
  providers: [TranslationService, BaiduTranslateService],
  exports: [TranslationService],
})
export class TranslationModule {}
