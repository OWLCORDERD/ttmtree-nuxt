<template>
  <div class="framework-detail">
    <div class="detail-header">
      <div class="framework-index">
        <div class="framework-icon competency">
          <TTMBulb />
        </div>
        <h2 class="framework-name">{{ currentFrameworkDetail.name }}</h2>
      </div>

      <div class="framework-count">
        <TTMPlates />
        <span class="count-txt">
          <span class="title">행동지표 수: <strong>{{ currentFrameworkDetail.childrenCount }}</strong>개
          </span>
        </span>
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
        <tr class="row">
          <td class="index">역량 정의</td>
          <td class="cont">
            <span class="competency-desc">
              {{ currentFrameworkDetail.description }}
            </span>
          </td>
        </tr>
        <tr class="row">
          <td class="index">역량 레벨</td>
          <td class="cont">
            <ul class="option-list">
              <li class="option-list-item" v-for="item in frameworkLevelList" :key="item.id">
                <input
                type="radio"
                :id="'level-radio-' + item.value"
                name='level-radio-group'
                :value="item.value"
                v-model="currentFrameworkDetail.level"
                @change="handleDetailChange($event, currentFrameworkDetail, 'level')"
                />
                <label :for="'level-radio-' + item.value">{{ item.name }}</label>
              </li>
            </ul>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import TTMBulb from '@/assets/images/svg/ttm-bulb.svg';
import TTMPlates from '@/assets/images/svg/plates.svg';

const frameworkList = [
  {
    id: 1,
    name: '역량체계',
    value: 'COMPETENCY',
  },
  {
    id: 2,
    name: '직무체계',
    value: 'JOB_FAMILY',
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
    name: '역량',
    value: 'COMPETENCY',
  },
  {
    id: 2,
    name: '행동지표',
    value: 'BEHAVIORAL_INDICATOR',
  }
]

const frameworkLevelList = [
  {
    id: 1,
    name: 'Level 1',
    value: '1',
  },
  {
    id: 2,
    name: 'Level 2',
    value: '2',
  },
  {
    id: 3,
    name: 'Level 3',
    value: '3',
  },
  {
    id: 4,
    name: 'Level 4',
    value: '4',
  },
  {
    id: 5,
    name: 'Level 5',
    value: '5',
  },
]

const detailModalStore = useMyDetailModalStore();

const currentFrameworkDetail = computed(() => {
  if (detailModalStore.frameworkType !== 'COMPETENCY') {
    return null;
  }

  const currentDetail = detailModalStore.$state.currentDetail;

  return {
    ...currentDetail,
    hasChildren: currentDetail.childrenCount > 0 ? true : false,
  }
})

const handleDetailChange = (event, currentFrameworkDetail, key) => {
  currentFrameworkDetail[key] = event.target.value;
}
</script>

<style>

</style>