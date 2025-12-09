import { defineStore } from 'pinia'
import * as d3 from 'd3';
import { useRuntimeConfig } from '#app';

interface MappingStoreType {
  lines: LeaderLine[];
  currentSelectNode: any;
  currentSelectTreeId: string;
  currentMappingData: Map<string, any>;
  loadingYn: boolean;
  scheduledUpdate: boolean; // 스크롤 이벤트 스케줄링 관리 플래그
  targetNodeList: any[];
  currentIntersectionObserver: IntersectionObserver | null;
}

export const useMyTreeMappingStore = defineStore('treeMapping', {
  state: (): MappingStoreType => ({
    lines: [],
    currentSelectNode: null,
    currentSelectTreeId: '',
    currentMappingData: new Map(),
    loadingYn: false,
    scheduledUpdate: false,
    targetNodeList: [],
    currentIntersectionObserver: null,
   }),
  actions: {
    async handleMappingSetting(node: any, treeId: string) {
      if (this.currentSelectNode === node && this.currentSelectTreeId === treeId) {
        
        this.clearConnection();
        return;
      } else {
        this.currentIntersectionObserver?.disconnect();
      }

      this.clearConnection();

      // 현재 클릭한 노드의 트리 인스턴스 조회
      const treeInstanceStore = useMyTreeInstanceStore();
      const treeType = treeId.split('-')[0];
      // 트리 인스턴스 상태관리에서 현재 트리 인스턴스 조회
      const currentTreeInstance: any = treeInstanceStore.$state[treeType as keyof typeof treeInstanceStore.$state];
      
      // 렌더러 인스턴스의 노드 요소 조회 콜백 호출 (선택 노드 조회)
      const nodeElement = currentTreeInstance.renderer.getNodeElement(node);

      this.currentSelectNode = node;
      this.currentSelectTreeId = treeId;

      this.loadingYn = true;
      
      // 선택 노드 요소에 선택 하이라이팅 효과 처리
      if (nodeElement) {
          d3.select(nodeElement).classed('node-selected', true);

          // 맵핑 클릭 아이템 영역 > 활성화 아이콘 추가
          const svg = d3.select(nodeElement)
          .append('svg')
          .attr('class', 'mapping-selected-icon')
          .attr('width', 20)
          .attr('height', 20)
          .attr('viewBox', '0 0 22 23')
          .attr('transform', 'translate(435, -6)')

          svg.append('path')
          .attr('d', 'M4.99705 0.67551C10.4285 6.08815 15.8862 1.71546 21.3177 7.1281C15.8762 5.89434 10.405 14.4516 4.96347 13.2178C4.97234 9.03435 4.98703 4.85439 4.99589 0.670929L4.99705 0.67551Z')
          .attr('fill', '#F83F83')

          svg.append('path')
          .attr('d', 'M3.80762 0C4.54556 -3.23739e-08 5.14453 0.575387 5.14453 1.28516V19.125C6.74744 19.3143 7.90991 19.8764 7.91016 20.54C7.91016 21.3592 6.13937 22.0234 3.95508 22.0234C1.77076 22.0234 0 21.3592 0 20.54C0.000231038 19.9177 1.02259 19.386 2.47168 19.166V1.28516C2.47168 0.575541 3.06989 0.000248274 3.80762 0Z')
          .attr('fill', '#3C3C3C') 
      
        try {
          if (!this.currentMappingData.has(node.data.id)) {
            const mappingData = await this.fetchMappingData(node.data.id, node.data.type);

            await this.drawConnections(node, treeId, mappingData);
            this.currentMappingData.set(node.data.id, mappingData);
          }

          this.currentIntersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(async (entry) => {
              if(entry.isIntersecting) {
                console.log('entry', entry);
                  const mappingData = this.currentMappingData.get(node.data.id);
                  await this.drawConnections(node, treeId, mappingData);
              } else {
                this.lines.forEach((line: any) => line.remove());
                this.$state.lines = [];
              }
            })
          })

          this.currentIntersectionObserver?.observe(nodeElement);

          const currentIntersectionObserver = this.currentIntersectionObserver;

          d3.selectAll('.node-mapped-target').each(function() {
            currentIntersectionObserver?.observe(this as Element);
          })

        } catch (error) {
          console.error(error);
        } finally {
          this.loadingYn = false;
        }
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

      d3.selectAll('.mapping-selected-icon').remove();
      
      this.currentSelectNode = null;
      this.currentSelectTreeId = '';
      this.currentMappingData.clear();
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

      targetsToExpand.forEach(target => {
        this.targetNodeList.push(target.node);
      });

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

        if (firstTarget) {
          firstTarget.tree.renderer.scrollToNode(firstTarget.node);
        }
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
