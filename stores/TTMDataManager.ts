import { defineStore } from 'pinia'

interface dataManagerStateType {
  dataEndpoint: string;
  eduTree: Object; // 교육 트리 데이터
  jobTree: Object; // 직무 트리 데이터
  compTree: Object; // 역량 트리 데이터
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
      this.dataEndpoint = endpoint.split('/')[1] ?? '';
      const response = await $fetch('/api/ttm/tree', {
        method: 'GET',
        params: {
          type: endpoint,
        },
      });

      let data = response.data;

      // 트리 데이터가 없는 경우
      if (!data || data.length === 0) {
        data = {
            id: 'empty',
            name: 'No Data',
            type: 'EMPTY',
            children: []
        };
      } else if (data.length === 1) {
        // 단일 루트인 경우 그대로 반환
          data = data[0];
      } else {
        // 여러 루트가 있는 경우 가상 루트 생성
        data = {
          id: 'virtual-root',
          name: 'Root',
          type: 'ROOT',
          sortOrder: 0,
          depth: -1,
          metadata: {},
          children: data
        };
      }

      switch (endpoint) {
        case '/edu':
          this.eduTree = data;
          break;
        case '/job':
          this.jobTree = data;
          break;
        case '/comp':
          this.compTree = data;
          break;
      }
    }
  }
})
