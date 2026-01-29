import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';

/**
 * 百度翻译API服务
 * 文档: https://fanyi-api.baidu.com/doc/21
 */
@Injectable()
export class BaiduTranslateService {
  // 百度翻译API配置
  private readonly API_URL = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
  private appId: string;
  private secretKey: string;
  private lastCallTime: number = 0;
  private minInterval: number = 1000; // 最小请求间隔1秒，避免频率限制

  constructor() {
    // 从环境变量读取配置
    this.appId = process.env.BAIDU_TRANSLATE_APP_ID || '';
    this.secretKey = process.env.BAIDU_TRANSLATE_SECRET_KEY || '';
    
    // 启动时输出配置状态
    console.log('🔍 [百度翻译] 检查配置...');
    console.log(`   APP_ID: ${this.appId}`);
    console.log(`   SECRET_KEY: ${this.secretKey ? '***' : '空'}`);
    
    if (this.isConfigured()) {
      console.log('✅ [百度翻译] 配置已加载');
      console.log(`   APP_ID: ${this.appId.substring(0, 8)}...`);
    } else {
      console.log('⚠️  [百度翻译] 未配置，将使用本地词库');
    }
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return !!(this.appId && this.secretKey);
  }

  /**
   * 生成签名
   */
  private generateSign(query: string, salt: string): string {
    const str = this.appId + query + salt + this.secretKey;
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * 翻译文本（带频率限制）
   */
  async translate(
    text: string,
    from: string = 'zh',
    to: string,
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('百度翻译未配置');
    }

    // 限流：确保请求间隔至少1秒
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastCall));
    }
    this.lastCallTime = Date.now();

    const salt = Date.now().toString();
    const sign = this.generateSign(text, salt);

    try {
      const response = await axios.get(this.API_URL, {
        params: {
          q: text,
          from,
          to,
          appid: this.appId,
          salt,
          sign,
        },
        timeout: 10000,
      });

      if (response.data.error_code) {
        const errorCode = response.data.error_code;
        const errorMsg = response.data.error_msg;
        
        // 详细错误处理
        if (errorCode === '54003') {
          throw new Error(`访问频率受限，请稍后重试`);
        } else if (errorCode === '54004') {
          throw new Error(`账户余额不足`);
        } else if (errorCode === '54001') {
          throw new Error(`签名错误，请检查密钥`);
        } else if (errorCode === '52003') {
          throw new Error(`用户认证失败，请检查配置或等待激活`);
        }
        
        throw new Error(`百度翻译错误 [${errorCode}]: ${errorMsg}`);
      }

      if (response.data.trans_result && response.data.trans_result.length > 0) {
        return response.data.trans_result[0].dst;
      }

      throw new Error('翻译结果为空');
    } catch (error) {
      if (error.message.includes('百度翻译错误')) {
        throw error;
      }
      throw new Error(`翻译请求失败: ${error.message}`);
    }
  }

  /**
   * 翻译为多种语言（顺序调用，避免频率限制）
   */
  async translateToMultiLanguages(text: string): Promise<{
    en: string;
    ar: string;
    es: string;
    pt: string;
  }> {
    if (!this.isConfigured()) {
      throw new Error('百度翻译未配置，请在.env中设置 BAIDU_TRANSLATE_APP_ID 和 BAIDU_TRANSLATE_SECRET_KEY');
    }

    try {
      // 顺序调用，避免并发导致频率限制
      const en = await this.translate(text, 'zh', 'en');   // 中文 -> 英语
      const ar = await this.translate(text, 'zh', 'ara');  // 中文 -> 阿拉伯语
      const es = await this.translate(text, 'zh', 'spa');  // 中文 -> 西班牙语
      const pt = await this.translate(text, 'zh', 'pt');   // 中文 -> 葡萄牙语

      return { en, ar, es, pt };
    } catch (error) {
      throw error;
    }
  }
}
