<template>
  <div class="framework-detail" v-if="currentFrameworkDetail">
    <div class="detail-header">
      <div class="framework-index">
        <div class="framework-icon edu">
          <TTMOpenBook /> 
        </div>
        <h2 class="framework-name">{{ currentFrameworkDetail.name }}</h2>
      </div>

      <!-- 역량체계 역량 1뎁스 > 하위 행동지표 수 카운트 표시 -->
      <div class="framework-count">
        <div class="count-txt" v-if="currentFrameworkDetail.itemType === 'COURSE'
        || currentFrameworkDetail.itemType === 'LESSON_GROUP'">
          <TTMPlates />
          <span class="title">
            교과목 수: <strong>{{ currentFrameworkDetail.childrenCount }}</strong>개
          </span>
        </div>
        <div class="count-txt" v-if="currentFrameworkDetail.itemType === 'LESSON'">
          <TTMPlates />
          <span class="title">
            학습목표 수: <strong>{{ currentFrameworkDetail.childrenCount }}</strong>개
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
    </div>

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
          <tr class="row">
            <td class="index" colspan="1">버전</td>
            <td class="cont large" colspan="3">{{ currentFrameworkDetail.version }}</td>
          </tr>
        </tbody>
      </table>
  </div>
</template>

<script setup>
import TTMOpenBook from '@/assets/images/svg/ttm-open-book.svg';
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
    name: '교육과정',
    value: 'COURSE',
  },
  {
    id: 2,
    name: '교과목그룹',
    value: 'LESSON_GROUP',
  },
  {
    id: 3,
    name: '교과목',
    value: 'LESSON',
  },
  {
    id: 4,
    name: '학습목표',
    value: 'LEARNING_OBJECT',
  },
  {
    id: 5,
    name: '세부학습목표',
    value: 'DETAIL_LEARNING_OBJECT',
  },
]

const detailModalStore = useMyDetailModalStore();

const currentFrameworkDetail = computed(() => {
  // 현재 클릭 노드의 체계 카테고리가 직무체계 or 교육체계도 아닌 경우
  if (detailModalStore.$state.frameworkType !== 'COURSE'
  && detailModalStore.$state.frameworkType !== 'LESSON_GROUP'
  && detailModalStore.$state.frameworkType !== 'LESSON'
  && detailModalStore.$state.frameworkType !== 'LEARNING_OBJECT'
  && detailModalStore.$state.frameworkType !== 'DETAIL_LEARNING_OBJECT'
  ) {
    return null;
  }

  const currentDetail = detailModalStore.$state.currentDetail;

  // TASK 맵핑 목록 > 행동지표 / 과정 두개의 맵핑 목록 병합
  if (currentDetail.mappedCompetencies || 
  currentDetail.mappedTasks ||
  currentDetail.mappedKsts) {
    const newArray = [];

    // 맵핑 역량 목록 저장
    if (currentDetail.mappedCompetencies) {
      newArray.push(...currentDetail.mappedCompetencies);
    }
    // 맵핑 과정 목록 저장
    if (currentDetail.mappedTasks) {
      newArray.push(...currentDetail.mappedTasks);
    }

    if (currentDetail.mappedKsts) {
      newArray.push(...currentDetail.mappedKsts);
    }

    return {
      ...currentDetail,
      mappedItems: newArray,
    }
  }
  return {
    ...currentDetail,
    hasChildren: currentDetail.childrenCount > 0 ? true : false,
  }
})

const displayTypeName = (type) => {
  if (type === 'TASK') {
    return 'Task';
  } else if (type === 'COMPETENCY') {
    return '역량';
  } else if (type === 'KST') {
    return 'KST';
  }
}

const handleDetailChange = (event, currentFrameworkDetail, key) => {
  currentFrameworkDetail[key] = event.target.value;
} 
</script>