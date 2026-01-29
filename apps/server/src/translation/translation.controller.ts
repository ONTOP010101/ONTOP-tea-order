import { Controller, Post, Body, Get, Query, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { TranslationService } from './translation.service';

@Controller('translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  /**
   * 翻译单个文本
   * POST /api/translation/translate
   * Body: { text: "苹果" }
   */
  @Post('translate')
  async translate(@Body() body: any) {
    const text = body.text;
    if (!text) {
      throw new BadRequestException('请提供要翻译的文本');
    }

    console.log('🔍 [翻译API] 接收到文本:', text);
    console.log('   文本长度:', text.length);
    console.log('   文本编码:', Buffer.from(text).toString('hex'));

    try {
      const translations = await this.translationService.translateText(text);
      console.log('✅ [翻译API] 翻译结果:', translations);
      return {
        original: text,
        ...translations,
      };
    } catch (error) {
      console.error('❌ [翻译API] 翻译失败:', error);
      throw new InternalServerErrorException(`翻译失败: ${error.message}`);
    }
  }

  /**
   * 批量翻译
   * POST /api/translation/batch
   * Body: { texts: ["苹果", "香蕉"] }
   */
  @Post('batch')
  async translateBatch(@Body('texts') texts: string[]) {
    if (!texts || !Array.isArray(texts)) {
      throw new BadRequestException('请提供要翻译的文本数组');
    }

    try {
      return await this.translationService.translateBatch(texts);
    } catch (error) {
      throw new InternalServerErrorException(`批量翻译失败: ${error.message}`);
    }
  }

  /**
   * 测试翻译接口
   * GET /api/translation/test?text=苹果
   */
  @Get('test')
  async test(@Query('text') text: string = '苹果') {
    try {
      const result = await this.translationService.translateText(text);
      return {
        original: text,
        translations: result,
      };
    } catch (error) {
      throw new InternalServerErrorException(`测试翻译失败: ${error.message}`);
    }
  }
}
