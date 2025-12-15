import { defineStore } from 'pinia'
import { useRuntimeConfig } from '#app';

export const useMyDetailModalStore = defineStore('detailModal', {
  state: () => ({ 
    frameworkType: '', // 클릭한 노드의 체계 유형
    currentNode: null, // 현재 클릭한 노드
    cachedDetailData: new Map(), // 상세 정보 조회 캐싱 데이터 (새로고침 시, 초기화)
    currentDetail: null, // 현재 클릭한 노드의 상세 정보
    modalOpen: false, // 상세 모달 오픈 여부
  }),
  actions: {
    async currentDetailModalShow(node: any) {
      const config = useRuntimeConfig();
      this.currentNode = node;

      // 클릭한 아이템 노드의 유형 & 아이디 값
      const currentId = node.data.id;
      const currentType = node.data.type;

      // 2025.12.15[mhlim]: 캐싱 컬렉션 내부에 상세 조회 캐싱 데이터 조회
      const cachedYn = this.cachedDetailData.has(`${currentType}-${currentId}`);
      
      // 캐싱된 데이터가 존재하는 경우
      if (cachedYn) {
        this.currentDetail = this.cachedDetailData.get(`${currentType}-${currentId}`);
        this.frameworkType = currentType;
        this.modalOpen = true;
      } else {
        // 캐싱된 데이터가 존재하지 않을 경우
        try {
          const response: any = await $fetch(`${config.public.apiBaseUrl}/detail/${currentType}/${currentId}`);
  
          if (response.success && response.data) {
            this.currentDetail = response.data;
            // 조회된 데이터 캐싱 컬렉션에 유형-아이디 식별자로 저장
            this.cachedDetailData.set(`${currentType}-${currentId}`, response.data);
            this.frameworkType = currentType;
            this.modalOpen = true;
          } else {
            throw new Error('상세 정보 조회 실패');
          }
        } catch (error) {
          throw new Error('상세 정보 조회 실패');
        }
      }
    },
    // 모달 닫기 시, 기존 상태값 초기화 (데이터 캐싱 컬렉션 제외)
    modalClose() {
      this.currentDetail = null;
      this.frameworkType = '';
      this.currentNode = null;
      this.modalOpen = false;
    }
  }
})
