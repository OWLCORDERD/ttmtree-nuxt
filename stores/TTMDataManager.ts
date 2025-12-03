import { defineStore } from 'pinia';
import * as d3 from 'd3';

interface dataManagerStateType {
  dataEndpoint: string;
  eduTree: Object | null; // 교육 트리 데이터
  jobTree: Object | null; // 직무 트리 데이터
  compTree: Object | null; // 역량 트리 데이터
}

export const useMyTTMDataManagerStore = defineStore('TTMDataManager', {
  state: (): dataManagerStateType => ({ 
    dataEndpoint: '', // 현재 요청받은 트리 데이터 요청 엔드포인트
    eduTree: {}, // 교육 트리 데이터
    jobTree: {}, // 직무 트리 데이터
    compTree: {}, // 역량 트리 데이터
  }),
  actions: {
    async fetchTreeDepth(endpoint: string) {
      // -----트리 데이터 조회 엔드포인트에 따른 테스트 코드
      // (더미데이터이며, API 나올 시 구조에 따라 변경 예정)
      this.dataEndpoint = endpoint.split('/')[1] ?? '';
      const response = await $fetch(`/api/ttm/tree?type=${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let originalData = response.data;

      // 트리 데이터가 없는 경우
      if (!originalData || originalData.length === 0) {
        originalData = {
            id: 'empty',
            name: 'No Data',
            type: 'EMPTY',
            children: []
        };
      } else {
        // 여러 루트가 있는 경우 가상 루트 생성
        originalData = {
          id: 'virtual-root',
          name: 'Root',
          type: 'ROOT',
          sortOrder: 0,
          depth: -1,
          metadata: {},
          children: originalData
        };
      }

      // d3.hierarchy 함수를 사용한 트리 데이터 계층 구조 변환
      const treeData = d3.hierarchy(originalData);

      switch (endpoint) {
        case '/edu':
          this.eduTree = treeData;
          break;
        case '/job':
          this.jobTree = treeData;
          break;
        case '/comp':
          this.compTree = treeData;
          break;
      }
      // ---------------------------------------------------
    }
  }
})
