import { defineStore } from 'pinia'
import * as d3 from 'd3';

interface TreeInstanceStateType {
  comp: {
    types: Set<string>;
    root: d3.HierarchyNode<any> | null;
    containerId: string | null;
    renderer: Object | null;
  },
  job: {
    types: Set<string>;
    root: d3.HierarchyNode<any> | null;
    containerId: string | null;
    renderer: Object | null;
  },
  edu: {
    types: Set<string>;
    root: d3.HierarchyNode<any> | null;
    containerId: string | null;
    renderer: Object | null;
  },
}

export const useMyTreeInstanceStore = defineStore('TreeInstance', {
  state: (): TreeInstanceStateType => ({ 
    comp: {
      types: new Set(), // 체크박스 필터 목록 상태관리 (중복 저장 필터링)
      root: null, // 트리 루트 노드
      containerId: '', // 트리 컨테이너 ID
      renderer: null, // 트리 렌더러 인스턴스
    }, // 역량체계 트리 정보 인스턴스
    job: {
      types: new Set(), // 체크박스 필터 목록 상태관리 (중복 저장 필터링)
      root: null, // 트리 루트 노드
      containerId: '', // 트리 컨테이너 ID
      renderer: null, // 트리 렌더러 인스턴스
    }, // 직무체계 트리 정보 인스턴스
    edu: {
      types: new Set(), // 체크박스 필터 목록 상태관리 (중복 저장 필터링)
      root: null, // 트리 루트 노드
      containerId: '', // 트리 컨테이너 ID
      renderer: null, // 트리 렌더러 인스턴스
    }, // 교육체계 트리 정보 인스턴스
  }),
  actions: {
    async fetchTreeDepthData(containerId: string) {
      const endpoint = containerId.split('-')[0];
      // -----트리 데이터 조회 엔드포인트에 따른 테스트 코드
      // (더미데이터이며, API 나올 시 구조에 따라 변경 예정)
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

      switch (containerId) {
        case 'edu-tree':
          this.edu.containerId = containerId;
          this.edu.root = treeData;
          break;
        case 'job-tree':
          this.job.containerId = containerId;
          this.job.root = treeData;
          break;
        case 'comp-tree':
          this.comp.containerId = containerId;
          this.comp.root = treeData;
          break;
      }

      // ---------------------------------------------------
    },
    // 현재 타겟 컨테이너 트리 내부 타입 조회 (Set 컬렉션 add 처리를 통한 중복 방지)
    async traverseTypeFilter(node: any, treeType: string) {
      if (node.data.type && node.data.type !== 'ROOT' && node.data.type !== 'EMPTY') {
          this[treeType as keyof TreeInstanceStateType].types.add(node.data.type);
      }
      if (node.children) {
          node.children.forEach((child: any) => this.traverseTypeFilter(child, treeType));
      }
      if (node._children) {
          node._children.forEach((child: any) => this.traverseTypeFilter(child, treeType));
      }
    },
    // 각 트리 컨테이너에서의 동적 트리 구조 변경에 따른
    // 기존 노드 업데이트 함수
    async nodeUpdate(source: any, containerId: string) {
      const treeType = containerId.split('-')[0];
      const currentTreeInstance: any = this.$state[treeType as keyof typeof this.$state];
      currentTreeInstance.renderer.update(currentTreeInstance.root, source);
    },
  }
})
