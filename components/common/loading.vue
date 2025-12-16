<template>
  <div class="loading-lottie">
    <component
      :is="Vue3Lottie"
      v-if="Vue3Lottie"
      animation-link="/lottie/hierarchy-animation.json"
      :width="80"
      :height="80"
      :loop="true"
    />

    <span class="loading-txt">
      {{ displayLoadingTxt(containerId) }}
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  containerId: {
    type: String,
    required: true,
  },
})

const Vue3Lottie = shallowRef(null);

onMounted(async () => {
  if(import.meta.client) {
    const { Vue3Lottie: LottieComponent } = await import('vue3-lottie');
    Vue3Lottie.value = LottieComponent;
    console.log(Vue3Lottie.value);
  }
})

const displayLoadingTxt = (containerId) => {
  switch(containerId) {
    case 'comp-tree':
      return '역량체계 트리 생성 중...';
    case 'job-tree':
      return '직무체계 트리 생성 중...';
    case 'edu-tree':
      return '교육체계 트리 생성 중...';
    default:
      return '로딩 중...';
  }
}
</script>

<style lang='scss'>
</style>