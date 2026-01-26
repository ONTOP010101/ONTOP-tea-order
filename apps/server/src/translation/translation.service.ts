import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { BaiduTranslateService } from './baidu-translate.service';

@Injectable()
export class TranslationService {
  constructor(private readonly baiduTranslate: BaiduTranslateService) {}

  /**
   * 混合翻译服务：优先使用百度翻译API，降级到本地词库
   * 1. 如果配置了百度翻译 -> 使用百度API（支持任意文本）
   * 2. 如果未配置或失败 -> 使用本地词库（仅支持预设词汇）
   */
  
  // 基础词汇映射表
  private readonly baseDict: Record<string, { en: string; ar: string; es: string; pt: string }> = {
    // 水果类
    '苹果': { en: 'Apple', ar: 'تفاح', es: 'Manzana', pt: 'Maçã' },
    '香蕉': { en: 'Banana', ar: 'موز', es: 'Plátano', pt: 'Banana' },
    '橙子': { en: 'Orange', ar: 'برتقال', es: 'Naranja', pt: 'Laranja' },
    '草莓': { en: 'Strawberry', ar: 'فراولة', es: 'Fresa', pt: 'Morango' },
    '西瓜': { en: 'Watermelon', ar: 'بطيخ', es: 'Sandía', pt: 'Melancia' },
    '葡萄': { en: 'Grape', ar: 'عنب', es: 'Uva', pt: 'Uva' },
    '芒果': { en: 'Mango', ar: 'مانجو', es: 'Mango', pt: 'Manga' },
    '桃子': { en: 'Peach', ar: 'خوخ', es: 'Durazno', pt: 'Pêssego' },
    '梨': { en: 'Pear', ar: 'كمثرى', es: 'Pera', pt: 'Pera' },
    '樱桃': { en: 'Cherry', ar: 'كرز', es: 'Cereza', pt: 'Cereja' },
    
    // 饮品类
    '咖啡': { en: 'Coffee', ar: 'قهوة', es: 'Café', pt: 'Café' },
    '茶': { en: 'Tea', ar: 'شاي', es: 'Té', pt: 'Chá' },
    '茶叶': { en: 'Tea Leaves', ar: 'أوراق الشاي', es: 'Hojas de té', pt: 'Folhas de chá' },
    '绿茶': { en: 'Green Tea', ar: 'شاي أخضر', es: 'Té verde', pt: 'Chá verde' },
    '红茶': { en: 'Black Tea', ar: 'شاي أسود', es: 'Té negro', pt: 'Chá preto' },
    '乌龙茶': { en: 'Oolong Tea', ar: 'شاي أولونغ', es: 'Té oolong', pt: 'Chá oolong' },
    '普洱茶': { en: 'Pu-erh Tea', ar: 'شاي بوير', es: 'Té pu-erh', pt: 'Chá pu-erh' },
    '花茶': { en: 'Flower Tea', ar: 'شاي الزهور', es: 'Té de flores', pt: 'Chá de flores' },
    '奶茶': { en: 'Milk Tea', ar: 'شاي بالحليب', es: 'Té con leche', pt: 'Chá com leite' },
    '拿铁': { en: 'Latte', ar: 'لاتيه', es: 'Café con leche', pt: 'Café com leite' },
    '美式': { en: 'Americano', ar: 'أمريكانو', es: 'Americano', pt: 'Americano' },
    '卡布奇诺': { en: 'Cappuccino', ar: 'كابتشينو', es: 'Capuchino', pt: 'Cappuccino' },
    '摩卡': { en: 'Mocha', ar: 'موكا', es: 'Moka', pt: 'Mocha' },
    '果汁': { en: 'Juice', ar: 'عصير', es: 'Jugo', pt: 'Suco' },
    '水': { en: 'Water', ar: 'ماء', es: 'Agua', pt: 'Água' },
    '牛奶': { en: 'Milk', ar: 'حليب', es: 'Leche', pt: 'Leite' },
    
    // 甜点类
    '蛋糕': { en: 'Cake', ar: 'كعكة', es: 'Pastel', pt: 'Bolo' },
    '提拉米苏': { en: 'Tiramisu', ar: 'تيراميسو', es: 'Tiramisú', pt: 'Tiramisu' },
    '布朗尼': { en: 'Brownie', ar: 'براوني', es: 'Brownie', pt: 'Brownie' },
    '马卡龙': { en: 'Macaron', ar: 'ماكارون', es: 'Macarrón', pt: 'Macaron' },
    '面包': { en: 'Bread', ar: 'خبز', es: 'Pan', pt: 'Pão' },
    '饼干': { en: 'Cookie', ar: 'بسكويت', es: 'Galleta', pt: 'Biscoito' },
    '巧克力': { en: 'Chocolate', ar: 'شوكولاتة', es: 'Chocolate', pt: 'Chocolate' },
    '糖果': { en: 'Candy', ar: 'حلوى', es: 'Caramelo', pt: 'Doce' },
    '冰淇淋': { en: 'Ice Cream', ar: 'آيس كريم', es: 'Helado', pt: 'Sorvete' },
    
    // 形容词
    '新鲜': { en: 'Fresh', ar: 'طازج', es: 'Fresco', pt: 'Fresco' },
    '美味': { en: 'Delicious', ar: 'لذيذ', es: 'Delicioso', pt: 'Delicioso' },
    '香甜': { en: 'Sweet', ar: 'حلو', es: 'Dulce', pt: 'Doce' },
    '浓郁': { en: 'Rich', ar: 'غني', es: 'Rico', pt: 'Rico' },
    '清爽': { en: 'Refreshing', ar: 'منعش', es: 'Refrescante', pt: 'Refrescante' },
    '经典': { en: 'Classic', ar: 'كلاسيكي', es: 'Clásico', pt: 'Clássico' },
    '特制': { en: 'Special', ar: 'خاص', es: 'Especial', pt: 'Especial' },
    '热销': { en: 'Hot Sale', ar: 'الأكثر مبيعاً', es: 'Más vendido', pt: 'Mais vendido' },
    '精选': { en: 'Selected', ar: 'مختار', es: 'Seleccionado', pt: 'Selecionado' },
    '优质': { en: 'Premium', ar: 'ممتاز', es: 'Premium', pt: 'Premium' },
    '天然': { en: 'Natural', ar: 'طبيعي', es: 'Natural', pt: 'Natural' },
    '有机': { en: 'Organic', ar: 'عضوي', es: 'Orgánico', pt: 'Orgânico' },
    '手工': { en: 'Handmade', ar: 'يدوي', es: 'Hecho a mano', pt: 'Artesanal' },
    '现做': { en: 'Freshly Made', ar: 'طازج', es: 'Recién hecho', pt: 'Feito na hora' },
    '限量': { en: 'Limited', ar: 'محدود', es: 'Limitado', pt: 'Limitado' },
    '推荐': { en: 'Recommended', ar: 'موصى به', es: 'Recomendado', pt: 'Recomendado' },
    '招牌': { en: 'Signature', ar: 'مميز', es: 'Estrella', pt: 'Assinatura' },
    '人气': { en: 'Popular', ar: 'شعبي', es: 'Popular', pt: 'Popular' },
    
    // 常用词和量词
    '的': { en: '', ar: '', es: '', pt: '' },
    '和': { en: 'and', ar: 'و', es: 'y', pt: 'e' },
    '与': { en: 'and', ar: 'و', es: 'y', pt: 'e' },
    '或': { en: 'or', ar: 'أو', es: 'o', pt: 'ou' },
    '叶': { en: 'Leaf', ar: 'ورقة', es: 'Hoja', pt: 'Folha' },
    '片': { en: 'Piece', ar: 'قطعة', es: 'Pieza', pt: 'Peça' },
    '杯': { en: 'Cup', ar: 'كوب', es: 'Taza', pt: 'Xícara' },
    '瓶': { en: 'Bottle', ar: 'زجاجة', es: 'Botella', pt: 'Garrafa' },
    '包': { en: 'Pack', ar: 'علبة', es: 'Paquete', pt: 'Pacote' },
    '盒': { en: 'Box', ar: 'صندوق', es: 'Caja', pt: 'Caixa' },
    '袋': { en: 'Bag', ar: 'كيس', es: 'Bolsa', pt: 'Saco' },
    '罐': { en: 'Can', ar: 'علبة', es: 'Lata', pt: 'Lata' },
  };

  /**
   * 翻译中文文本到多种语言
   * 策略：优先本地词库（快速+免费），仅词库外的词才调用百度API
   */
  async translateText(text: string): Promise<{
    en: string;
    ar: string;
    es: string;
    pt: string;
  }> {
    if (!text || !text.trim()) {
      return { en: '', ar: '', es: '', pt: '' };
    }

    const cleanText = text.trim();

    // 策略1: 优先使用本地词库（快速且免费）
    // 1. 精确匹配
    if (this.baseDict[cleanText]) {
      return this.baseDict[cleanText];
    }

    // 2. 智能分词翻译
    const translations = this.smartTranslate(cleanText);
    
    // 3. 检查是否有中文未翻译（说明本地词库不完整）
    const hasUntranslated = /[\u4e00-\u9fa5]/.test(translations.en);
    
    // 4. 如果有未翻译的中文，且百度API可用，尝试调用API补充翻译
    if (hasUntranslated && this.baiduTranslate.isConfigured()) {
      try {
        console.log(`[混合翻译] 本地词库部分翻译，调用百度API补充: ${cleanText}`);
        const apiResult = await this.baiduTranslate.translateToMultiLanguages(cleanText);
        console.log(`[混合翻译] 百度API补充成功`);
        return apiResult;
      } catch (error) {
        console.warn(`[混合翻译] 百度API失败，使用本地词库结果: ${error.message}`);
        // 继续使用本地词库的结果
      }
    }
    
    return translations;
  }

  /**
   * 智能分词翻译
   */
  private smartTranslate(text: string): {
    en: string;
    ar: string;
    es: string;
    pt: string;
  } {
    let enParts: string[] = [];
    let arParts: string[] = [];
    let esParts: string[] = [];
    let ptParts: string[] = [];

    let remaining = text;
    let matched = false;

    // 尝试从最长匹配开始
    const sortedKeys = Object.keys(this.baseDict).sort((a, b) => b.length - a.length);

    while (remaining.length > 0) {
      matched = false;

      for (const key of sortedKeys) {
        if (remaining.startsWith(key)) {
          const translation = this.baseDict[key];
          if (translation.en) enParts.push(translation.en);
          if (translation.ar) arParts.push(translation.ar);
          if (translation.es) esParts.push(translation.es);
          if (translation.pt) ptParts.push(translation.pt);

          remaining = remaining.substring(key.length);
          matched = true;
          break;
        }
      }

      // 如果没有匹配，保留原字符
      if (!matched) {
        const char = remaining.charAt(0);
        enParts.push(char);
        arParts.push(char);
        esParts.push(char);
        ptParts.push(char);
        remaining = remaining.substring(1);
      }
    }

    return {
      en: enParts.join(' ').trim().replace(/\s+/g, ' '),
      ar: arParts.join(' ').trim().replace(/\s+/g, ' '),
      es: esParts.join(' ').trim().replace(/\s+/g, ' '),
      pt: ptParts.join(' ').trim().replace(/\s+/g, ' '),
    };
  }

  /**
   * 批量翻译
   */
  async translateBatch(texts: string[]): Promise<Array<{
    original: string;
    en: string;
    ar: string;
    es: string;
    pt: string;
  }>> {
    const results = [];
    
    for (const text of texts) {
      const translations = await this.translateText(text);
      results.push({
        original: text,
        ...translations,
      });
    }

    return results;
  }

  /**
   * 添加自定义词汇到字典（运行时动态添加）
   */
  addCustomTranslation(
    chinese: string,
    en: string,
    ar: string,
    es: string,
    pt: string,
  ): void {
    this.baseDict[chinese] = { en, ar, es, pt };
  }
}
