import { useMyTTMDataManagerStore } from "~/stores/TTMDataManager";
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
            checkboxContainerId: 'comp-checkboxes',
            label: '역량체계'
        },
        {
            containerId: 'job-tree',
            dataUrl: '/job',
            checkboxContainerId: 'job-checkboxes',
            label: '직무체계'
        },
        {
            containerId: 'edu-tree',
            dataUrl: '/edu',
            checkboxContainerId: 'edu-checkboxes',
            label: '교육체계'
        }
    ];

    // 2025.11.26[mhlim]: TTM 트리 백터 그래픽 디자인 설정
    const designConfig = {
        tree: {
            indentSize: 30,          // 들여쓰기 크기 (px)
            nodeHeight: 30,          // 노드 높이 (px)
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

    // 2025.11.26[mhlim]: 트리 데이터 상태관리 매니저
    const dataManager = useMyTTMDataManagerStore();

    // Helper function to check if type is clickable
    const isClickableType = (type) => {
        return designConfig.types.clickable.includes(type);
    }

    // Helper function to get API URL for mappings
    // const getMappingApiUrl = (itemType, itemId) => {
    //     return `${CONFIG.api.baseUrl}${CONFIG.api.endpoints.mappings}/${itemType}/${itemId}`;
    // }

    // 2025.11.26[mhlim]: TTM 메인 컨트롤러 함수
    const TTMController = async (containerId, dataUrl, checkboxContainerId) => {
        // 백터 그래픽 렌더링 생성자 인스턴스 생성
        const Renderer = new TTMTreeRenderer(containerId, designConfig);

        // 렌더러 인스턴스 내부 이벤트 리스너 바인딩
        Renderer.getTypeDisplayName = getTypeDisplayName;
        Renderer.isClickableType = isClickableType;

        // 현재 트리 생성 대상자 컨테이너 선택
        const container = d3.select(`#${containerId}`);

        // 컨테이너 내부 로딩 인디케이터 추가
        const loadingElement = container
        .append('div')
        .attr('class', 'loading-spinner')
        .text('트리 데이터 로딩 중...');

        // 백터 그래픽 렌더링 생성자 인스턴스 초기화
        Renderer.init();

        try {
            // 현재 트리 유형 데이터 조회 이후 d3 트리 계층 데이터 구조화
            const root = await getD3HierarchyData(dataUrl, checkboxContainerId);

            // 해당 트리 계층 데이터 구조로 업데이트
            Renderer.update(root);

            // Remove loading indicator and show SVG
            loadingElement.remove();
            Renderer.show();

            requestAnimationFrame(() => {
                Renderer.recalculateTypeTagPositions();
            });
        } catch (error) {
            loadingElement.remove();
            container
                .append('div')
                .attr('class', 'error')
                .text('데이터 로딩 실패: ' + error.message);
        }
    }

    // 2025.11.26[mhlim]: TTM 트리 데이터 조회 (d3 계층 구조화 + 타입 체크박스 생성) 함수
    const getD3HierarchyData = async (dataUrl, checkboxContainerId) => {
        // 현재 컨테이너에 해당하는 트리 데이터 조회
        await dataManager.fetchTreeDepth(dataUrl);

        // 트리 데이터 > d3 계층 구조 데이터 변환
        let currentD3Node;

        switch(dataUrl) {
            case '/edu':
                currentD3Node = d3.hierarchy(dataManager.$state.eduTree);
                break;
            case '/job':
                currentD3Node = d3.hierarchy(dataManager.$state.jobTree);
                break;
            case '/comp':
                currentD3Node = d3.hierarchy(dataManager.$state.compTree);
        }

        // 각 트리 컨테이너에 맞는  구조 타입별 체크박스 생성
        createTypeCheckboxes(currentD3Node, checkboxContainerId);

        return currentD3Node;
    }

    // 2025.11.26[mhlim]: 현재 타겟 컨테이너 트리 > 필터 체크박스 생성 함수
    const createTypeCheckboxes = (currentD3Node, checkboxContainerId) => {
        const types = new Set();

        // 현재 타겟 컨테이너 트리 내부 타입 조회
        const traverse = (node) => {
            if (node.data.type && node.data.type !== 'ROOT' && node.data.type !== 'EMPTY') {
                types.add(node.data.type);
            }
            if (node.children) {
                node.children.forEach(traverse);
            }
            if (node._children) {
                node._children.forEach(traverse);
            }
        }

        traverse(currentD3Node);

        const container = d3.select(`#${checkboxContainerId}`);
        container.selectAll('*').remove(); // Clear existing

        types.forEach(type => {
            const label = container.append('label')
                .attr('class', 'type-checkbox');

            label.append('input')
                .attr('type', 'checkbox')
                .attr('checked', true)
                .attr('value', type);

            label.append('span')
                .text(getTypeDisplayName(type));
        });
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

    return {
        provide: {
            ttmController: TTMController,
            treeInstance: treeInstance,
            designConfig: designConfig,
        }
    }
})
