<template>
    <div class="container">
        <div class="tree-panel">
            <div class="panel-header comp-header">
                <h2><span class="icon">💡</span> 역량체계<span class="subtitle">KHNP Competency Framework</span></h2>
            </div>
            <div class="filter-section">
                <div class="filter-controls">
                    <button class="filter-toggle">
                        <span class="icon">☰</span> Filter
                    </button>
                    <div class="type-checkboxes" id="comp-checkboxes"></div>
                </div>
                <div class="search-controls">
                    <div class="search-box">
                        <input type="text" placeholder="검색어를 입력하세요." />
                        <button class="search-btn">🔍</button>
                    </div>
                    <button class="refresh-btn">🔄</button>
                </div>
                <div class="depth-controls">
                    <span class="depth-label">🔲 Depth</span>
                    <button class="depth-btn" data-depth="1">1</button>
                    <button class="depth-btn" data-depth="2">2</button>
                    <button class="depth-btn" data-depth="3">3</button>
                    <button class="depth-btn" data-depth="4">4</button>
                    <button class="depth-btn" data-depth="5">5</button>
                </div>
            </div>
            <div id="tree1" class="tree"></div>
        </div>

        <div class="tree-panel">
            <div class="panel-header job-header">
                <h2><span class="icon">📋</span> 직무체계<span class="subtitle">KHNP Job Framework</span></h2>
            </div>
            <div class="filter-section">
                <div class="filter-controls">
                    <button class="filter-toggle">
                        <span class="icon">☰</span> Filter
                    </button>
                    <div class="type-checkboxes" id="job-checkboxes"></div>
                </div>
                <div class="search-controls">
                    <div class="search-box">
                        <input type="text" placeholder="검색어를 입력하세요." />
                        <button class="search-btn">🔍</button>
                    </div>
                    <button class="refresh-btn">🔄</button>
                </div>
                <div class="depth-controls">
                    <span class="depth-label">🔲 Depth</span>
                    <button class="depth-btn" data-depth="1">1</button>
                    <button class="depth-btn" data-depth="2">2</button>
                    <button class="depth-btn" data-depth="3">3</button>
                    <button class="depth-btn" data-depth="4">4</button>
                    <button class="depth-btn" data-depth="5">5</button>
                </div>
            </div>
            <div id="tree2" class="tree"></div>
        </div>

        <div class="tree-panel">
            <div class="panel-header edu-header">
                <h2><span class="icon">📚</span> 교육체계<span class="subtitle">KHNP Learning Framework</span></h2>
            </div>
            <div class="filter-section">
                <div class="filter-controls">
                    <button class="filter-toggle">
                        <span class="icon">☰</span> Filter
                    </button>
                    <div class="type-checkboxes" id="edu-checkboxes"></div>
                </div>
                <div class="search-controls">
                    <div class="search-box">
                        <input type="text" placeholder="검색어를 입력하세요." />
                        <button class="search-btn">🔍</button>
                    </div>
                    <button class="refresh-btn">🔄</button>
                </div>
                <div class="depth-controls">
                    <span class="depth-label">🔲 Depth</span>
                    <button class="depth-btn" data-depth="1">1</button>
                    <button class="depth-btn" data-depth="2">2</button>
                    <button class="depth-btn" data-depth="3">3</button>
                    <button class="depth-btn" data-depth="4">4</button>
                    <button class="depth-btn" data-depth="5">5</button>
                </div>
            </div>
            <div id="tree3" class="tree"></div>
        </div>
    </div>
</template>

<script setup>
import * as d3 from 'd3';

definePageMeta({
  layout: 'default',
})
</script>

<style>

</style>