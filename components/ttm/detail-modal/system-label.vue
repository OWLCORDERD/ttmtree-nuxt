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
    if (props.type === 'COMPETENCY') {
      return '역량체계';
    } else if (props.type === 'JOB_FAMILY' || props.type === 'TASK') {
      return '직무체계';
    } else if (props.type === 'COURSE') {
      return '교육체계';
    } else if (props.type === 'BEHAVIORAL_INDICATOR') {
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

      &.COMPETENCY,
      &.BEHAVIORAL_INDICATOR {
          background: var(--color-comp);
      }

                            
      &.JOB_FAMILY,
      &.TASK {
          background: var(--color-job);
      }

                            
      &.COURSE {
          background: var(--color-edu);
      }
  }
</style>