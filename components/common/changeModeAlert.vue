<template>
  <div class="change-mode-alert">
    <div class="alert-icon">
      <AlertIcon />
    </div>

    <span class="alert-message">
      {{ mode === 'mapping' ? '매핑모드 전환 중...' : mode === 'edit' ? '편집모드 전환 중...' : '일반모드 전환 중...' }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import AlertIcon from '~/assets/images/svg/btn-reset.svg';

// 2025.12.16 [mhlim]: 트리 모드 전환 상태관리 조회
const mode = useMyTreeInstanceStore().$state.currentMode;
</script>

<style lang="scss">
.change-mode-alert {
  position: fixed;
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 1000;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 250px;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  color: #fff;
  
  .alert-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    border-radius: 50%;

    .nuxt-icon {
      font-size: 25px;
      animation: spin 1s linear infinite;
      margin-bottom: 0;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .alert-message {
    font-size: 16px;
    font-weight: 500;
  }
}

</style>