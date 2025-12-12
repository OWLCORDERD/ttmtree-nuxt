<template>
  <ul class="search-category" :class="{ 'no-result': modelValue.data.length === 0 }">
    <template v-if="modelValue.data.length > 0">
    <li class="category-item" v-for="(item, i) in modelValue.data" :key="i">
      <div class="category-item-index">
        <span class="type-label">{{ typeDisplayName(item.data.type) }}</span>
        <button type="button" class="category-name"
        @click="selectSearchNode(item, item.data.type)">
          {{ item.data.name }}</button>
      </div>
      <div class="category-item-depth">
          <template v-if="item.data.depth === 0">
            <span>1depth</span>
          </template>
          <template v-if="item.data.depth === 1">
            <span>1depth > 2depth</span>
          </template>
          <template v-if="item.data.depth === 2">
            <span>1depth > 2depth > 3depth</span>
          </template>
          <template v-if="item.data.depth === 3">
            <span>1depth > 2depth > 3depth > 4depth</span>
          </template>
          <template v-if="item.data.depth === 4">
            <span>1depth > 2depth > 3depth > 4depth > 5depth</span>
          </template>
      </div>
    </li>
    </template>
    <template v-else>
      <div class="no-result">
        <span>검색 결과가 없습니다.</span>
      </div>
    </template>
  </ul>
</template>

<script setup>
const { $typeDisplayName: typeDisplayName } = useNuxtApp();

const treeInstanceStore = useMyTreeInstanceStore();

const modelValue = defineModel();

const props = defineProps({
  searchData: {
    type: Array,
    required: true,
    default: () => [],
  }
})

const selectSearchNode = (node, type) => {
  treeInstanceStore.searchNode(node, type);
}
</script>

<style lang="scss" scoped>
  .search-category {
    position: absolute;
    top: 35px;
    left: 0;
    width: 100%;
    height: max-content;
    background: var(--color-white);
    z-index: 1000;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.3);
    padding: 10px 12px;
    overflow-y: auto;
    max-height: 362px;

    &.no-result {
      padding: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      align-items: center;
    }

    .category-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      padding: 10px 0;
      border-bottom: 1px solid #eeeeee;

      &-index {
        display: flex;
        align-items: center;
        gap: 4px;

        .type-label {
          padding: 6px 10px;
          border: 1px solid #d7d7d7;
          border-radius: 100px;
          font-size: 14px;
          color: #0065CD;
        }

        .category-name {
          border: none;
          max-width: 250px;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          font-size: 14px;
          font-weight: 500;
          color: #333333;
        }
      }

      &-depth {
          display: block;
          margin-top: 5px;

          span {
            font-size: 14px;
            color: var(--color-gray);
          }
      }

      .category-item-index {
        .category-name {
          &:hover {
            cursor: pointer;
            color: #0065CD;
          }
        }
      }
    }
  }
</style>