import * as webVitals from 'web-vitals'

// 性能监控回调函数
const sendToAnalytics = (metric: any) => {
  console.log('Performance Metric:', {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    delta: metric.delta
  })
  
  // 这里可以添加发送到后端监控服务的逻辑
  // 例如：
  // fetch('/api/analytics/performance', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify(metric)
  // })
}

// 初始化性能监控
export const initPerformanceMonitoring = () => {
  // 监控核心Web指标
  if (webVitals.onCLS) webVitals.onCLS(sendToAnalytics) // 累积布局偏移
  if (webVitals.onFID) webVitals.onFID(sendToAnalytics) // 首次输入延迟
  if (webVitals.onFCP) webVitals.onFCP(sendToAnalytics) // 首次内容绘制
  if (webVitals.onLCP) webVitals.onLCP(sendToAnalytics) // 最大内容绘制
  if (webVitals.onTTFB) webVitals.onTTFB(sendToAnalytics) // 首字节时间
  
  console.log('性能监控已初始化')
}

// 获取当前页面性能数据
export const getCurrentPerformanceData = () => {
  if (!window.performance) return null
  
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as any
    const paint = performance.getEntriesByType('paint')
    
    const data = {
      navigationStart: navigation?.navigationStart || 0,
      domContentLoadedEventEnd: navigation?.domContentLoadedEventEnd || 0,
      loadEventEnd: navigation?.loadEventEnd || 0,
      firstPaint: paint.find((p: any) => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find((p: any) => p.name === 'first-contentful-paint')?.startTime || 0,
      ttfb: navigation?.requestStart ? navigation.requestStart - navigation.navigationStart : 0,
      domContentLoaded: navigation?.domContentLoadedEventEnd ? navigation.domContentLoadedEventEnd - navigation.navigationStart : 0,
      pageLoad: navigation?.loadEventEnd ? navigation.loadEventEnd - navigation.navigationStart : 0
    }
    
    console.log('当前页面性能数据:', data)
    return data
  } catch (error) {
    console.error('获取性能数据失败:', error)
    return null
  }
}
