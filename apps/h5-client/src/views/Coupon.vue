<template>
  <div class="coupon-page">
    <van-nav-bar :title="$t('coupon.title')" left-arrow @click-left="$router.back()" />

    <van-tabs v-model:active="activeTab">
      <van-tab :title="$t('coupon.available')">
        <div class="coupon-list">
          <div v-for="coupon in availableCoupons" :key="coupon.id" class="coupon-card">
            <div class="coupon-value">
              <template v-if="coupon.type === 'amount'">
                <span class="amount">¥{{ coupon.value }}</span>
              </template>
              <template v-else>
                <span class="discount">{{ ((typeof coupon.value === 'number' ? coupon.value : parseFloat(coupon.value) || 0) * 10).toFixed(1) }}折</span>
              </template>
            </div>
            <div class="coupon-info">
              <div class="coupon-name">{{ coupon.name }}</div>
              <div class="coupon-condition">
                {{ $t('coupon.condition', { amount: coupon.minAmount }) }}
              </div>
              <div class="coupon-time">
                {{ $t('coupon.validUntil') }}: {{ formatDate(coupon.endTime) }}
              </div>
            </div>
          </div>
          <van-empty v-if="!availableCoupons.length" :description="$t('coupon.empty')" />
        </div>
      </van-tab>
      
      <van-tab :title="$t('coupon.used')">
        <van-empty :description="$t('coupon.empty')" />
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMyCoupons } from '@/api/coupon'
import type { Coupon } from '@/types'
import dayjs from 'dayjs'

const activeTab = ref(0)
const availableCoupons = ref<Coupon[]>([])

const loadCoupons = async () => {
  try {
    const res = await getMyCoupons()
    availableCoupons.value = res.filter(c => c.status === 'available')
  } catch (error) {
    console.error(error)
  }
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

onMounted(() => {
  loadCoupons()
})
</script>

<style scoped lang="scss">
.coupon-page {
  min-height: 100vh;
  background: var(--bg-color);

  /* 固定导航栏样式 */
  .van-nav-bar {
    position: sticky;
    top: 0;
    z-index: 1000;
    background-color: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .coupon-list {
    padding: 16px;

    .coupon-card {
      display: flex;
      background: linear-gradient(135deg, var(--primary-color), #b5d954);
      border-radius: var(--border-radius);
      padding: 20px;
      margin-bottom: 12px;
      color: white;

      .coupon-value {
        width: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-right: 2px dashed rgba(255, 255, 255, 0.5);

        .amount {
          font-size: 32px;
          font-weight: bold;
        }

        .discount {
          font-size: 28px;
          font-weight: bold;
        }
      }

      .coupon-info {
        flex: 1;
        padding-left: 20px;

        .coupon-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .coupon-condition {
          font-size: 14px;
          margin-bottom: 4px;
          opacity: 0.9;
        }

        .coupon-time {
          font-size: 12px;
          opacity: 0.8;
        }
      }
    }
  }
}
</style>
