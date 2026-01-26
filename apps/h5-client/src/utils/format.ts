// 格式化价格，避免出现多个小数点
export const formatPrice = (price: any): number => {
  // 确保 price 是数字类型
  const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0
  return parseFloat(numPrice.toFixed(2))
}

// 格式化价格为字符串，用于显示
export const formatPriceString = (price: any): string => {
  return formatPrice(price).toString()
}

// 直接格式化并返回字符串，用于模板中直接调用
export const formatPriceForDisplay = (price: any): string => {
  return formatPrice(price).toString()
}
