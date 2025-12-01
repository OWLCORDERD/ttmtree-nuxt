import * as d3 from 'd3';
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
        this.onToggleClick = null; // Callback for toggle click
        this.onMappingClick = null; // Callback for mapping icon click
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
            .attr('transform', `translate(${this.designConfig.tree.margin.left}, ${this.designConfig.tree.margin.top})`);

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
            const typeTagStartX = hasToggle ? 21 : 5;

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
            .attr('x', 0)
            .attr('y', -this.nodeHeight / 2 + 3)
            .attr('width', '100%')
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

        // Toggle button
        this.createToggleButton(nodeContent);

        // Type tag
        this.createTypeTag(nodeContent);

        // Node name
        this.createNodeName(nodeContent);

        // Right info (count)
        this.createRightInfo(nodeEnter);

        // Tooltip
        nodeEnter.append('title')
            .text(d => `${d.data.type}: ${d.data.name}`);

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

        toggleGroup.append('circle')
            .attr('r', 8)
            .attr('cx', 0)
            .attr('cy', 2)
            .attr('class', d => d.children ? 'toggle-open' : 'toggle-closed')
            .style('display', d => (d.data.children && d.data.children.length > 0) ? 'block' : 'none');

        toggleGroup.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .style('font-size', '10px')
            .style('fill', '#fff')
            .style('pointer-events', 'none')
            .style('display', d => (d.data.children && d.data.children.length > 0) ? 'block' : 'none')
            .text(d => d.children ? '−' : '+');
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
                const xPos = hasToggle ? 21 : 5;
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
            .text(d => d.data.name)
            .on('click', (event, d) => {
                // Node name click shows detail modal for all types
                if (this.onNodeClick) {
                    event.stopPropagation();
                    this.onNodeClick(event, d);
                }
        });
    }
 
    /**
     * Create right info section
     * @param {Selection} nodeEnter - Node enter selection
     */
    createRightInfo(nodeEnter) {
        const rightInfo = nodeEnter.append('g')
            .attr('class', 'right-info')
            .attr('transform', `translate(450, 0)`);

        rightInfo.append('text')
            .attr('class', 'node-count')
            .attr('x', 0)
            .attr('y', 5)
            .style('font-size', '11px')
            .style('fill', '#999')
            .style('cursor', 'pointer')
            .style('display', d => this.isClickableType(d.data.type) ? 'block' : 'none')
            .text('↔ 99')
            .on('click', (event, d) => {
                if (this.isClickableType(d.data.type)) {
                    event.stopPropagation();
                    if (this.onMappingClick) {
                        this.onMappingClick(event, d);
                    }
                }
            });
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

        nodeUpdate.select('.toggle-btn text')
            .text(d => d.children ? '−' : '+');

        // Update type tag positions
        nodeUpdate.select('.type-tag').each(function(d) {
            const hasToggle = d.data.children && d.data.children.length > 0;
            const typeTagStartX = hasToggle ? 21 : 5;

            d3.select(this).attr('transform', `translate(${typeTagStartX}, 0)`);

            const textElement = this.querySelector('text');
            if (textElement) {
                const textWidth = textElement.getComputedTextLength();
                const rectWidth = textWidth + 10;
                d3.select(this).select('rect').attr('width', rectWidth);

                const nodeNameElement = d3.select(this.parentNode).select('.node-name');
                nodeNameElement.attr('x', typeTagStartX + rectWidth + 5);
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
}
