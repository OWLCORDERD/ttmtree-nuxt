import * as d3 from 'd3';
import { useMyDetailModalStore } from '~/stores/detailModalStore';
import { useMyTreeInstanceStore } from '~/stores/TreeInstanceStore';
/**
 * TreeRenderer
 * D3.js 활용한 트리 백터 그래픽 렌더링 담당
 */

export class TTMTreeRenderer {
    constructor(containerId, config) {
        this.containerId = containerId;
        this.designConfig = config;
        this.duration = this.designConfig.tree.duration;
        this.indentSize = this.designConfig.tree.indentSize;
        this.nodeHeight = this.designConfig.tree.nodeHeight;
        this.svg = null;
        this.g = null;
        this.onNodeClick = null; // Callback for node click (detail modal)
        this.getTypeDisplayName = null;
        this.isClickableType = null;
    }

    /**
     * Initialize SVG and container
     * @param {Function} onReady - Callback when ready
     */
    init(onReady) {
        const container = d3.select(`#${this.containerId}`);

        // Create SVG
        this.svg = container
            .append('svg')
            .attr('width', '100%')
            .attr('class', `${this.containerId}-drawing`)
            .style('display', 'none'); // Hide until data is loaded
        // Create group with margin
        this.g = this.svg.append('g')
            .attr('transform', `translate(0, ${this.designConfig.tree.margin.top})`);

        if (onReady) {
            onReady();
        }
    }

    /**
     * Show SVG after data is loaded
     */
    show() {
        if (this.svg) {
            this.svg.style('display', 'block');
        }
    }

    /**
     * 2025.12.18[mhlim]: 노드 그룹 내부 타입 태그 및 제목 위치 조정
     @param {boolean} editMode - 편집 모드 여부
    */
    recalculateTypeTagPositions(editMode) {
        // 과정구성 편집모드 > 교육체계 트리 노드 그룹 위치 조정
        if (editMode) {
            // 교육체계 트리 노드 그룹 중 드래그 버튼 포함된 노드 필터링
            const nodeGroup = this.g.selectAll('.node-group').filter(function() {
                return d3.select(this).select('.drag-handle-btn').node() !== null;
            });

            // 모든 요소 내부 타입 태그 & 제목 텍스트 위치 조정
            nodeGroup.each(function() {
                const typeTagStartX = 60;

                d3.select(this).select('.type-tag')
                .attr('transform', `translate(${typeTagStartX}, 0)`);

                // Recalculate text width
                const textElement = d3.select(this).select('text').node();

                if (textElement) {
                    const textWidth = textElement.getComputedTextLength();
                    const rectWidth = textWidth + 20;
                    d3.select(this).select('.type-tag')
                    .select('rect').attr('width', rectWidth);

                    const currentDepth = d3.select(this).datum().depth;
                    // Update node name position
                    const nodeNameElement = d3.select(this).select('.node-name');
                    nodeNameElement.attr('x', typeTagStartX + rectWidth + 5);
                    const nodeNameGroup = d3.select(this).select('.node-name-group')

                    // 제목 노드 요소에 foreignObject 영역 추가
                    const foriegnObject = nodeNameGroup.append('foreignObject')
                    .attr('width', `calc(205px - (${25 * currentDepth}px))`)
                    .attr('height', 30)
                    .attr('x', 0)
                    .attr('y', -12)
                    .style('display', 'none')
                    .attr('class', 'node-name-input-group')

                    // 1뎁스 노드들의 타입 도형 크기 추적에 문제 발생
                    // -> 항목명 수정 input 노드 위치 조정 예외 처리
                    if (currentDepth <= 1) {
                        foriegnObject.attr('transform', `translate(${typeTagStartX + rectWidth + 60}, 0)`);
                    } else {
                        foriegnObject.attr('transform', `translate(${typeTagStartX + rectWidth + 5}, 0)`);
                    }
            
                    // 제목명 수정 input 노드 추가
                    foriegnObject.append('xhtml:input')
                    .attr('type', 'text')
                    .attr('class', 'node-name-input')
                    .style('width', '100%')
                    .style('height', '100%')
                    .on('blur', function(event, d) {
                        // 포커스 아웃 시 텍스트로 복원
                        const newValue = this.value.trim();
                        if (newValue && newValue !== d.data.name) {
                            d.data.name = newValue;
                            // 트리 업데이트
                            useMyTreeInstanceStore().nodeUpdate(d, this.containerId);
                        }

                        // foreignObject 숨기고 text 노출 처리
                        d3.select(this.closest('foreignObject'))
                            .style('display', 'none');
                        d3.select(this.closest('.node-name-group'))
                            .select('.node-name')
                            .style('display', 'block')
                            .text(d => d.data.name);
                    })
                    .on('keydown', function(event) {
                        if (event.key === 'Enter') {
                            this.blur(); // Enter 키로 포커스 아웃 처리
                        } else if (event.key === 'Escape') {
                            // Escape 키로 취소
                            const nodeData = d3.select(this).datum();
                            this.value = nodeData.data.name;
                            this.blur();
                        }
                        event.stopPropagation();
                    });
                }
            });
        } else {
            this.g.selectAll('.type-tag').each(function(d) {
                const typeTagStartX = 50;
    
                // Update type tag position
                d3.select(this).attr('transform', `translate(${typeTagStartX}, 0)`);
    
                // Recalculate text width
                const textElement = this.querySelector('text');
    
                if (textElement) {
                    const textWidth = textElement.getComputedTextLength();
                    const rectWidth = textWidth + 20;
                    d3.select(this).select('rect').attr('width', rectWidth);
    
                    // Update node name position
                    const nodeNameElement = d3.select(this.parentNode).select('.node-name');
                    nodeNameElement.attr('x', typeTagStartX + rectWidth + 5);
                }
            });
        }
    }

    /**
     * Update tree visualization
     * @param {Object} root - D3 hierarchy root
     * @param {Object} source - Source node for transition
     */
    update(root, source) {
        // 현재 상태관리에 저장된 트리 인스턴스 조회
        const treeInstance = useMyTreeInstanceStore().$state;
        // 현재 전역 선택 역량분류 조회
        const classificationType = treeInstance.classificationType;
        // 2025.12.15[mhlim]: 역량분류: 리더십 & 공통 역량
        // -> 직무체계 트리 맵핑 비활성화 화면 생성 & 트리 노드 생성 중단
        if (classificationType === 'LEADERSHIP'
            || classificationType === 'COMMON') {
            if (root === treeInstance.job.root) {
                const duplicateNodeCheck = d3.selectAll('.none-mapping-container').nodes();

                if (duplicateNodeCheck.length <= 0) {
                    this.svg.remove(); // 직무체계 트리 생성 도면 제거
                    const noneMappingEl = d3.select('#job-tree') // 직무체계 트리 컨테이너 선택
                    .append('div')
                    .attr('class', 'none-mapping-container')
                    .on('click', (e) => {
                        e.preventDefault();
    
                        useMyTreeMappingStore().toastifyMessage('리더십/공통 역량은 직무체계와 매핑하지 않습니다.')
                    });
    
                    noneMappingEl.append('div')
                    .attr('class', 'mapping-icon')
                    .attr('width', 92)
                    .attr('height', 58)
                    .append('div')
                    .attr('class', 'icon')
    
                    noneMappingEl.append('div')
                    .attr('class', 'content')
                    .html(`리더십/공통 역량은 <br/>
                        직무체계와 매핑하지 않습니다.`);
    
                    return;
                }
            }
        // 2025.12.15[mhlim]: 역량분류: 수탁/컨소시엄 역량
        // -> 직무체계 & 역량체계 트리 맵핑 비활성화 화면 생성 & 트리 노드 생성 중단
        } else if (classificationType === 'CONSIGNMENT') {
            if (root === treeInstance.job.root
                || root === treeInstance.comp.root) {
            const treeContainer = root === treeInstance.job.root ? 'job-tree' : 'comp-tree';
                this.svg.remove(); // 트리 생성 도면 제거
                const noneMappingEl = d3.select(`#${treeContainer}`) // 직무,역량체계 트리 컨테이너 선택
                .append('div')
                .attr('class', 'none-mapping-container')
                .on('click', (e) => {
                    e.preventDefault();
                    if (root === treeInstance.job.root) {
                        useMyTreeMappingStore().toastifyMessage('직무체계는 수탁 역량과 매핑하지 않습니다.');
                    } else if (root === treeInstance.comp.root) {
                        useMyTreeMappingStore().toastifyMessage('역량체계는 수탁 역량과 매핑하지 않습니다.');
                    }
                });

                noneMappingEl.append('div')
                .attr('class', 'mapping-icon')
                .attr('width', 92)
                .attr('height', 58)
                .append('div')
                .attr('class', 'icon')

                noneMappingEl.append('div')
                .attr('class', 'content')
                .html(`수탁 역량은 <br/>
                    직무체계와 매핑하지 않습니다.`);

                return;
            }
        }
        // Flatten the tree
        let nodes = root.descendants();

        // Filter out virtual ROOT node if present
        if (root.data.type === 'ROOT') {
            nodes = nodes.filter(d => d.data.type !== 'ROOT');
        }

        // Compute height based on visible nodes
        const visibleNodes = nodes.filter(d => {
            let parent = d.parent;
            while (parent) {
                if (!parent.children) return false;
                parent = parent.parent;
            }
            return true;
        });

        const height = Math.max(500, visibleNodes.length * this.nodeHeight + 60);
        this.svg.attr('height', height);

        // Assign y position based on order
        let index = 0;
        root.eachBefore(d => {
            // Skip virtual ROOT
            if (root.data.type === 'ROOT' && d.data.type === 'ROOT') {
                d.x = -1000; // Off-screen
                d.y = 0;
            } else {
                d.x = index++ * this.nodeHeight;
                // Adjust depth for virtual ROOT children
                if (root.data.type === 'ROOT') {
                    d.y = (d.depth - 1) * this.indentSize;
                } else {
                    d.y = d.depth * this.indentSize;
                }
            }
        });

        // Update nodes
        const node = this.g.selectAll('.node-group')
            .data(nodes, d => d.id || (d.id = d.data.type + '-' + d.data.id));
``
        // Enter new nodes
        const nodeEnter = this.createNodeEnter(node);

        // Update existing nodes
        this.updateNodes(node.merge(nodeEnter));

        // Remove exiting nodes
        node.exit().transition()
            .style('opacity', 0)
            .remove();

        // 2025.12.18[mhlim]:
        // 과정구성 편집모드 > 토글, 맵핑, 드래그 이벤트 호출 시점
        if (useMyTreeInstanceStore().$state.currentMode === 'edit') {
            // 업데이트된 트리 노드 그룹에 대한 드래그 핸들링 요소 및 이벤트 추가
            this.setupEditModeNodes();
            // 드래그 버튼 고려한 타입 / 제목 위치 조정
            this.recalculateTypeTagPositions(true);
        } else {
            this.recalculateTypeTagPositions();
        }
    }

    // 2025.12.17[mhlim]: 교욱체계 트리 > 노드 그룹 요소
    // 드래그 드롭 버튼 및 케밥(토글) 버튼 추가 메소드
    setupEditModeNodes() {
        // 전체 트리 그룹 노드 중에서 교육체계 관련 유형 노드 필터링
        const nodeGroup = this.g.selectAll('.node-group').filter((d) => d.data.type === 'COURSE'
        || d.data.type === 'LESSON' || 
        d.data.type === 'LESSON_GROUP' ||
         d.data.type === 'LEARNING_OBJECT' || 
         d.data.type === 'DETAIL_LEARNING_OBJECT');

        if (nodeGroup.empty()) return;

        // 2025.12.18[mhlim]: 교육체계 트리의 그룹 노드마다 드래그 드롭 버튼 및 케밥(토글) 요소 생성
        nodeGroup.each(function() {
            const renderer = useMyTreeInstanceStore().$state.edu.renderer;
            if (!renderer) return;

            renderer.createDragDropRenderer(this, nodeGroup);
            renderer.createKebobRenderer(this, nodeGroup);
        });
    }

    /**
     * Create entering nodes
     * @param {Selection} node - D3 selection
     * @returns {Selection} Node enter selection
     */
    createNodeEnter(node) {
        const nodeEnter = node.enter().append('g')
            .attr('class', d => {
                let classes = `node-group type-${d.data.type}`;
                if (this.isClickableType(d.data.type)) {
                    classes += ' node-clickable';
                }
                return classes;
            })
            .attr('transform', d => `translate(0,${d.x})`)
            .style('opacity', 0);

        // Background box for hover effect
        nodeEnter.append('rect')
            .attr('class', 'node-bg')
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('x', 3)
            .attr('y', -this.nodeHeight / 2 + 3)
            .attr('width', 'calc(100% - 6px)')
            .attr('height', this.nodeHeight)
            .attr('fill', 'transparent')
            .on('mouseenter', function() {
                d3.select(this).attr('fill', '#f5f5f5');
            })
            .on('mouseleave', function() {
                d3.select(this).attr('fill', 'transparent');
            });

        // Node content group
        const nodeContent = nodeEnter.append('g')
            .attr('class', 'node-content')
            .attr('transform', d => `translate(${d.y}, 0)`);

        // 하위 뎁스 펼침/닫기 토글 버튼 생성
        this.createToggleButton(nodeContent);

        // 각 노드 타입 태그 생성
        this.createTypeTag(nodeContent);

        // 각 트리 아이템 노드 제목 생성
        this.createNodeName(nodeContent);

        // 각 트리 아이템 노드 우측 맵핑 정보 생성
        this.createRightInfo(nodeEnter);

        // Tooltip
        nodeEnter.append('title')
            .text(d => `${d.data.type}: ${d.data.name}`);

        
        this.ellipsisNodeName(nodeEnter);

        return nodeEnter;
    }

    /**
     * Create toggle button
     * @param {Selection} nodeContent - Node content group
     */
    createToggleButton(nodeContent) {
        const toggleGroup = nodeContent.append('g')
            .attr('class', 'toggle-btn')
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                if (this.onToggleClick) {
                    if (d.children?.length > 0 || d._children?.length > 0) {
                        this.onToggleClick(event, d);
                    }
                }
            });

        const circle = toggleGroup.append('circle')
            .attr('r', 8)
            .attr('cx', 30)
            .attr('cy', 2)
            .attr('class', d => d.children ? 'toggle-open' : 'toggle-closed');

        toggleGroup.append('path')
            .attr('x', 30)
            .attr('y', 0)
            .attr('fill', '#fff')
    }

    /**
     * Create type tag
     * @param {Selection} nodeContent - Node content group
     */
    createTypeTag(nodeContent) {
        const typeTag = nodeContent.append('g')
            .attr('class', 'type-tag')
            .attr('transform', d => {
                const hasToggle = d.data.children && d.data.children.length > 0;
                const xPos = hasToggle ? 21 : 20;
                return `translate(${xPos}, 0)`;
            });

        typeTag.append('rect')
            .attr('x', 0)
            .attr('y', -8)
            .attr('rx', 10)
            .attr('ry', 10)
            .attr('height', 22)
            .attr('class', 'type-tag-bg');

        typeTag.append('text')
            .attr('x', 10)
            .attr('y', 8)
            .style('font-size', '14px')
            .style('fill', '#0065CD')
            .text(d => this.getTypeDisplayName(d.data.type, d.data));

            if (useMyTreeInstanceStore().$state.currentMode === 'edit') {
                this.recalculateTypeTagPositions(true);
            } else {
                this.recalculateTypeTagPositions();
            }
    }

    /**
     * Create node name text
     * @param {Selection} nodeContent - Node content group
     */
    createNodeName(nodeContent) {
        const nodeGroup = nodeContent.append('g')
        .attr('class', 'node-name-group')
        
        // 체계 제목명 일반 텍스트 노드
        const textNode = nodeGroup.append('text')
            .attr('class', 'node-name')
            .attr('x', 100) // Temporary, will be adjusted
            .attr('y', 7)
            .style('cursor', 'pointer')
            .style('overflow', 'hidden')
            .text(d => d.data.name)
            .on('click', (event, d) => {
                // Node name click shows detail modal for all types
                event.stopPropagation();
                useMyDetailModalStore().currentDetailModalShow(d);
        });
    }
 
    /**
     * Create right info section
     * @param {Selection} nodeEnter - Node enter selection
     */
    createRightInfo(nodeEnter) {
        const rightInfo = nodeEnter.append('g')
            .attr('class', 'right-info')
            .attr('transform', `translate(380, 0)`)
            .style('display', (d) => (this.isClickableType(d.data.type) ? 'block' : 'none'));

        rightInfo.append('rect')
        .attr('class', 'mapping-button')
        .attr('cursor', 'pointer')
        .on('click', (event, d) => {
            if (this.isClickableType(d.data.type) && this.designConfig.types.mappingAvailableTypes.includes(d.data.type)) {
                event.stopPropagation();
                useMyTreeMappingStore().handleMappingSetting(d, this.containerId);
            } else {
                event.stopPropagation();
                useMyTreeMappingStore().toastifyMessage('맵핑 가능한 타입이 아닙니다.');
            }
        })

        // SVG image 요소 사용 (foreignObject 대신)
        const mappingIcon = rightInfo.append('svg')
        .attr('x', 18)
        .attr('y', -4)
        .attr('width', 16)
        .attr('height', 16)
        .attr('cursor', 'pointer')
        .attr('viewBox', '0 0 18 16')
        .attr('class', 'mapping-icon')
        .on('click', (event, d) => {
            if (this.isClickableType(d.data.type) && this.designConfig.types.mappingAvailableTypes.includes(d.data.type)) {
                event.stopPropagation();
                useMyTreeMappingStore().handleMappingSetting(d, this.containerId);
            } else {
                event.stopPropagation();
                useMyTreeMappingStore().toastifyMessage('맵핑 가능한 타입이 아닙니다.');
            }
        })

        mappingIcon.append('path')
        .attr('d', 'M6.5459 3C7.07063 3 7.49998 3.38584 7.5 3.85742C7.5 4.32902 7.07064 4.71484 6.5459 4.71484H5.55762C3.54211 4.71484 1.9082 6.18376 1.9082 7.99512C1.90849 9.80626 3.54229 11.2744 5.55762 11.2744H6.5459V11.2852C7.07064 11.2852 7.5 11.671 7.5 12.1426C7.49998 12.6142 7.07063 13 6.5459 13H5.55762C2.49262 13 0 10.7594 0 8.00488C0.00028821 5.25055 2.4928 3.01072 5.55762 3H6.5459ZM12.998 3C15.7458 3 18 5.24249 18 8C18 10.7575 15.7565 13 12.998 13H11.3584C10.8863 12.9998 10.5 12.6136 10.5 12.1416C10.5 11.6696 10.8863 11.2834 11.3584 11.2832H12.998C14.812 11.2832 16.2822 9.8133 16.2822 8C16.2822 6.1867 14.812 4.7168 12.998 4.7168H11.3584C10.8863 4.71665 10.5 4.3304 10.5 3.8584C10.5 3.38639 10.8863 3.00015 11.3584 3H12.998ZM12.0898 7C12.5904 7 13 7.45 13 8C13 8.55 12.5904 9 12.0898 9H5.91016C5.40959 9 5 8.55 5 8C5 7.45 5.40959 7 5.91016 7H12.0898Z')

        rightInfo.append('text')
        .attr('x', 37)
        .attr('y', 9)
        .style('font-size', '14px')
        .text('99')
        .style('cursor', 'pointer')
        .attr('class', 'mapping-count')
        .on('click', (event, d) => {
            if (this.isClickableType(d.data.type) && this.designConfig.types.mappingAvailableTypes.includes(d.data.type)) {
                event.stopPropagation();
                useMyTreeMappingStore().handleMappingSetting(d, this.containerId);
            } else {
                event.stopPropagation();
                useMyTreeMappingStore().toastifyMessage('맵핑 가능한 타입이 아닙니다.');
            }
        })
        
    }

    /**
     * Update existing nodes
     * @param {Selection} nodeUpdate - Node update selection
     */
    updateNodes(nodeUpdate) {
        nodeUpdate.transition()
            .duration(this.duration)
            .attr('transform', d => `translate(0,${d.x})`)
            .style('opacity', 1);

        nodeUpdate.select('.node-content')
            .attr('transform', d => `translate(${d.y}, 0)`);

        nodeUpdate.select('.toggle-btn circle')
        .attr('class', 'toggle-btn');

        nodeUpdate.select('.toggle-btn path')
            .attr('d', d => {
                if(d._children?.length > 0) {
                    return 'M 28 -1 L 34 2 L 28 5 Z';
                    // (d.data.children && d.data.children.length > 0)
                } else if(d.children?.length > 0) {
                    return 'M 26 0 L 34 0 L 30 5 Z';
                } else {
                    return 'M 26 1 L 34 1 L 34 3 L 26 3 Z'; // 마지막 뎁스 
                }
            });
    }

    /**
     * Get DOM element for a node
     * @param {Object} node - Node object
     * @returns {Element|null} DOM element
     */
    getNodeElement(node) {
        return this.g.selectAll('.node-group')
            .filter(d => d === node)
            .node();
    }

    /**
     * Get screen position of a node
     * @param {Object} node - Node object
     * @returns {Object|null} Position object {x, y, left, right, top, bottom}
     */
    getNodeScreenPosition(node) {
        const treeContainer = document.getElementById(this.containerId);
        const nodeElement = this.getNodeElement(node);

        if (!nodeElement || !treeContainer) {
            return null;
        }

        const containerRect = treeContainer.getBoundingClientRect();
        const nodeRect = nodeElement.getBoundingClientRect();

        return {
            x: nodeRect.left + nodeRect.width / 2,
            y: nodeRect.top + nodeRect.height / 2,
            left: nodeRect.left,
            right: nodeRect.right,
            top: nodeRect.top,
            bottom: nodeRect.bottom
        };
    }

    /**
     * Scroll to make a node visible
     * @param {Object} node - Node to scroll to
     */
    scrollToNode(node) {
        const nodeElement = this.getNodeElement(node);
        if (!nodeElement) return;

        const treeContainer = document.getElementById(this.containerId);
        if (!treeContainer) return;

        const containerRect = treeContainer.getBoundingClientRect();
        const nodeRect = nodeElement.getBoundingClientRect();

        // Scroll so the node is in the upper third of the container
        treeContainer.scrollTo({
            top: treeContainer.scrollTop + (nodeRect.top - containerRect.top) - containerRect.height / 3,
            behavior: 'smooth'
        });
    }

    getNodeElement(node) {
        return this.g.selectAll('.node-group')
            .filter(d => d === node)
            .node();
    }

    /**
     * Handle toggle button click
     * @param {Event} event - Click event
     * @param {Object} node - Node data
     */
    async onToggleClick(event, node) {
        event.stopPropagation();

        if (node.children) {
            node._children = node.children;
            node.children = null;
        } else if (node._children) {
            node.children = node._children;
            node._children = null;
        }
        
        await useMyTreeInstanceStore().nodeUpdate(node, this.containerId);

        
        const mappingManager = useMyTreeMappingStore();

        setTimeout(() => {
            if (mappingManager.lines.length > 0) {
                mappingManager.updateLinePositions();
            }
        }, this.duration + 50)
    }
    
    // 2025.12.22[mhlim]: 체계 유형 항목 뎁스별 노드 제목 말줄임 처리
    ellipsisNodeName() {
        // 항목명 d3 selection 전체 조회
        const nameSelection = d3.selectAll('.node-name');

        // 최대 제목 텍스트 길이 (말줄임 시작점)
        let maxLength = null;

        if (nameSelection.empty()) return;

        // 각 항목명 뎁스 값에 따른 최대 길이 설정 및 말줄임 처리
        nameSelection.each(function() {
            // 각 항목명 셀렉션 조회 
            const item = d3.select(this);
            // 항목명 뎁스 값 조회
            const currentDepth = item.datum().depth;

            // 항목명 뎁스 값에 따른 최대 길이 설정
            switch(currentDepth) {
                case 1:
                    maxLength = 18;
                    break;
                case 2:
                    maxLength = 16;
                    break;
                case 3:
                    maxLength = 12;
                    break;
                case 4:
                    maxLength = 8;
                    break;
            }

            // 항목명 텍스트 조회
            const text = item.node().textContent;

            // 항목명마다 텍스트 길이가 최대 길이 이상인 경우 말줄임 처리
            if (text.length > maxLength) {
                const ellipsisTxt = text.substring(0, maxLength - 2) + '...';
                item.node().textContent = ellipsisTxt;
            }
        })
    }

    /**
    * @param {Object} node - Node selection
    * @param {Selection} nodeGroup - Node group selection
    **/
    createKebobRenderer(node, nodeGroup) {
        d3.select(node).selectAll('.tooltip-btn').remove();

        if (d3.select(node).datum().data.type === 'DETAIL_LEARNING_OBJECT') return;
        
        // 2025.12.18[mhlim]: 교과목, 학습목표, 교육과정 유형에 따른 케밥(토글) 버튼 추가
        const toggleGroup = d3.select(node).append('g')
        .attr('class', 'tooltip-btn')
        .attr('transform', 'translate(350, -5)')
        .on('click', (event, d) => {
            this.toggleEditTooltip(event, d);
        })
        
        toggleGroup.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', 'transparent')
        
        const toggleIcon = toggleGroup.append('svg')
        .attr('width', 18)
        .attr('height', 18)
        .attr('viewBox', '0 0 24 24')
        .attr('cursor', 'pointer')

        toggleIcon.append('path')
        .attr('fill-rule', 'evenodd')
        .attr('clip-rule', 'evenodd')
        .attr('d', 'M12 2C13.1046 2 14 2.89543 14 4V4.00911C14 5.11368 13.1046 6.00911 12 6.00911C10.8954 6.00911 10 5.11368 10 4.00911V4C10 2.89543 10.8954 2 12 2Z')
        .attr('fill', '#999999');
        
        toggleIcon.append('path')
        .attr('fill-rule', 'evenodd')
        .attr('clip-rule', 'evenodd')
        .attr('d', 'M12 10.0088C13.1046 10.0088 14 10.9042 14 12.0088V12.0179C14 13.1225 13.1046 14.0179 12 14.0179C10.8954 14.0179 10 13.1225 10 12.0179V12.0088C10 10.9042 10.8954 10.0088 12 10.0088Z')
        .attr('fill', '#999999');
        
        toggleIcon.append('path')
        .attr('fill-rule', 'evenodd')
        .attr('clip-rule', 'evenodd')
        .attr('d', 'M12 18.0186C13.1046 18.0186 14 18.914 14 20.0186V20.0277C14 21.1322 13.1046 22.0277 12 22.0277C10.8954 22.0277 10 21.1322 10 20.0277V20.0186C10 18.914 10.8954 18.0186 12 18.0186Z')
        .attr('fill', '#999999');
    }

    /**
     * 
     * @param {Object} currentNode 
     * @param {*} nodeGroup 
     */
    createDragDropRenderer(currentNode, nodeGroup) {
        // 드래그 핸들링 버튼 추가 전, 토글 버튼 위치 조정
        d3.select(currentNode).select('.toggle-btn').each(function() {
            d3.select(currentNode).select('circle').attr('cx', 40);
            d3.select(currentNode).select('path').attr('d', d => {
                if(d._children?.length > 0) {
                    return 'M 38 -1 L 43 2 L 38 5 Z';
                    // (d.data.children && d.data.children.length > 0)
                } else if(d.children?.length > 0) {
                    return 'M 37 0 L 43 0 L 40 5 Z';
                } else {
                    return 'M 37 1 L 43 1 L 43 3 L 37 3 Z'; // 마지막 뎁스 
                }
            });
        })
        
        // 맵핑 버튼 위치 조정
        d3.select(currentNode).select('.right-info')
        .attr('transform', `translate(370, 0)`);
        
        // 노드 배경 위치 및 크기 조정
        d3.select(currentNode).select('.node-bg')
        .attr('width', 'calc(100% - 20px)')
        .attr('x', 0);

        d3.select(currentNode).selectAll('.drag-handle-btn').remove();
        
        // 드래그 핸들링 버튼 추가
        const dragHandleGroup = d3.select(currentNode).append('g')
        .attr('class', 'drag-handle-btn')

        dragHandleGroup.append('rect')
        .attr('width', 23)
        .attr('height', 23)
        .attr('x', 5)
        .attr('y', -8)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
                
                
        const handleIcon = dragHandleGroup.append('svg')
        .attr('width', 8)
        .attr('height', 14)
        .attr('transform', 'translate(10, -4)')
        .attr('viewBox', '0, 0, 29, 50')
        .attr('cursor', 'pointer')
        
        const handleIconGroup = handleIcon.append('g')
        .attr('clip-path', 'url(#clip0_349_8644)');
        
        const pathList = [
            'M5 10C7.76142 10 10 7.76142 10 5C10 2.23858 7.76142 0 5 0C2.23858 0 0 2.23858 0 5C0 7.76142 2.23858 10 5 10Z',
            'M5 30C7.76142 30 10 27.7614 10 25C10 22.2386 7.76142 20 5 20C2.23858 20 0 22.2386 0 25C0 27.7614 2.23858 30 5 30Z',
            'M5 50C7.76142 50 10 47.7614 10 45C10 42.2386 7.76142 40 5 40C2.23858 40 0 42.2386 0 45C0 47.7614 2.23858 50 5 50Z',
            "M23.5029 10C26.2644 10 28.5029 7.76142 28.5029 5C28.5029 2.23858 26.2644 0 23.5029 0C20.7415 0 18.5029 2.23858 18.5029 5C18.5029 7.76142 20.7415 10 23.5029 10Z",
            "M23.5029 30C26.2644 30 28.5029 27.7614 28.5029 25C28.5029 22.2386 26.2644 20 23.5029 20C20.7415 20 18.5029 22.2386 18.5029 25C18.5029 27.7614 20.7415 30 23.5029 30Z",
            "M23.5029 50C26.2644 50 28.5029 47.7614 28.5029 45C28.5029 42.2386 26.2644 40 23.5029 40C20.7415 40 18.5029 42.2386 18.5029 45C18.5029 47.7614 20.7415 50 23.5029 50Z"
        ]
        
        pathList.forEach(path => {
            handleIconGroup.append('path')
            .attr('d', path)
            .attr('fill', '#C2C2C2')
        })
        
        handleIcon.append('defs')
        .append('clipPath')
        .attr('id', 'clip0_349_8644')
        .append('rect')
        .attr('width', '28.5')
        .attr('height', '50')
        .attr('fill', 'white');
        
        // 각 유형 아이템 노드마다 추가된 핸들링 버튼 
        // -> d3 드래그드롭 이벤트 추가
        d3.select(currentNode).select('.drag-handle-btn').call(d3.drag()
            .on("start", (event, d) => {
                // 드래그 시작한 아이템 노드의 복제 노드(ghost) 추가
                d3.select(currentNode).classed('dragging-element', true);
                d3.select(currentNode).clone(true).raise().classed('dragging-element-clone', true);

                // 각 요소의 실제 transform 값 파싱
                const currentTransform = d3.select(currentNode).attr('transform');
                if (currentTransform) {
                    // 현재 아이템 위치 y 값 추출
                    const match = currentTransform.match(/translate\([^,]+,([^)]+)\)/);
                    d._startX = match ? parseFloat(match[1]) : d.x;
                } else {
                    d._startX = d.x;
                }
                
                // 드래그 시작 시 마우스 y 위치 저장 (SVG 좌표계 기준)
                const [x, y] = d3.pointer(event, currentNode.parentElement);
        
                // 드래그중인 노드 정보 저장
                d.currentDraggingNode = d;
                d._startMouseY = y; // svg 좌표 내부 클릭 시점 마우스 y 위치 저장
            })
        
            .on("drag", (event, d) => {
                // SVG 좌표계 기준으로 마우스 이동 위치 계산
                const [x, y] = d3.pointer(event, currentNode.parentElement);
                const dy = y - d._startMouseY;

                d._closestNode = null;
                let minDistance = 10;

                if (d3.selectAll('.dragging-element-closest').nodes().length > 1) {
                    d3.selectAll('.dragging-element-closest').classed('dragging-element-closest', false);
                }
                // 현재 드래그중인 노드의 ghost 노드 위치와 인접한 노드 필터링
                nodeGroup.each(function(node) {
                    if (node === d.currentDraggingNode) return;
                    
                    const transform = d3.select(this).attr('transform');
                    
                    if (transform) {
                        const match = transform.match(/translate\([^,]+,([^)]+)\)/);
                        if (match) {
                            const nodeY = parseFloat(match[1]);
                            const distance = Math.abs(y - nodeY);
                            
                            // 노드 높이 범위 내에 있으면
                            if (distance < minDistance) {
                                minDistance = distance;
                                d._closestNode = node;
                                d3.selectAll('.node-group')
                                .filter(d => d === node)
                                .node().classList.add('dragging-element-closest');
                            }
                        }
                    }
                });
        
                // 2025.12.17[mhlim]: 초기 위치에 상대 이동량 더하기
                d.x = d._startX + dy;
                // 드래그중인 노드의 ghost 노드 위치 업데이트
                d3.select('.dragging-element-clone')
                .attr('transform', `translate(0, ${d.x + 20})`);
            })
                    
            .on("end", (event, d) => {
                d3.select(currentNode).classed('dragging', false);
                d3.select('.dragging-element-clone').remove();
                d3.select('.dragging-element')
                .classed('dragging-element', false);
        
                d3.select('.dragging-element-closest')
                .classed('dragging-element-closest', false);
        
                // 드래그중에 저장된 ghost 노드와 인접한 노드 조회
                // -> 드래그중인 노드와 드롭한 위치가 똑같으면 실행 x
                if (d._closestNode && d._closestNode !== d.currentDraggingNode) {
                    const draggingNode = d.currentDraggingNode;
                    const closestNode = d._closestNode;
                    
                    // 둘 다 부모 뎁스가 있으며, 부모 뎁스가 동일한 영역에서만 교체
                    if (draggingNode.parent && closestNode.parent
                        && draggingNode.parent === closestNode.parent) {
                        const parent = draggingNode.parent;
                        const children = parent.children || parent._children;
                        
                        if (children) {
                            const idx1 = children.indexOf(draggingNode);
                            const idx2 = children.indexOf(closestNode);
        
                            if (idx1 !== -1 && idx2 !== -1 && idx1 !== idx2) {
                                [children[idx1], children[idx2]] = [children[idx2], children[idx1]];
                                
                                // 2025.12.17[mhlim]: requestAnimationFrame으로 지연
                                requestAnimationFrame(async () => {
                                    const treeInstanceStore = useMyTreeInstanceStore();
                                    d3.selectAll('.drag-handle-btn').remove();
                                    await treeInstanceStore.nodeUpdate(parent, 'edu-tree');
                                });
                            }
                        }
                    }
                }
            })
        );   
    }

    /**
     * 
     * @param {Event} event 
     * @param {Object} node - Node data
     */

    // 2025.12.18[mhlim]: 편집 모드 토글 버튼 클릭 시 툴팁 생성 메소드
    toggleEditTooltip(event, node) {
        event.stopPropagation();

        // 활성화 툴팁 중복 제거 호출 함수
        const removeTooltip = () => this.removeEditTooltip();
        if (removeTooltip()) return;

        // 클릭한 노드 그룹 selection 노드 요소 조회
        const nodeElement = this.getNodeElement(node);

        // 현재 툴팁 메뉴의 메뉴 아이템 클릭 이벤트 분기 처리
        const handleNodeNameInput = () => {
            this.handleNodeNameInput(nodeElement, node);
        }

        // 현재 토글 버튼 클릭한 노드 부모 좌표 마우스 위치 추출
        const [x, y] = d3.pointer(event, nodeElement.parentElement);

        // 설정 툴팁 배경 요소 추가
        d3.select(nodeElement.parentElement).append('rect')
        .attr('class', 'edit-tooltip')
        .attr('transform', `translate(200, ${15 + y})`)
        .attr('width', 172)
        .attr('height', 148)
        .attr('rx', 5)
        .attr('ry', 5)

        // 각 교육체계 유형별 수정 메뉴 목록
        const settingMenuList = {
            "COURSE": [ 
                {
                    icon: 'add',
                    name: '교과목그룹 생성'
                },
                {
                    icon: 'add',
                    name: '교과목 생성'
                },
                {
                    icon: 'write',
                    name: '항목명 수정'
                }
            ],
            "LESSON_GROUP": [
                {
                    icon: 'add',
                    name: '교과목그룹 생성'
                },
                {
                    icon: 'add',
                    name: '교과목 생성'
                },
                {
                    icon: 'write',
                    name: '항목명 수정'
                },
                {
                    icon: 'delete',
                    name: '삭제'
                }
            ],
            "LESSON": [
                {
                    icon: 'add',
                    name: '교과목 생성'
                },
                {
                    icon: 'add',
                    name: '학습목표 생성'
                },
                {
                    icon: 'write',
                    name: '항목명 수정'
                },
                {
                    icon: 'delete',
                    name: '삭제'
                }
            ],
            "LEARNING_OBJECT": [
                {
                    icon: 'add',
                    name: '학습목표 생성'
                },
                {
                    icon: 'add',
                    name: '세부학습목표 생성'
                },
                {
                    icon: 'write',
                    name: '항목명 수정'
                },
                {
                    icon: 'delete',
                    name: '삭제'
                }
            ],
        }

        // 설정 메뉴 목록 배경 그룹
        const tooltipMenuGroupBg = d3.select(nodeElement.parentElement)
        .append('g')
        .attr('class', 'edit-menu-group')
        .attr('transform', `translate(200, ${30 + y})`);

        // 설정 메뉴 목록 텍스트 그룹
        const menuListGroup = d3.select(nodeElement.parentElement)
        .append('g')
        .attr('class', 'edit-menu')
        .attr('transform', `translate(220, ${37 + y})`)

        // 2025.12.19[mhlim]: 마우스 호버 이벤트 연동을 위한 메뉴 아이템 요소 배열
        const bgRects = []; // 메뉴 아이템 배경
        const textRects = []; // 메뉴 아이템 텍스트
        const svgRects = []; // 메뉴 아이템 아이콘

        // 2025.12.19[mhlim]: 메뉴 목록 배경 요소 추가 및 hover 이벤트 부여
        settingMenuList[node.data.type].forEach((menu, i) => {
            // 각 메뉴 배경 노드 생성 및 저장
            bgRects.push(
                tooltipMenuGroupBg.append('rect')
                .attr('x', 0)
                .attr('y', (i * 30))
                .attr('width', 172)
                .attr('height', 32)
                .attr('fill', 'transparent')
                .attr('class', 'edit-menu-item-bg')
                .attr('cursor', 'pointer')
                .datum(node)
            );

            // ---- 각 메뉴 아이콘 유형에 따른 동적 아이콘 노드 추가 및 저장 ----
            if (menu.icon === 'add') {
                // 추가 버튼 아이콘 그룹 path 도형 목록
                const pathList = [
                    'M43.4928 14.7525C43.4928 10.5306 40.0703 7.10813 35.8484 7.10812H14.5142C10.2924 7.10815 6.86987 10.5306 6.86984 14.7525V35.2343C6.86984 39.4562 10.2923 42.8786 14.5142 42.8787H35.8484C40.0703 42.8787 43.4928 39.4562 43.4928 35.2343V14.7525ZM46.848 35.2343C46.848 41.3092 41.9233 46.2338 35.8484 46.2339H14.5142C8.43933 46.2338 3.51465 41.3092 3.51465 35.2343V14.7525C3.51468 8.67763 8.43935 3.75296 14.5142 3.75293H35.8484C41.9233 3.75294 46.8479 8.67762 46.848 14.7525V35.2343Z',
                    'M23.5037 33.8367V16.16C23.5037 15.2335 24.2548 14.4824 25.1813 14.4824C26.1078 14.4824 26.8589 15.2335 26.8589 16.16V33.8367C26.8583 34.7628 26.1074 35.5143 25.1813 35.5143C24.2551 35.5143 23.5042 34.7628 23.5037 33.8367Z',
                    'M34.0201 23.3203L34.3586 23.3536C35.1224 23.5105 35.6977 24.1877 35.6977 24.9979C35.6977 25.8082 35.1224 26.4853 34.3586 26.6423L34.0201 26.6755H16.3434C15.4169 26.6755 14.6658 25.9244 14.6658 24.9979C14.6658 24.0714 15.4169 23.3203 16.3434 23.3203H34.0201Z'
                ];
            
                const menuIcon = tooltipMenuGroupBg.append('svg')
                .attr('width', 16)
                .attr('height', 16)
                .attr('x', 16)
                .attr('y', 7 + (i * 30))
                .attr('class', 'edit-menu-item-icon')
                .attr('viewBox', '1 0 50 51')
                .attr('cursor', 'pointer');
            
                const menuIconGroup = menuIcon.append('g')
                .attr('clip-path', 'url(#clip0)')

                pathList.forEach(path => {
                    menuIconGroup.append('path')
                    .attr('d', path)
                    .attr('fill', "#333")
                })
            
                menuIcon.append('defs')
                .append('clipPath')
                .attr('id', 'clip0')
                .append('rect')
                .attr('width', '50')
                .attr('height', '50')
                .attr('fill', 'white')
                .attr('transform', 'translate(3.52075 3.75879');
            
                svgRects.push(
                    menuIcon
                );
            } else if (menu.icon === 'write') {
                const pathList = [
                    'M12.008 3.2459C13.0029 1.88981 14.9046 1.5965 16.2609 2.58477L16.2619 2.58575L18.4582 4.19219L18.5822 4.2879C19.8329 5.30039 20.0846 7.13337 19.1193 8.44903L17.5275 10.6287C17.2808 10.9667 16.807 11.0413 16.4689 10.7947C16.1309 10.5479 16.0571 10.0732 16.3039 9.73516L17.8967 7.55352L17.8976 7.55254C18.3965 6.87258 18.2461 5.91387 17.5656 5.41778L17.5637 5.4168L15.3683 3.80938C14.6865 3.31267 13.731 3.46036 13.2307 4.14239L11.6389 6.32208C11.392 6.66015 10.9174 6.73393 10.5793 6.48711C10.2416 6.24024 10.1676 5.76645 10.4142 5.42852L12.007 3.24688L12.008 3.2459Z',
                    'M10.3208 5.54122C10.578 5.25757 11.0128 5.20822 11.3286 5.43868L17.2232 9.7463C17.3859 9.86527 17.4944 10.0441 17.5249 10.2434C17.5554 10.4425 17.5059 10.6457 17.3863 10.8078L11.4351 18.8684C11.1866 19.205 10.7122 19.2768 10.3755 19.0285C10.0388 18.7799 9.96681 18.3047 10.2154 17.968L15.7134 10.5197L11.0435 7.10762L5.54154 14.5666C5.29303 14.9034 4.81782 14.9753 4.48099 14.7268C4.14418 14.4782 4.07233 14.003 4.32083 13.6662L10.272 5.60079L10.3208 5.54122Z',
                    'M4.91237 13.3587C5.33081 13.3479 5.67892 13.6785 5.68971 14.0969L5.81276 18.9133L10.6389 17.6838C11.0445 17.5805 11.4573 17.8252 11.5608 18.2307C11.6642 18.6363 11.4186 19.0492 11.013 19.1526L5.26783 20.6174C5.04453 20.6744 4.80713 20.6265 4.6233 20.4876C4.43951 20.3485 4.32855 20.133 4.32252 19.9026L4.17408 14.136C4.16331 13.7176 4.49393 13.3694 4.91237 13.3587Z',
                    'M19.624 22.4844C20.0426 22.4844 20.3818 22.8236 20.3818 23.2422C20.3818 23.6608 20.0426 24 19.624 24H4.75781C4.33923 24 4 23.6608 4 23.2422C4 22.8236 4.33923 22.4844 4.75781 22.4844H19.624Z'
                ];
            
                const menuIcon = tooltipMenuGroupBg.append('svg')
                .attr('width', 16)
                .attr('height', 16)
                .attr('x', 16)
                .attr('y', 7 + (i * 30))
                .attr('class', 'edit-menu-item-icon')
                .attr('viewBox', '0 0 24 25')
                .attr('cursor', 'pointer');
            
                const menuIconGroup = menuIcon.append('g')
                .attr('clip-path', 'url(#clip0_1_1807)')

                pathList.forEach(path => {
                    menuIconGroup.append('path')
                    .attr('d', path)
                    .attr('fill', "#333")
                })
            
                menuIcon.append('defs')
                .append('clipPath')
                .attr('id', 'clip0_1_1807')
                .append('rect')
                .attr('width', '16.3822')
                .attr('height', '22')
                .attr('fill', 'white')
                .attr('transform', 'translate(4 2)');

                svgRects.push(
                    menuIcon
                );
            } else {
                const pathList = [
                    'M30.0859 12.0384V10.3099C30.0856 9.12407 29.1233 8.16146 27.9374 8.16146H22.065C20.8794 8.16175 19.9169 9.12424 19.9166 10.3099V11.9798C19.9166 12.9003 19.1704 13.6465 18.2499 13.6465C17.3295 13.6465 16.5833 12.9003 16.5833 11.9798V10.3099C16.5835 7.28329 19.0384 4.82841 22.065 4.82812H27.9374C30.9643 4.82812 33.4189 7.28312 33.4192 10.3099V12.0384C33.4192 12.9589 32.673 13.7051 31.7525 13.7051C30.8326 13.7044 30.0859 12.9585 30.0859 12.0384Z',
                    'M47.0125 10.8799L47.3478 10.9124C48.1073 11.0679 48.6792 11.7411 48.6792 12.5465C48.6792 13.352 48.1073 14.0252 47.3478 14.1807L47.0125 14.2132H2.97282C2.05234 14.2132 1.30615 13.467 1.30615 12.5465C1.30615 11.6261 2.05234 10.8799 2.97282 10.8799H47.0125Z',
                    'M18.9385 34.9056V23.737C18.9385 22.8165 19.6847 22.0703 20.6051 22.0703C21.5256 22.0703 22.2718 22.8165 22.2718 23.737V34.9056L22.2393 35.2409C22.0842 36.0008 21.4109 36.5723 20.6051 36.5723C19.7994 36.5723 19.1261 36.0008 18.971 35.2409L18.9385 34.9056Z',
                    'M27.7222 34.9056V23.737C27.7222 22.8165 28.4684 22.0703 29.3888 22.0703C30.3093 22.0703 31.0555 22.8165 31.0555 23.737V34.9056L31.0229 35.2409C30.8679 36.0008 30.1946 36.5723 29.3888 36.5723C28.5831 36.5723 27.9098 36.0008 27.7547 35.2409L27.7222 34.9056Z',
                    'M43.3423 12.3657C44.2529 12.5002 44.883 13.3496 44.7485 14.2602L40.8618 40.5721C40.2636 44.65 36.472 47.915 32.3592 47.9158H17.6424C13.529 47.9158 9.73483 44.6505 9.13656 40.5721L5.24984 14.2602L5.23682 13.9217C5.27991 13.1481 5.85977 12.4835 6.65609 12.3657C7.45317 12.248 8.20157 12.7173 8.46598 13.4464L8.55062 13.7719L12.4341 40.0838V40.0871L12.5252 40.5395C13.0907 42.7749 15.3328 44.5825 17.6424 44.5825H32.3592C34.8223 44.5816 37.2073 42.5251 37.5643 40.0871V40.0838L41.451 13.7719L41.5324 13.4464C41.7966 12.7173 42.5453 12.2483 43.3423 12.3657Z'
                ]
            
                const menuIcon = tooltipMenuGroupBg.append('svg')
                .attr('width', 16)
                .attr('height', 16)
                .attr('x', 16)
                .attr('y', 7 + (i * 30))
                .attr('class', 'edit-menu-item-icon')
                .attr('viewBox', '0 0 50 50')
                .attr('cursor', 'pointer');
            
                const menuIconGroup = menuIcon.append('g')
                .attr('clip-path', 'url(#clip0_351_8734)')

                pathList.forEach(path => {
                    menuIconGroup.append('path')
                    .attr('d', path)
                    .attr('fill', "#333")
                })
            
                menuIcon.append('defs')
                .append('clipPath')
                .attr('id', 'clip0_351_8734')
                .append('rect')
                .attr('width', '50')
                .attr('height', '50')
                .attr('fill', 'white')
                .attr('transform', 'translate(3.52075 3.75879)');

                svgRects.push(
                    menuIcon
                );
            }

            // 각 메뉴 텍스트 노드 생성 및 저장
            textRects.push(
                menuListGroup.append('text')
                .text(menu.name)
                .attr('class', 'edit-menu-item')
                .attr('x', 20)
                .attr('y', 15 + (i * 30))
            );
        });

        // 2025.12.19[mhlim]: 마우스 호버 이벤트 연동
        bgRects.forEach((bgRect, i) => {
            bgRect.on('mouseenter', function() {
                d3.select(this).attr('fill', '#F2FDFB');
                textRects[i].style('fill', '#105E51');
                svgRects[i].selectAll('path')
                .attr('fill', '#105E51');
            })
            bgRect.on('mouseleave', function() {
                d3.select(this).attr('fill', 'transparent');
                textRects[i].style('fill', '#000');
                svgRects[i].selectAll('path').attr('fill', '#333');
            })
            bgRect.on('click', function(e) {
                const d = node;
                // 2025.12.19[mhlim]: 현재 과정 그룹 노드의 교과목그룹 생성 메뉴 클릭
                // -> 해당 과정 교과목 뎁스의 1번째 교과목 복제
                switch (textRects[i].node().textContent) {
                    case '교과목그룹 생성':
                        createNewLabelType(d, 'LESSON_GROUP');
                        break;
                    case '교과목 생성':
                        createNewLabelType(d, 'LESSON');
                        break;
                    case '학습목표 생성':
                        createNewLabelType(d, 'LEARNING_OBJECT');
                        break;
                    case '세부학습목표 생성':
                        createNewLabelType(d, 'DETAIL_LEARNING_OBJECT');
                        break;
                    case '항목명 수정':
                        handleNodeNameInput();
                        break;
                    case '삭제':
                        deleteCurrentNode(node);
                        break;
                }
            })
        });

        textRects.forEach((textRect, i) => {
            textRect.on('mouseenter', function() {
                d3.select(this).style('fill', '#105E51');
                bgRects[i].attr('fill', '#F2FDFB');
                svgRects[i].selectAll('path').attr('fill', '#105E51');
            })
            textRect.on('mouseleave', function() {
                d3.select(this).style('fill', '#000');
                bgRects[i].attr('fill', 'transparent');
                svgRects[i].selectAll('path').attr('fill', '#333');
            })
            textRect.on('click', function() {
                const d = node;
                // 2025.12.19[mhlim]: 현재 과정 그룹 노드의 교과목그룹 생성 메뉴 클릭
                // -> 해당 과정 교과목 뎁스의 1번째 교과목 복제
                switch (textRects[i].node().textContent) {
                    case '교과목그룹 생성':
                        createNewLabelType(d, 'LESSON_GROUP');
                        break;
                    case '교과목 생성':
                        createNewLabelType(d, 'LESSON');
                        break;
                    case '학습목표 생성':
                        createNewLabelType(d, 'LEARNING_OBJECT');
                        break;
                    case '세부학습목표 생성':
                        createNewLabelType(d, 'DETAIL_LEARNING_OBJECT');
                        break;
                    case '항목명 수정':
                        handleNodeNameInput();
                        break;
                    case '삭제':
                        deleteCurrentNode(node);
                        break;
                }
            })
        });

        svgRects.forEach((svgRect, i) => {
            svgRect.on('mouseenter', function() {
                d3.select(this).selectAll('path').attr('fill', '#105E51');
                textRects[i].style('fill', '#105E51');
                bgRects[i].attr('fill', '#F2FDFB');
            })
            svgRect.on('mouseleave', function() {
                d3.select(this).selectAll('path').attr('fill', '#333');
                textRects[i].style('fill', '#000');
                bgRects[i].attr('fill', 'transparent');
            })

            svgRect.on('click', function() {
                // 2025.12.19[mhlim]: 현재 과정 그룹 노드의 교과목그룹 생성 메뉴 클릭
                // -> 해당 과정 교과목 뎁스의 1번째 교과목 복제
                switch (textRects[i].node().textContent) {
                    case '교과목그룹 생성':
                        createNewLabelType(node, 'LESSON_GROUP');
                        break;
                    case '교과목 생성':
                        createNewLabelType(node, 'LESSON');
                        break;
                    case '학습목표 생성':
                        createNewLabelType(node, 'LEARNING_OBJECT');
                        break;
                    case '세부학습목표 생성':
                        createNewLabelType(node, 'DETAIL_LEARNING_OBJECT');
                        break;
                    case '항목명 수정':
                        handleNodeNameInput();
                        break;
                    case '삭제':
                        deleteCurrentNode(node);
                        break;
                }
            })
        });

        const createNewLabelType = (d, labelType) => { 
            // 교과목 그룹 노드 데이터 복제 함수
            const cloneNodeData = (nodeData) => {
                return {
                    ...nodeData,
                    id: nodeData.id + 1,
                    name: `${this.getTypeDisplayName(labelType, d.data)} 추가본`,
                    type: labelType,
                    depth: d.data.type !== labelType ? d.depth + 1: d.depth,
                };
            };
    
            let newNode = null;

            // 2025.12.22[mhlim]: 현재 추가할 유형 노드가
            // 클릭한 노드와 동일 뎁스인 경우, 부모 뎁스 기준으로 새 노드 생성
            if (d.data.type === labelType) {
                const newChildNode = d.data;
                const clonedData = cloneNodeData(newChildNode);

                newNode = {
                    data: clonedData,
                    children: null,
                    _children: null,
                    depth: d.depth, // 현재 노드 뎁스
                    parent: d.parent,
                }

                newNode.parent.children = [...newNode.parent.children, newNode];

                // 🔥 추가: 트리 구조 재계산 (d3.hierarchy 재생성)
                // 또는 그냥 루트 노드로 업데이트
                useMyTreeInstanceStore().nodeUpdate(d, 'edu-tree');
                
                removeTooltip();

                return;
            }
                        
            // 클릭한 교육과정의 교과목 뎁스가 펼쳐진 경우
            if (d.children && d.children.length > 0) {
                // 🔥 수정: 첫 번째 노드 데이터를 복사해서 새 노드 생성
                const firstChildData = d.children[0].data;
                const clonedData = cloneNodeData(firstChildData);
                
                // 새 노드 생성 (d3.hierarchy 구조)
                newNode = {
                    data: clonedData,
                    children: d.children[0].children ? d.children[0].children.map(child => {
                        const cloned = { ...child };
                        cloned.parent = null; // 나중에 설정
                        return cloned;
                    }) : null,
                    _children: d.children[0]._children ? d.children[0]._children.map(child => {
                        const cloned = { ...child };
                        cloned.parent = null;
                        return cloned;
                    }) : null,
                    depth: d.children[0].depth,
                    parent: d
                };
                
                d.children.unshift(newNode);
            }// 클릭한 교육과정의 교과목 뎁스가 닫힌 경우
            else if (d._children && d._children.length > 0) {
                // 🔥 수정: 첫 번째 노드 데이터를 복사해서 새 노드 생성
                const firstChildData = d._children[0].data;
                const clonedData = cloneNodeData(firstChildData);
                
                newNode = {
                    data: clonedData,
                    children: [],
                    _children: [],
                    depth: d._children[0].depth,
                    parent: d._children[0].parent
                };
                
                d._children.unshift(newNode);
                
                // 펼침 활성화
                d.children = [...d._children];
            } else {
                const newChildNode = d.data;
                const clonedData = cloneNodeData(newChildNode);

                newNode = {
                    data: clonedData,
                    children: null,
                    _children: null,
                    depth: d.data.type !== labelType ? d.depth + 1: d.depth, // 현재 노드 뎁스 + 1
                    parent: d.data.type !== labelType ? d: d.parent,
                }

                d.children = [];
    
                d.children.push(newNode);
                d.data.children = d.children;
            }

            // 🔥 추가: 트리 구조 재계산 (d3.hierarchy 재생성)
            // 또는 그냥 루트 노드로 업데이트
            useMyTreeInstanceStore().nodeUpdate(d, 'edu-tree');
            
            removeTooltip();
        };

        // 2025.12.22[mhlim]: 교육체계 트리에서 특정 그룹 노드 삭제 선택 시
        // -> 전체 노드에서 해당 노드 인덱스 찾아 삭제 처리 후 업데이트
        const deleteCurrentNode = (currentNode) => {
            const spliceDeleteNodeIndex = (node) => {
                if (node.children) {
                    node.children.forEach((children) => {
                        if (children.data.id === currentNode.data.id) {
                            node.children.splice(node.children.indexOf(children), 1);
                        }

                        if (children.children) {
                           spliceDeleteNodeIndex(children);
                        }
                    })
                }
                return node;
            }

            const deletedRootNode = spliceDeleteNodeIndex(useMyTreeInstanceStore().$state.edu.root);
            
            useMyTreeInstanceStore().nodeUpdate(deletedRootNode, 'edu-tree');

            removeTooltip();
        }
    }

    // 2025.12.19[mhlim]: 항목명 수정 메뉴 클릭 시,
    // 항목명 바인딩 및 수정 입력 가능한 input 활성화 함수
    handleNodeNameInput(nodeElement, node) {
        // 클릭한 배경 인덱스가 항목명 수정 인덱스인 경우, 
        // 해당 그룹노드 영역 텍스트 노드 요소 input 활성화
        const currentNodeInput =  d3.select(nodeElement)
        .select('.node-name-input-group');

        currentNodeInput.style('display', 'block');

        const currentNodeName = d3.select(nodeElement)
        .select('.node-name');

        // 현재 활성화된 입력 필드에 툴팁 포함된 그룹노드 항목명 바인딩
        currentNodeInput.select('.node-name-input')
        .node().value = node.data.name;
        currentNodeName.style('display', 'none');

        // 툴팁 비활성화 함수 호출
        this.removeEditTooltip();
    }

    removeEditTooltip() {
        // 중복 생성 방지를 위한 중복 체크 요소 조회
        // -> 이미 툴팁이 존재하면 제거 후 종료
        const duplicateEditTooltip = d3.select('.edit-tooltip');
        const duplicateEditMenuGroup = d3.select('.edit-menu-group');
        const duplicateEditMenu = d3.select('.edit-menu');
        const alreadyMenuList = d3.selectAll('.edit-menu-item');
        const alreadyMenuListBg = d3.selectAll('.edit-menu-item-bg');
        const alreadySvg = d3.selectAll('.edit-menu-item-icon');

        // 생성된 툴팁이 이미 존재하는데 재클릭한 경우, 제거 후 종료
        if (duplicateEditTooltip.node() !== null) {
            duplicateEditTooltip.node().remove();
            duplicateEditMenu.node().remove();
            duplicateEditMenuGroup.node().remove();
            alreadyMenuList.nodes().forEach(node => node.remove());
            alreadyMenuListBg.nodes().forEach(node => node.remove());
            alreadySvg.nodes().forEach(node => node.remove());
            return true;
        }

        return false;
    }
}
