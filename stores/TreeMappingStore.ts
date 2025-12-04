import { defineStore } from 'pinia'
import * as d3 from 'd3';

export const useMyTreeMappingStore = defineStore('treeMapping', {
  state: () => ({
    lines: [],
    currentSelectNode: null,
    currentSelectTreeId: '',
    loadingYn: false,
   }),
  actions: {
    async handleMappingSetting(node: any, treeId: string) {
      this.currentSelectNode = node;
      this.currentSelectTreeId = treeId;

      this.loadingYn = true;

      // 현재 클릭한 노드의 트리 인스턴스 조회
      const treeInstanceStore = useMyTreeInstanceStore();
      const treeType = treeId.split('-')[0];
      const currentTreeInstance: any = treeInstanceStore.$state[`Tree_${treeType}` as keyof typeof treeInstanceStore.$state];
      
      // 렌더러 인스턴스의 노드 요소 조회 콜백 호출 (선택 노드 조회)
      const nodeElement = currentTreeInstance.renderer.getNodeElement(node);

      // 선택 노드 요소에 선택 하이라이팅 효과 처리
      if (nodeElement) {
        d3.select(nodeElement).classed('node-selected', true);
      }
      
      try {
        this.loadingYn = false;
      } catch (error) {
        console.error(error);
      }
    }
  }
})
