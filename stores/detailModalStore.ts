import { defineStore } from 'pinia'
import { useRuntimeConfig } from '#app';

export const useMyDetailModalStore = defineStore('detailModal', {
  state: () => ({ 
    frameworkType: '', // 클릭한 노드의 체계 유형
    currentNode: null, // 현재 클릭한 노드
    currentDetail: null, // 현재 클릭한 노드의 상세 정보
    modalOpen: false, // 상세 모달 오픈 여부
  }),
  actions: {
    async currentDetailModalShow(node: any) {
      const config = useRuntimeConfig();
      this.currentNode = node;

      const currentId = node.data.id;
      const currentType = node.data.type;

      try {
        const response: any = await $fetch(`${config.public.apiBaseUrl}/detail/${currentType}/${currentId}`);

        if (response.success && response.data) {
          this.currentDetail = response.data;
          this.frameworkType = currentType;
          this.modalOpen = true;
        } else {
          throw new Error('상세 정보 조회 실패');
        }
      } catch (error) {
        throw new Error('상세 정보 조회 실패');
      }
    },
    modalClose() {
      this.currentDetail = null;
      this.frameworkType = '';
      this.currentNode = null;
      this.modalOpen = false;
    }
  }
})
