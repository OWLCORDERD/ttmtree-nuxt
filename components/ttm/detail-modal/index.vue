<template>
  <div class="modal ttm-framework" :class="{ 'is-show': modalStore.modalOpen }">
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-title">
          <!-- 상세 모달 역량 체계 라벨 뱃지 -->
          <ttm-detail-modal-system-label :type="modalStore.$state.frameworkType" />
          <!-- 상세 모달 체계 풀 경로 네비게이션 -->
          <ul class="current-path" v-if="currentFullPath.length > 0">
            <li v-for="item in currentFullPath" :key="item.id"
            class="current-path-item">
            <span class="current-path-item-name">
              {{ item.name }}
            </span>
            </li>
          </ul>
          <p class="current-path" v-else>
            {{ modalStore.$state.currentDetail.fullPath }}
          </p>
        </div>
        <button type="button" class="modal-close"
        @click="modalStore.modalClose()">
          <Close />
        </button>
      </div>

      <div class="modal-cont">
        <Suspense>
          <template #default>
          <component :is="dynamicDetailComponent"
            v-if="dynamicDetailComponent" />
          </template>
          <template #fallback>
            <div class="detail-loading">로딩 중!</div>
          </template>
        </Suspense>
      </div>

      <div class="modal-footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import Close from '@/assets/images/svg/xmark.svg';
import { Suspense } from 'vue';

const modalStore = useMyDetailModalStore();

const componentSelector = {
  // 역량 상세
  'COMPETENCY': () => import('@/components/ttm/detail-modal/content/competency.vue'),
  // 행동지표 상세
  'BEHAVIORAL_INDICATOR': () => import('@/components/ttm/detail-modal/content/competency.vue'),
  // 직무체계 상세
  'JOB_FAMILY': () => import('@/components/ttm/detail-modal/content/job.vue'),
  'JOB_SERIES': () => import('@/components/ttm/detail-modal/content/job.vue'),
  'JOB': () => import('@/components/ttm/detail-modal/content/job.vue'),
  'TASK': () => import('@/components/ttm/detail-modal/content/job.vue'),
  'K': () => import('@/components/ttm/detail-modal/content/job.vue'),
  'S': () => import('@/components/ttm/detail-modal/content/job.vue'),
  'T': () => import('@/components/ttm/detail-modal/content/job.vue'),
  // 교육체계 상세
  'COURSE': () => import('@/components/ttm/detail-modal/content/edu.vue'),
}

const dynamicDetailComponent = computed(() => {
  if(!modalStore.$state.frameworkType || modalStore.$state.frameworkType === ''){
    return null;
  }

  const componentLoader = componentSelector[modalStore.$state.frameworkType];

  if (!componentLoader) return null;

  return defineAsyncComponent(componentLoader);
})

const currentFullPath = computed(() => {
  const currentPath = modalStore.$state.currentDetail.fullPath.split(' >');

  if (currentPath.length > 0) {
    return currentPath.map((item, index) => {
      return {
        id: index,
        name: item,
      }
    });
  } else {
    return currentPath;
  }
})

</script>

<style>

</style>