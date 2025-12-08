import { defineStore } from 'pinia'
import * as d3 from 'd3';
import { useRuntimeConfig } from '#app';

interface MappingStoreType {
  lines: LeaderLine[];
  currentSelectNode: any;
  currentSelectTreeId: string;
  loadingYn: boolean;
  scheduledUpdate: boolean; // 스크롤 이벤트 스케줄링 관리 플래그
}

export const useMyTreeMappingStore = defineStore('treeMapping', {
  state: (): MappingStoreType => ({
    lines: [],
    currentSelectNode: null,
    currentSelectTreeId: '',
    loadingYn: false,
    scheduledUpdate: false,
   }),
  actions: {
    async handleMappingSetting(node: any, treeId: string) {
      if (this.currentSelectNode === node && this.currentSelectTreeId === treeId) {
        
        this.clearConnection();
        return;
      }

      this.clearConnection();

      this.currentSelectNode = node;
      this.currentSelectTreeId = treeId;

      this.loadingYn = true;

      // 현재 클릭한 노드의 트리 인스턴스 조회
      const treeInstanceStore = useMyTreeInstanceStore();
      const treeType = treeId.split('-')[0];
      // 트리 인스턴스 상태관리에서 현재 트리 인스턴스 조회
      const currentTreeInstance: any = treeInstanceStore.$state[treeType as keyof typeof treeInstanceStore.$state];
      
      // 렌더러 인스턴스의 노드 요소 조회 콜백 호출 (선택 노드 조회)
      const nodeElement = currentTreeInstance.renderer.getNodeElement(node);

      // 선택 노드 요소에 선택 하이라이팅 효과 처리
      if (nodeElement) {
        d3.select(nodeElement).classed('node-selected', true);
      }
      
      try {
        const mappingData = await this.fetchMappingData(node.data.id, node.data.type);
        
        await this.drawConnections(node, treeId, mappingData);
        this.loadingYn = false;
      } catch (error) {
        console.error(error);
      }
    },
    async fetchMappingData(nodeId: string, nodeType: string) {
      // 트리 매핑 데이터 조회 전, API 엔드포인트 추출
      const config = useRuntimeConfig();
      const baseUrl = config.public.apiBaseUrl;

      try {
        // 클릭 노드와 맵핑된 아이템 데이터 조회
        const response: any = await $fetch(`${baseUrl}/mappings/${nodeType}/${nodeId}`);

        if (!response.success || !response.data) {
          throw new Error('현재 클릭한 노드에 대한 트리 매핑 데이터가 없습니다.');
        }

        return response.data;
      } catch (error) {
        throw new Error('트리 매핑 데이터 조회 실패');
      }
    },
    clearConnection() {
      this.lines.forEach((line: any) => line.remove());
      this.$state.lines = [];
      d3.selectAll('.node-selected').classed('node-selected', false);

      d3.selectAll('.node-mapped-target').classed('node-mapped-target', false);

      this.currentSelectNode = null;
      this.currentSelectTreeId = '';
    },
    // 2025.12.05[mhlim]: 현재 클릭한 노드와 맵핑 타겟 노드들 연결 선 그리는 함수
    async drawConnections(sourceNode: any, sourceId: string, mappingData: any) {
      const treeInstanceStore = useMyTreeInstanceStore();
      const treeInstances = treeInstanceStore.$state;

      // 현재 타겟 트리의 렌더러 인스턴스 조회
      const sourceTreeInstance = treeInstances[sourceId.split('-')[0] as keyof typeof treeInstances];

      const sourceRenderer = sourceTreeInstance.renderer as any;
      // 현재 클릭한 노드의 렌더러 인스턴스에서 노드 요소 조회
      const sourceNodeElement = sourceRenderer.getNodeElement(sourceNode);

      const targetsToExpand = [];
      let firstTarget = null;

      for (const mapping of mappingData) {
        for(const [treeId, treeInstance] of Object.entries(treeInstances)) {
          if (treeId === sourceId) continue;
  
          const targetNode = treeInstance.renderer.findNodeByTypeAndId(mapping.itemType, mapping.id);

          if (targetNode) {
            targetsToExpand.push({ node: targetNode, tree: treeInstance, treeId });
            if (!firstTarget) firstTarget = { node: targetNode, tree: treeInstance, treeId };
            break;
          }
        }
      }

      if (targetsToExpand.length > 0) {
        const treeToUpdate = new Set();
        for (const { node, tree } of targetsToExpand) {
          const needsUpdate = tree.renderer.expandNodePath(node);
          if (needsUpdate) {
            treeToUpdate.add(tree);
          }
        }
      }

      if (!sourceNodeElement) {
        console.warn('sourceNodeElement not found');
        return;
      }

      // 맵핑 타겟 노드 순회 연결 선 생성 처리
      for (const { node: targetNode, tree: targetTree, treeId: targetTreeId } of targetsToExpand) {
        const targetElement = targetTree.renderer.getNodeElement(targetNode);

        if (!targetElement) {
          console.warn('targetElement not found');
          continue;
        }

        // 2025.12.05[mhlim]: 서버 사이드단 import 에러로 인한
        // 클라이언트 사이드 import 선언 처리
        if (import.meta.client) {
          const LeaderLine = await import('leader-line-new');

          // 현재 클릭한 노드와 맵핑 타겟 노드 연결 선 생성
          const line = new LeaderLine.default(
            sourceNodeElement,
            targetElement,
            {
              color: 'var(--color-selected-border)',
              size: 2,
              dash: false,
              endPlug: 'behind',
              startPlug: 'behind',
              path: 'grid',
              startSocketGravity: [0, 0],
              endSocketGravity: [0, 0],
            }
          );

          // 연결 선 인스턴스 상태관리 배열에 추가
          this.lines.push(line);

          // 맵핑 타겟 노드에 맵핑 타겟 클래스 추가
          d3.select(targetElement).classed('node-mapped-target', true);
        }

        // 맵핑 선 생성 이후 트리 컨테이너마다 스크롤 이벤트 부여
        this.registerScrollListener();
      }
    },
    registerScrollListener() {
      const treeContainer = document.querySelectorAll('.tree');

      treeContainer.forEach(container => {
        const listener = () => this.schedulePositionUpdate();
        container.addEventListener('scroll', listener, { passive: true });
      })
    },
    schedulePositionUpdate() {
      if (this.scheduledUpdate) return;

      this.scheduledUpdate = true;

      nextTick(() => {
        this.updateLinePositions();
        this.scheduledUpdate = false;
      })
    },
    updateLinePositions() {
      if (this.lines.length === 0) return;

      this.lines.forEach(line => {
        try {
          if (typeof line.position === 'function') {
            line.position();
          }
        } catch (error) {
          console.warn('Failed to update line position', error);
        }
      });
    }
  }
})
