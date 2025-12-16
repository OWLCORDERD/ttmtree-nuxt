<template>
  <div class="lxp">
    <div class="wrapper">
      <!-- TTM 트리 (일반 / 편집 / 매핑) 모드 전환 토스트 메시지-->
      <common-change-mode-alert
      v-if="treeInstanceStore.$state.modeChangeToastifyYn" />
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
const treeInstanceStore = useMyTreeInstanceStore();
</script>

<style lang="scss">
@use '@/assets/scss/base/reset.scss';
@use '@/assets/scss/base/variables.scss';
@use '@/assets/scss/common.scss';
</style>