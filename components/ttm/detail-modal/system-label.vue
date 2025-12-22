<template>
  <div class="system-label" :class="type">
    <span>{{ displayTypeName }}</span>
  </div> 
</template>
<script setup>
  const props = defineProps({
    type: {
      type: String,
      required: true,
    }
  })

  const displayTypeName = computed(() => {
    if (props.type === 'JOB_FAMILY' ||
    props.type === 'JOB_SERIES' ||
    props.type === 'JOB' ||
    props.type === 'TASK' ||
    props.type === 'KST') {
      return '직무체계';
    } else if (props.type === 'COURSE' ||
    props.type === 'LESSON_GROUP' ||
    props.type === 'LESSON' ||
    props.type === 'LEARNING_OBJECT' ||
    props.type === 'DETAIL_LEARNING_OBJECT') {
      return '교육체계';
    } else if (props.type === 'BEHAVIORAL_INDICATOR' || props.type === 'COMPETENCY') {
      return '역량체계';
    } else {
      return null;
    }
  })
</script>

<style setup lang="scss">
  .system-label {
    display: inline-block;
    position: relative;
    padding: 7px 10px;
    font-size: 14px;
    font-weight: 400;
    border-radius: 5px;
    color: #fff;
    margin-right: 5px;

    // 역량 체계 관련 라벨
      &.COMPETENCY,
      &.BEHAVIORAL_INDICATOR {
          background: var(--color-comp);
      }

      // 직무 체계 관련 라벨
      &.JOB_FAMILY,
      &.JOB_SERIES,
      &.JOB,
      &.KST,
      &.TASK {
          background: var(--color-job);
      }

      // 교육 체계 관련 라벨
      &.COURSE,
      &.LESSON_GROUP,
      &.LESSON,
      &.LEARNING_OBJECT,
      &.DETAIL_LEARNING_OBJECT {
          background: var(--color-edu);
      }
  }
</style>