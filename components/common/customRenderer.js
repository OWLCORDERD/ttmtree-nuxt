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
            const typeTagStartX = hasToggle ? 50 : 30;

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

        // After transitions complete, notify for LeaderLine updates
        setTimeout(() => {
            if (window.mappingManager && window.mappingManager.lines.length > 0) {
                window.mappingManager.updateLinePositions();
            }
        }, this.duration + 50);
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
                    this.onToggleClick(event, d);
                }
            });

        const circle = toggleGroup.append('circle')
            .attr('r', 8)
            .attr('cx', 30)
            .attr('cy', 2)
            .attr('class', d => d.children ? 'toggle-open' : 'toggle-closed')
            .style('display', d => (d.data.children && d.data.children.length > 0) ? 'block' : 'none');

        toggleGroup.append('path')
            .attr('x', 30)
            .attr('y', 0)
            .attr('fill', '#fff')
            .style('display', d => (d.data.children && d.data.children.length > 0) ? 'block' : 'none')
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
        typeTag.each(function(d) {
            const textWidth = this.querySelector('text').getComputedTextLength();
            const rectWidth = textWidth + 20;
            d3.select(this).select('rect').attr('width', rectWidth);

            const hasToggle = d.data.children && d.data.children.length > 0;
            const typeTagStartX = hasToggle ? 21 : 5;
            const nodeNameElement = d3.select(this.parentNode).select('.node-name');
            nodeNameElement.attr('x', typeTagStartX + rectWidth + 5);
        });
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
            .attr('class', d => d.children ? 'toggle-open' : 'toggle-closed');

        nodeUpdate.select('.toggle-btn path')
            .attr('d', d => d.children ? 'M 26 1 L 34 1 L 34 3 L 26 3 Z' : 'M 26 0 L 34 0 L 30 5 Z');

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
