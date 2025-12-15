<template>
  <div class="framework-detail" v-if="currentFrameworkDetail">
    <div class="detail-header">
      <div class="framework-index">
        <div class="framework-icon job">
          <TTMOfficeBag />
        </div>
        <h2 class="framework-name">{{ currentFrameworkDetail.name }}</h2>
      </div>

      <!-- 역량체계 역량 1뎁스 > 하위 행동지표 수 카운트 표시 -->
      <div class="framework-count">
        <div class="count-txt" v-if="currentFrameworkDetail.itemType === 'JOB_FAMILY'">
          <TTMPlates />
          <span class="title">
            직렬 수: <strong>{{ currentFrameworkDetail.childrenCount }}</strong>개
          </span>
        </div>

        <div class="count-txt" v-else-if="currentFrameworkDetail.itemType === 'JOB_SERIES'">
          <TTMPlates />
          <span class="title">
            직무 수: <strong>{{ currentFrameworkDetail.childrenCount }}</strong>개
          </span>
        </div>

        <div class="count-txt" v-else-if="currentFrameworkDetail.itemType === 'JOB'">
          <TTMPlates />
          <span class="title">
            TASK 수: <strong>{{ currentFrameworkDetail.childrenCount }}</strong>개
          </span>
        </div>

        <div class="count-txt" v-else-if="currentFrameworkDetail.itemType === 'TASK'">
          <TTMPlates />
          <span class="title">
            K/S/T 수: <strong>{{ currentFrameworkDetail.childrenCount }}</strong>개
          </span>
        </div>
      </div>
    </div>

    <table class="framework-table">
      <tbody>
        <tr class="row">
          <td class="index">체계</td>
          <td class="cont">
            <ul class="option-list">
              <li class="option-list-item" v-for="item in frameworkList" :key="item.id">
                <input
                type="radio"
                  :id="'framework-radio-' + item.value"
                  name='framework-radio-group'
                  :value="item.value"
                  v-model="currentFrameworkDetail.group"
                  @change="handleDetailChange($event, currentFrameworkDetail, 'group')"
                  />
                <label :for="'framework-radio-' + item.value">
                  {{ item.name }}
                </label>
              </li>
            </ul>
          </td>
        </tr>
        <tr class="row">
          <td class="index">ITEM타입</td>
          <td class="cont">
            <ul class="option-list">
              <li class="option-list-item" v-for="item in frameworkItemTypeList" :key="item.id">
                <input
                type="radio"
                :id="'item-type-radio-' + item.value"
                name='item-type-radio-group'
                :value="item.value"
                v-model="currentFrameworkDetail.itemType"
                @change="handleDetailChange($event, currentFrameworkDetail, 'itemType')"
                />
                <label :for="'item-type-radio-' + item.value">{{ item.name }}</label>
              </li>
            </ul>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="mapping-cont" v-if="currentFrameworkDetail.mappedItems
    && currentFrameworkDetail.mappedItems.length > 0">
      <div class="cont-header">
        <div class="index-title">
          <TTMConnect />
          <p class="title">매핑</p>
        </div>

        <span class="mapping-count">
          총 <strong>{{ currentFrameworkDetail.mappedItems.length }}</strong>건
        </span>
      </div>

      <ul class="mapping-list">
        <li class="mapping-list-item" v-for="item in currentFrameworkDetail.mappedItems">
          <ttm-detail-modal-system-label :type="item.itemType" />
          <arrowRight />
          <div class="mapping-label">
            <span class="label-name">
              {{ displayTypeName(item.itemType ) }}
            </span>
          </div>
          <span class="mapping-name">{{ item.name }}</span>
        </li>
      </ul>

      <table class="etc-table">
        <tbody>
          <tr class="row">
            <td class="index">최초 등록자</td>
            <td class="cont large">{{ currentFrameworkDetail.createdByName || '-' }}</td>
            <td class="index">최초 등록일</td>
            <td class="cont small">{{ currentFrameworkDetail.createdDate }}</td>
          </tr>
          <tr class="row">
            <td class="index">최종 수정자</td>
            <td class="cont large">{{ currentFrameworkDetail.lastModifiedByName || '-' }}</td>
            <td class="index">최종 수정일</td>
            <td class="cont small">{{ currentFrameworkDetail.lastModifiedDate }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import TTMOfficeBag from '@/assets/images/svg/ttm-office-bag.svg';
import TTMPlates from '@/assets/images/svg/plates.svg';
import TTMConnect from '@/assets/images/svg/ttm-connect.svg';
import arrowRight from '@/assets/images/svg/chevron-right.svg';

const frameworkList = [
  {
    id: 1,
    name: '역량체계',
    value: 'COMPETENCY',
  },
  {
    id: 2,
    name: '직무체계',
    value: 'JOB',
  },
  {
    id: 3,
    name: '교육체계',
    value: 'COURSE',
  }
]

const frameworkItemTypeList = [
  {
    id: 1,
    name: '직계',
    value: 'JOB_FAMILY',
  },
  {
    id: 2,
    name: '직렬',
    value: 'JOB_SERIES',
  },
  {
    id: 3,
    name: '직무',
    value: 'JOB',
  },
  {
    id: 4,
    name: 'Task',
    value: 'TASK',
  },
  {
    id: 5,
    name: 'K',
    value: 'KST-K',
  },
  {
    id: 6,
    name: 'S',
    value: 'KST-S',
  },
  {
    id: 7,
    name: 'T',
    value: 'KST-T',
  },
]

const detailModalStore = useMyDetailModalStore();

const currentFrameworkDetail = computed(() => {
  // 현재 클릭 노드의 체계 카테고리가 직무체계 or 교육체계도 아닌 경우
  if (detailModalStore.$state.frameworkType !== 'JOB_FAMILY'
  && detailModalStore.$state.frameworkType !== 'JOB_SERIES'
  && detailModalStore.$state.frameworkType !== 'JOB'
  && detailModalStore.$state.frameworkType !== 'TASK'
  && detailModalStore.$state.frameworkType !== 'KST'
  ) {
    return null;
  }

  const currentDetail = detailModalStore.$state.currentDetail;

  // K/S/T 아이템 타입 식별자 분리
  if (detailModalStore.$state.frameworkType === 'KST') {
    return {
      ...currentDetail,
      mappedItems: currentDetail.mappedLearningObjects,
      itemType: 'KST-' + currentDetail.kstType,
    }
  }

  // TASK 맵핑 목록 > 행동지표 / 과정 두개의 맵핑 목록 병합
  if (detailModalStore.$state.frameworkType === 'TASK') {
    const newArray = [];
    const newChildrenCount = currentDetail.importance + currentDetail.difficulty + currentDetail.frequency;

    // 맵핑 교육과정 목록 저장
    if (currentDetail.mappedCourses) {
      newArray.push(...currentDetail.mappedCourses);
    }
    // 맵핑 행동역량 목록 저장
    if (currentDetail.mappedBehavioralIndicators) {
      newArray.push(...currentDetail.mappedBehavioralIndicators);
    }

    return {
      ...currentDetail,
      mappedItems: newArray,
      hasChildren: true,
      childrenCount: newChildrenCount,
    }
  }
  return {
    ...currentDetail,
    hasChildren: currentDetail.childrenCount > 0 ? true : false,
  }
})

const displayTypeName = (type) => {
  if (type === 'COURSE') {
    return '교육과정';
  } else if (type === 'BEHAVIORAL_INDICATOR') {
    return '행동지표';
  } else if (type === 'LEARNING_OBJECT') {
    return '학습목표';
  }
}

const handleDetailChange = (event, currentFrameworkDetail, key) => {
  currentFrameworkDetail[key] = event.target.value;
} 
</script>

<style>

</style>