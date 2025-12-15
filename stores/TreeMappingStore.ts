import { defineStore } from 'pinia'
import * as d3 from 'd3';
import { useRuntimeConfig } from '#app'; 

interface MappingStoreType {
  lines: LeaderLine[]; // leaderline 생성 연결 선 생성자 목록
  newLines: Map<string, LeaderLine>; // 새로운 맵핑 타겟 노드 연결 선 생성자 목록

  currentSelectNode: any; // 현재 맵핑버튼 클릭한 그룹 노드
  currentSelectTreeId: string; // 현재 클릭한 노드를 포함한 트리 ID
  currentMappingData: Map<string, any>; // 현재 맵핑버튼 클릭한 그룹 노드의 맵핑 데이터 캐싱
  newTargetNodeIdList: { id: string, type: string }[]; // 새로운 맵핑 타겟 노드 ID 목록
  loadingYn: boolean; // 맵핑 로딩 중 팝업 노출 여부
  toastifyYn: boolean; // 토스트 메시지 활성화 여부
  scheduledUpdate: boolean; // 스크롤 이벤트 스케줄링 관리 플래그
  targetNodeList: any[]; // 맵핑 타겟 노드 목록
  currentIntersectionObserver: IntersectionObserver | null; // 맵핑 타겟 노드 연결 선 그리기 인터섹션 옵저버
}

export const useMyTreeMappingStore = defineStore('treeMapping', {
  state: (): MappingStoreType => ({
    lines: [],
    newLines: new Map(),
    currentSelectNode: null,
    currentSelectTreeId: '',
    currentMappingData: new Map(),
    loadingYn: false,
    scheduledUpdate: false,
    targetNodeList: [],
    newTargetNodeIdList: [],
    currentIntersectionObserver: null,
    toastifyYn: false,
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

      // 2025.12.15[mhlim]: 검색 노드 선택 포커싱 효과 해제 처리
      d3.selectAll('.search-selected').classed('search-selected', false);

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

      // 현재 클릭한 노드와 맵핑 가능한 타겟 노드 타입 목록
      const possibleMappingTargets = {
        'KST': ["LEARNING_OBJECT", "DETAIL_LEARNING_OBJECT"],
        'BEHAVIORAL_INDICATOR': ["TASK"],
        'LEARNING_OBJECT': ["KST"],
        'DETAIL_LEARNING_OBJECT': ["KST"],
        'TASK': ["BEHAVIORAL_INDICATOR"],
      }
      
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
          .attr('transform', 'translate(375, -6)')

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
                  const mappingData = this.currentMappingData.get(node.data.id);
                  await this.drawConnections(node, treeId, mappingData);
              } else {
                this.lines.forEach((line: any) => line.remove());
                this.$state.lines = [];
              }
            })
          })

          // 2025.12.10[mhlim]: 현재 클릭 노드와 맵핑 가능한 유형 조회
          const possibleTypes = possibleMappingTargets[node.data.type as keyof typeof possibleMappingTargets];

          // 맵핑 가능한 유형 노드 요소 필터링 조회
          d3.selectAll('.node-group').filter((d: any) => possibleTypes.includes(d.data.type))
          .each(function() {
            // 체크버튼 생성
            const checkBoxGroup = d3.select(this).append('g')
            .attr('class', 'possible-mapping-target')
            .attr('cursor', 'pointer')
            // 맵핑 요소 추가하는 클릭 이벤트 헨들링
            .on('click', (event, d) => {
              const currentEl = this as HTMLElement;

              currentEl.classList.toggle('node-mapped-target');

              useMyTreeMappingStore().drawNewConnection(nodeElement, d);
            })

            
            checkBoxGroup.append('circle')
            .attr('r', '8')
            .attr('fill', '#fff')
            .attr('stroke', '#ccc')
            .attr('transform', 'translate(380, 3)')
            
            const checkIcon = checkBoxGroup.append('svg')
            .attr('width', 8)
            .attr('height', 8)
            .attr('transform', 'translate(376, -1)')
            .attr('viewBox', '0 0 71 50')

            checkIcon.append('path')
            .attr('d', 'M3.90246 19.9562C5.985 17.8736 9.2005 17.6135 11.5669 19.1736L12.5282 19.9562L31.4214 38.8494L32.2041 39.8107C33.7652 42.1773 33.5044 45.3922 31.4214 47.4752C29.3385 49.5581 26.1235 49.8189 23.757 48.2578L22.7957 47.4752L3.90246 28.5819L3.11985 27.6207C1.55977 25.2542 1.81992 22.0387 3.90246 19.9562Z')
            .attr('fill', '#D7D7D7')

            checkIcon.append('path')
            .attr('d', 'M60.6678 1.13959C63.034 -0.421506 66.2492 -0.159646 68.3323 1.9222C70.7132 4.30375 70.7138 8.167 68.3323 10.5479L32.2811 46.5906C29.8996 48.9715 26.0363 48.9721 23.6554 46.5906C21.2748 44.209 21.274 40.3457 23.6554 37.9648L59.715 1.9222L60.6678 1.13959Z')
            .attr('fill', '#D7D7D7')
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

      d3.selectAll('.possible-mapping-target').remove();
      
      this.currentSelectNode = null;
      this.currentSelectTreeId = '';
      this.currentMappingData.clear();
    },
    // 2025.12.05[mhlim]: 현재 클릭한 노드와 맵핑 타겟 노드들 연결 선 그리는 함수
    async drawConnections(sourceNode: any, sourceId: string, mappingData: any) {
      const treeInstanceStore = useMyTreeInstanceStore();
      const treeInstances = treeInstanceStore.$state;

      // 현재 타겟 트리의 렌더러 인스턴스 조회
      const sourceTreeInstance = treeInstances[sourceId.split('-')[0] as keyof typeof treeInstances] as any;

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
    // 2025.12.11 [mhlim]: 신규 맵핑 타겟 노드에 대한 
    // 신규 맵핑 leaderLine 선 & 데이터 관리
    async drawNewConnection(sourceNode: any, d: any) {
      const treeInstanceStore = useMyTreeInstanceStore();
      const treeInstances = treeInstanceStore.$state;

      // 새 연결 타겟 노드 조회
      let connectionTargetEl: any;
      
      // 모든 트리 인스턴스에서 타겟 노드 조회
      for(const [treeId, treeInstance] of Object.entries(treeInstances)) {
        const targetNode = treeInstance.renderer.findNodeByTypeAndId(d.data.type, d.data.id);
  
        if (targetNode) {
          connectionTargetEl = treeInstance.renderer.getNodeElement(targetNode);
          break;
        }
      }

      // 타겟노드 고유 아이디, 타입 값
      const nodeId = d.data.id;
      const nodeType = d.data.type;

      // 신규 맵핑 타겟 노드에 대한 leaderLine 조회
      const existLine = this.newLines.get(`${nodeType}-${nodeId}`);

      // 기존 존재하는 선 삭제 처리
      if (existLine) {
        try {
          existLine.remove();
        } catch (error) {
          console.warn('Failed to remove line', error);
        }

        // 신규 맵핑 타겟 노드에 대한 leaderLine 인스턴스 삭제
        this.newLines.delete(`${nodeType}-${nodeId}`);
        // 신규 맵핑 배열 타겟 노드 데이터 삭제 처리
        this.newTargetNodeIdList = this.newTargetNodeIdList.filter((item) => item.id !== nodeId);
        return;
      }
  
      if (import.meta.client) {
        const LeaderLine = await import('leader-line-new');
  
        // 현재 클릭한 노드와 맵핑 타겟 노드 연결 선 생성
        const line = new LeaderLine.default(
          sourceNode,
          connectionTargetEl,
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
          this.newLines.set(`${nodeType}-${nodeId}`, line);
          this.newTargetNodeIdList.push({
            id: nodeId,
            type: nodeType,
          });
      }

      this.currentIntersectionObserver?.observe(connectionTargetEl);
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

      this.newLines.forEach(line => {
        try {
          if (typeof line.position === 'function') {
            line.position();
          }
        } catch (error) {
          console.warn('Failed to update line position', error);
        }
      });
    },
    
    toastifyMessage(message: string) {
      if (this.toastifyYn) return;

      this.toastifyYn = true;

      alert(message);
      
      this.toastifyYn = false;
    }
  }
})
