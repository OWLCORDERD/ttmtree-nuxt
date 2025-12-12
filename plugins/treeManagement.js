import { useMyTreeInstanceStore } from "~/stores/TreeInstanceStore";
import * as d3 from 'd3';
import { TTMTreeRenderer } from "~/components/common/customRenderer";

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

        // 각 타입별 노출 텍스트 설정
        types: {
            // 클릭 가능한 (매핑 지원) 노드 타입
            clickable: [
                'KST', // K/S/T
                'LEARNING_OBJECT', // 학습목표 
                'TASK', // TASK
                'COURSE', // 교육과정
                'BEHAVIORAL_INDICATOR', // 행동지표
                'COMPETENCY' // 역량
            ],

            // 맵핑 가능한 타입 목록
            mappingAvailableTypes: [
                'KST',
                'TASK',
                'LEARNING_OBJECT', // 학습목표
                'DETAIL_LEARNING_OBJECT', // 세부학습목표 
                'BEHAVIORAL_INDICATOR', // 행동지표
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
                'LESSON_GROUP': '교과목 그룹',
                'LEARNING_OBJECT': '학습목표',
                'DETAIL_LEARNING_OBJECT': '세부학습목표',
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

            // 현재 컨트롤러 호출한 컨테이너의 검색 필터 셋팅 & 트리 데이터 셋팅
            switch (containerId) {
                case 'comp-tree':
                    currentTreeRoot = treeInstanceStore.$state.comp.root;
                    await treeInstanceStore.traverseTypeFilter(currentTreeRoot, 'comp');
                    break;
                case 'job-tree':
                    currentTreeRoot = treeInstanceStore.$state.job.root;
                    await treeInstanceStore.traverseTypeFilter(currentTreeRoot, 'job');
                break;
                case 'edu-tree':
                    currentTreeRoot = treeInstanceStore.$state.edu.root;
                    await treeInstanceStore.traverseTypeFilter(currentTreeRoot, 'edu');
                    break;
            }

            // 2025.12.05[mhlim]: 현 컨테이너 트리 구조에서 
            // 특정 타입과 아이디에 해당하는 노드 조회 함수
            const findNodeByTypeAndId = (itemType, itemId) => {
                let foundNode = null;
        
                const search = (node) => {
                    if (node.data.type === itemType && node.data.id === itemId) {
                        foundNode = node;
                        return true;
                    }
        
                    if (node.children) {
                        for (const child of node.children) {
                            if (search(child)) return true;
                        }
                    }
        
                    if (node._children) {
                        for (const child of node._children) {
                            if (search(child)) return true;
                        }
                    }
        
                    return false;
                };
        
                search(currentTreeRoot);
                return foundNode;
            }

            // 2025.12.05[mhlim]: 맵핑 타겟 노드의 상위 부모 폴더들을 순회하여
            // 부모 폴더들 펼침 활성화하여 노드 업데이트하는 함수
            const expandNodePath = (targetNode) => {
                let needsUpdate = false;
                
                // Build path from root to target
                const path = [];
                let current = targetNode;
        
                while (current.parent) {
                    path.unshift(current.parent);
                    current = current.parent;
                }
            
                path.forEach(node => {
                    if (node._children) {
                        node.children = node._children;
                        node._children = null;
                        needsUpdate = true;
                    }
                });
        
                if (needsUpdate) {
                    treeInstanceStore.nodeUpdate(currentTreeRoot, containerId);
                }
        
                return needsUpdate;
            }

            // 렌더러 인스턴스 내부 이벤트 리스너 바인딩
            Renderer.getTypeDisplayName = getTypeDisplayName;
            Renderer.isClickableType = isClickableType;
            Renderer.findNodeByTypeAndId = findNodeByTypeAndId;
            Renderer.expandNodePath = expandNodePath;

            // 2025.12.01[mhlim]: 1. 현재 컨트롤러 생성자의 계층 구조 데이터 셋팅
            // 2. 현재 컨트롤러 생성자의 계층 구조 데이터들의 타입 조회
            switch (containerId) {
                case 'comp-tree':
                    treeInstanceStore.$state.comp.renderer = Renderer;
                    break;
                case 'job-tree':
                    treeInstanceStore.$state.job.renderer = Renderer;
                break;
                case 'edu-tree':
                    treeInstanceStore.$state.edu.renderer = Renderer;
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
            settingDepthBtnClickEvent(containerId);

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
    const settingDepthBtnClickEvent = (containerId) => {
        const container = document.querySelector(`#${containerId}`);
        const treePanel = container.closest('.tree-panel');
        // 뎁스 버튼 셋팅하려는 타겟 트리 컨테이너
        const root = treeInstanceStore.$state[containerId.split('-')[0]].root;

        // 뎁스 버튼 요소들 조회
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

                treeInstanceStore.nodeUpdate(root, containerId);
            })
        })

        const allDepthOpenButton = treePanel.querySelector('.open-all-depth');
        const allDepthCloseButton = treePanel.querySelector('.close-all-depth');

        allDepthOpenButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            expandAll(root);
            treeInstanceStore.nodeUpdate(root, containerId);
            treePanel.querySelectorAll('.depth-btn[data-depth]').forEach(button => {
                if (button.getAttribute('data-depth') === '5') {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });

            
        })

        allDepthCloseButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            expandToDepth(root, 1);
            treeInstanceStore.nodeUpdate(root, containerId);
            treePanel.querySelectorAll('.depth-btn[data-depth]').forEach(button => {
                if (button.getAttribute('data-depth') === '1') {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
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

    const collapseAll = (node) => {
        if (node.children) {
            node._children = node.children;
            node._children.forEach(child => collapseAll(child));
            node.children = null;
        }
    }

    return {
        provide: {
            ttmController: TTMController, // TTM 메인 컨트롤러 함수
            designConfig: designConfig, // 백터 그래픽 디자인 설정
            treeInstance: treeInstance, // 트리 컨테이너 인스턴스 배열
            typeDisplayName: getTypeDisplayName,
        }
    }
})
