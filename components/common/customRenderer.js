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
     * Recalculate type tag positions (after visibility changes)
     */
    recalculateTypeTagPositions() {
        this.g.selectAll('.type-tag').each(function(d) {
            const hasToggle = d.data.children && d.data.children.length > 0;
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
            .duration(this.duration)
            .style('opacity', 0)
            .remove();

        // 2025.12.17[mhlim]:
        // 과정 편집 모드 전환, 토글, 맵핑, 드래그 이벤트 호출 시점
        if (useMyTreeInstanceStore().$state.currentMode === 'edit') {
            // 기존 드래그 버튼 제거
            d3.selectAll('.drag-handle-btn').remove();
            // 업데이트된 트리 노드 그룹에 대한 드래그 핸들링 요소 및 이벤트 추가
            this.setupEditModeNodes();
        }
    }

    // 2025.12.17[mhlim]: 드래그 드롭 요소 및 이벤트 추가 메소드
    setupEditModeNodes() {
        // 전체 트리 그룹 노드 중에서 교육체계 관련 유형 노드 필터링
        const nodeGroup = this.g.selectAll('.node-group').filter((d) => d.data.type === 'COURSE'
        || d.data.type === 'LESSON' || d.data.type === 'LEARNING_OBJECT');

        if (nodeGroup.nodes().length <= 0) return;

        nodeGroup.each(function() {
            // 드래그 핸들링 버튼 추가 전, 토글 버튼 위치 조정
            d3.select(this).select('.toggle-btn').each(function() {
                d3.select(this).select('circle').attr('cx', 40);
                d3.select(this).select('path').attr('d', d => {
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

            // 유형 태그 위치 조정
            d3.select(this).select('.type-tag').each(function(d) {
                const typeTagStartX = 60;
            
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

            // 노드 배경 위치 및 크기 조정
            d3.select(this).select('.node-bg').attr('width', 'calc(100% - 40px)')
            .attr('x', 25);

            // 드래그 핸들링 버튼 추가
            const dragHandleGroup = d3.select(this).append('g')
            .attr('class', 'drag-handle-btn')

            dragHandleGroup.append('rect')
            .attr('width', 18)
            .attr('height', 22)
            .attr('x', 5)
            .attr('y', -8)
            .attr('fill', 'transparent')
            .attr('cursor', 'pointer')
        
        
            const handleIcon = dragHandleGroup.append('svg')
            .attr('width', 8)
            .attr('height', 14)
            .attr('transform', 'translate(10, -4)')
            .attr('viewBox', '0, 0, 29, 50')

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
            d3.select(this).select('.drag-handle-btn').call(d3.drag()
                .on("start", (event, d) => {
                    // 드래그 시작한 아이템 노드의 복제 노드(ghost) 추가
                    d3.select(this).classed('dragging-element', true);
                    d3.select(this).clone(true).raise().classed('dragging-element-clone', true);

                    // 각 요소의 실제 transform 값 파싱
                    const currentTransform = d3.select(this).attr('transform');
                    if (currentTransform) {
                        // 현재 아이템 위치 y 값 추출
                        const match = currentTransform.match(/translate\([^,]+,([^)]+)\)/);
                        d._startX = match ? parseFloat(match[1]) : d.x;
                    } else {
                        d._startX = d.x;
                    }
                    
                    // 드래그 시작 시 마우스 y 위치 저장 (SVG 좌표계 기준)
                    const [x, y] = d3.pointer(event, this.parentElement);

                    d.currentDraggingNode = d;
                    d._startMouseY = y;
                })

                .on("drag", (event, d) => {
                    // SVG 좌표계 기준으로 마우스 이동 위치 계산
                    const [x, y] = d3.pointer(event, this.parentElement);
                    const dy = y - d._startMouseY;

                    d._closestNode = null;
                    let minDistance = 10;

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
                                }
                            }
                        }
                    });

                    // 2025.12.17[mhlim]: 초기 위치에 상대 이동량 더하기
                    d.x = d._startX + dy;
                    // 드래그중인 노드의 ghost 노드 위치 업데이트
                    d3.select('.dragging-element-clone').attr('transform', `translate(0, ${d.x})`);
                })
            
                .on("end", (event, d) => {
                    d3.select(this).classed('dragging', false);
                    d3.select('.dragging-element-clone').remove();
                    d3.select('.dragging-element').classed('dragging-element', false);

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
                                        await treeInstanceStore.nodeUpdate(parent, 'edu-tree');
                                    });
                                }
                            }
                        }
                    }
                })
            );
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

        
        this.ellipsisNodeName();

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

        // Calculate width and adjust
        this.recalculateTypeTagPositions();
    }

    /**
     * Create node name text
     * @param {Selection} nodeContent - Node content group
     */
    createNodeName(nodeContent) {
        nodeContent.append('text')
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
            .attr('transform', `translate(390, 0)`)
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

        this.recalculateTypeTagPositions();
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
    
    // 2025.12.03[mhlim]: 노드 제목 말줄임 처리
    ellipsisNodeName() {
        // 노드명 요소 전체 조회
        const title = document.querySelectorAll('.node-name');

        // 25자 제한
        const maxLength = 16;

        // 각 노드명 요소 텍스트 말줄임 처리
        title.forEach((item) => {
            const text = item.textContent;

            // 텍스트 길이가 25자 이상인 경우 말줄임 처리
            if (text.length > maxLength) {
                const ellipsisTxt = text.substring(0, maxLength - 2) + '...';
                item.textContent = ellipsisTxt;
            }
        })
    }
}
