import { useMyTreeInstanceStore } from "~/stores/TreeInstanceStore";
import { useMyTreeMappingStore } from "~/stores/TreeMappingStore";
import * as d3 from 'd3';
import { TTMTreeRenderer } from "~/components/customRenderer";

export default defineNuxtPlugin((nuxtApp) => {
    const isClient = typeof window !== 'undefined';
    // 서버 사이드에서는 작업 x
    if (!isClient) {
        return;
    }
    
    // 2025.11.26[mhlim]: TTM 트리 생성 컨테이너 인스턴스 배열
    const treeInstance = [
        {
            containerId: 'comp-tree',
            dataUrl: '/comp',
            label: '역량체계'
        },
        {
            containerId: 'job-tree',
            dataUrl: '/job',
            label: '직무체계'
        },
        {
            containerId: 'edu-tree',
            dataUrl: '/edu',
            label: '교육체계'
        }
    ];

    // 2025.11.26[mhlim]: TTM 트리 백터 그래픽 디자인 설정
    const designConfig = {
        tree: {
            indentSize: 30,          // 들여쓰기 크기 (px)
            nodeHeight: 40,          // 노드 높이 (px)
            duration: 300,           // 애니메이션 지속 시간 (ms)
            initialDepth: 1,         // 초기 펼침 depth
            margin: {
                left: 20,
                top: 20
            }
        },

        // TTM 트리 유저 인터페이스 설정
        ui: {
            loadingDelay: 350,       // 로딩 후 대기 시간 (ms)
            scrollDelay: 300,        // 스크롤 애니메이션 지연 (ms)
            typeTagOffset: {
                withToggle: 21,      // 토글 버튼이 있을 때 타입 태그 시작 위치
                withoutToggle: 5     // 토글 버튼이 없을 때 타입 태그 시작 위치
            },
            toggleRadius: 8,         // 토글 버튼 반지름 (px)
            rightInfoOffset: 450     // 오른쪽 정보 표시 위치 (px)
        },

        // 각 타입별 노출 텍스트 설정
        types: {
            // 클릭 가능한 (매핑 지원) 노드 타입
            clickable: [
                'KST',
                'LEARNING_OBJECT',
                'TASK',
                'COURSE',
                'BEHAVIORAL_INDICATOR',
                'COMPETENCY'
            ],

            // 타입 표시명 매핑
            displayNames: {
                'COMPETENCY': '역량',
                'BEHAVIORAL_INDICATOR': '행동지표',
                'JOB_FAMILY': '직계',
                'JOB_SERIES': '직렬',
                'JOB': '직무',
                'TASK': 'Task',
                'KST': 'K/S/T',
                'COURSE': '교육과정',
                'LESSON': '교과목',
                'LEARNING_OBJECT': '학습목표',
                'MODULE': '모듈'
            },

            // 교과목 학습유형 매핑
            lessonTypes: {
                'LECTURE': '강의',
                'PRACTICE': '실습',
                'DISCUSSION': '토의',
                'CASE_STUDY': '사례',
                'SIMULATOR': 'Sim-실습',
                'SELF_STUDY': '자기주도학습(Self-Study)',
                'DEPT_TRAINING': '부서 자체교육',
                'OJT': 'OJT',
                'E_LEARNING': '이러닝'
            }
        }
    };

    // 2025.11.26[mhlim]: 각 트리 인스턴스 상태관리 스토어
    const treeInstanceStore = useMyTreeInstanceStore();

    // 2025.11.26[mhlim]: TTM 메인 컨트롤러 함수
    const TTMController = async (containerId) => {
        // 현재 컨테이너에 대한 백터 그래픽 렌더링 생성자 인스턴스 생성
        const Renderer = new TTMTreeRenderer(containerId, designConfig);

        // 현재 트리 생성 대상자 컨테이너 DOM 요소 선택
        const container = d3.select(`#${containerId}`);

        // 컨테이너 내부 로딩 인디케이터 추가
        const loadingElement = container
        .append('div')
        .attr('class', 'loading-spinner')
        .text('트리 데이터 로딩 중...');

        // 백터 그래픽 렌더링 생성자 인스턴스 초기화
        Renderer.init();

        try {
            // 현재 트리 컨테이너에 대한 인스턴스 데이터
            let currentTreeRoot = null;

            // 트리 데이터 매니저 상태관리에 트리 데이터 조회 요청 
            await treeInstanceStore.fetchTreeDepthData(containerId);

            switch (containerId) {
                case 'comp-tree':
                    currentTreeRoot = treeInstanceStore.$state.Tree_competency.root;
                    await treeInstanceStore.traverseTypeFilter(currentTreeRoot, 'competency');
                    break;
                case 'job-tree':
                    currentTreeRoot = treeInstanceStore.$state.Tree_job.root;
                    await treeInstanceStore.traverseTypeFilter(currentTreeRoot, 'job');
                break;
                case 'edu-tree':
                    currentTreeRoot = treeInstanceStore.$state.Tree_edu.root;
                    await treeInstanceStore.traverseTypeFilter(currentTreeRoot, 'edu');
                    break;
            }

            // 현재 노드 데이터 구조 렌더러에서 변경사항 업데이트 시, 콜백 호출
            const nodeUpdate = (source) => {
                Renderer.update(currentTreeRoot, source);
            }

            // 각 트리 렌더러에서 생성된 맵핑 버튼 클릭 이벤트 콜백
            const handleMappingClick = (event, d) => {
                // 현재 클릭한 노드의 컨테이너 아이디값과 함께 상태관리 맵핑 셋팅 함수 호출
                useMyTreeMappingStore().handleMappingSetting(d, containerId);
            }

            // 렌더러 인스턴스 내부 이벤트 리스너 바인딩
            Renderer.getTypeDisplayName = getTypeDisplayName;
            Renderer.isClickableType = isClickableType;
            Renderer.nodeUpdate = nodeUpdate;
            Renderer.onMappingClick = handleMappingClick;

            // 2025.12.01[mhlim]: 1. 현재 컨트롤러 생성자의 계층 구조 데이터 셋팅
            // 2. 현재 컨트롤러 생성자의 계층 구조 데이터들의 타입 조회
            switch (containerId) {
                case 'comp-tree':
                    treeInstanceStore.$state.Tree_competency.renderer = Renderer;
                    break;
                case 'job-tree':
                    treeInstanceStore.$state.Tree_job.renderer = Renderer;
                break;
                case 'edu-tree':
                    treeInstanceStore.$state.Tree_edu.renderer = Renderer;
                    break;
            }

            if (currentTreeRoot.data.type === 'ROOT') {
                collapseFromDepth(currentTreeRoot, designConfig.tree.initialDepth);
            } else {
                collapseFromDepth(currentTreeRoot, designConfig.tree.initialDepth);
            }

            // 해당 트리 계층 데이터 구조로 업데이트
            Renderer.update(currentTreeRoot);

            // Remove loading indicator and show SVG
            loadingElement.remove();
            Renderer.show();

            requestAnimationFrame(() => {
                Renderer.recalculateTypeTagPositions();
            });

            // 뎁스 버튼 클릭 이벤트 셋팅
            settingDepthBtnClickEvent(containerId, currentTreeRoot);

        } catch (error) {
            loadingElement.remove();
            container
                .append('div')
                .attr('class', 'error')
                .text('데이터 로딩 실패: ' + error.message);
        }
    }

    // 해당 트리 아이템 노드가 클릭 가능한 타입인지 확인하는 헬퍼 함수
    const isClickableType = (type) => {
        return designConfig.types.clickable.includes(type);
    }

    // 2025.11.26[mhlim]: 타입 라벨 표시명 필터링 함수
    const getTypeDisplayName = (type, nodeData) => {
        // KST 타입일 경우 metadata의 kstType에 따라 K, S, T만 표시
        if (type === 'KST' && nodeData && nodeData.metadata && nodeData.metadata.kstType) {
            const kstTypeMap = {
                'KNOWLEDGE': 'K',
                'SKILL': 'S',
                'TOOL': 'T'
            };
            return kstTypeMap[nodeData.metadata.kstType] || designConfig.types.displayNames[type];
        }
        return designConfig.types.displayNames[type] || type;
    }

    // 2025.12.03[mhlim]: 각 트리 컨테이너 뎁스 버튼 클릭 이벤트 바인딩 셋팅
    const settingDepthBtnClickEvent = (containerId, root) => {
        const container = document.querySelector(`#${containerId}`);
        const treePanel = container.closest('.tree-panel');

        const depthButtons = treePanel.querySelectorAll('.depth-btn[data-depth]');

        depthButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const depth = parseInt(button.getAttribute('data-depth'));

                treePanel.querySelectorAll('.depth-btn[data-depth]').forEach(button => {
                    button.classList.remove('active');
                });
        
                e.target.classList.add('active');
        
                expandToDepth(root, depth);

                treeInstanceStore.nodeUpdate(root);
            })
        })

        const allDepthOpenButton = treePanel.querySelector('.open-all-depth');
        const allDepthCloseButton = treePanel.querySelector('.close-all-depth');

        allDepthOpenButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            expandAll(root);
            nodeUpdate(root);
        })

        allDepthCloseButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            collapseFromDepth(root, 1);
            nodeUpdate(root);
        })
    }
    
    // 2025.12.04[mhlim]: 첫 렌더링 시, 초기 트리 뎁스 값에 따라 펼침 셋팅
    const collapseFromDepth = (node, minDepth) => {
        if (node.children && node.depth >= minDepth) {
            node._children = node.children;
            node._children.forEach(child => collapseFromDepth(child, minDepth));
            node.children = null;
        } else if (node.children) {
            node.children.forEach(child => collapseFromDepth(child, minDepth));
        }
    }

    const expandToDepth = (node, targetDepth) => {
        // Special handling for virtual ROOT node
        if (node.data.type === 'ROOT') {
            // Always expand ROOT itself
            if (node._children) {
                node.children = node._children;
                node._children = null;
            }
            // Process children
            if (node.children) {
                node.children.forEach(child =>
                    expandToDepth(child, targetDepth, true)
                );
            }
            return;
        }

        // Check if root is virtual by traversing to root
        let root = node;
        while (root.parent) root = root.parent;
        const hasVirtualRoot = root.data.type === 'ROOT';

        // Calculate effective depth
        // - With virtual root: depth is already correct (ROOT=0, first level=1, etc.)
        // - Without virtual root: add 1 to match user expectation (first level depth 0 becomes user level 1)
        const effectiveDepth = hasVirtualRoot ? node.depth : node.depth + 1;

        if (effectiveDepth < targetDepth) {
            // Below target depth: expand this node
            if (node._children) {
                node.children = node._children;
                node._children = null;
            }
            // Continue recursing
            if (node.children) {
                node.children.forEach(child => expandToDepth(child, targetDepth));
            }
            if (node._children) {
                node._children.forEach(child => expandToDepth(child, targetDepth));
            }
        } else {
            // At or beyond target depth: collapse this node and all descendants
            if (node.children) {
                collapseAll(node);
            }
        }
    }

    const expandAll = (node) => {
        if (node._children) {
            node.children = node._children;
            node._children = null;
        }
        if (node.children) {
            node.children.forEach(child => expandAll(child));
        }
    }

    return {
        provide: {
            ttmController: TTMController, // TTM 메인 컨트롤러 함수
            designConfig: designConfig, // 백터 그래픽 디자인 설정
            treeInstance: treeInstance, // 트리 컨테이너 인스턴스 배열
        }
    }
})
