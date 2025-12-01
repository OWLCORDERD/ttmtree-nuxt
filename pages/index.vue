<template>
    <div class="container">
        <div class="tree-panel">
            <div class="panel-header comp-header">
                <div class="index-title">
                    <TTMBulb />
                    <p class="title">역량체계</p>
                </div>
                <span class="sub-title">KHNP Competency Framework</span>
            </div>
            <div class="filter-section">
                <div class="filter-controls">
                    <button class="filter-toggle">
                        <span class="icon"><TTMFilter /></span> Filter
                    </button>
                    <div class="type-checkboxes" id="comp-checkboxes"></div>
                </div>
                <div class="search-controls">
                    <div class="search-box">
                        <input type="text" placeholder="검색어를 입력하세요." />
                        <button class="search-btn">
                            <Search />
                        </button>
                    </div>
                    <button class="refresh-btn">
                        <Refresh />
                    </button>
                </div>
                <div class="depth-controls">
                    <div class="depth-label">
                        <TTMPlates />
                        <span>Depth</span>
                    </div>
                    <button class="depth-btn" data-depth="1">1</button>
                    <button class="depth-btn" data-depth="2">2</button>
                    <button class="depth-btn" data-depth="3">3</button>
                    <button class="depth-btn" data-depth="4">4</button>
                    <button class="depth-btn" data-depth="5">5</button>

                    <!-- 전체 뎁스 컨트롤 버튼 -->
                    <div class="all-control">
                        <button class="open-all-depth"><PlusButton /></button>
                        <button class="close-all-depth"><MinusButton /></button>
                    </div>
                </div>
            </div>
            <div id="comp-tree" class="tree"></div>
        </div>

        <div class="tree-panel">
            <div class="panel-header job-header">
                <div class="index-title">
                    <TTMOfficeBag />
                    <p class="title">직무체계</p>
                </div>
                <span class="sub-title">KHNP Job Framework</span>
            </div>
            <div class="filter-section">
                <div class="filter-controls">
                    <button class="filter-toggle">
                        <span class="icon"><TTMFilter /></span> Filter
                    </button>
                    <div class="type-checkboxes" id="job-checkboxes"></div>
                </div>
                <div class="search-controls">
                    <div class="search-box">
                        <input type="text" placeholder="검색어를 입력하세요." />
                        <button class="search-btn"><Search /></button>
                    </div>
                    <button class="refresh-btn"><Refresh /></button>
                </div>
                <div class="depth-controls">
                    <div class="depth-label">
                        <TTMPlates />
                        <span>Depth</span>
                    </div>
                    <button class="depth-btn" data-depth="1">1</button>
                    <button class="depth-btn" data-depth="2">2</button>
                    <button class="depth-btn" data-depth="3">3</button>
                    <button class="depth-btn" data-depth="4">4</button>
                    <button class="depth-btn" data-depth="5">5</button>

                    <!-- 전체 뎁스 컨트롤 버튼 -->
                    <div class="all-control">
                        <button class="open-all-depth"><PlusButton /></button>
                        <button class="close-all-depth"><MinusButton /></button>
                    </div>
                </div>
            </div>
            <div id="job-tree" class="tree"></div>
        </div>

        <div class="tree-panel">
            <div class="panel-header edu-header">
                <div class="index-title">
                    <TTMOpenBook />
                    <p class="title">교육체계</p>
                </div>
                <span class="sub-title">KHNP Learning Framework</span>
            </div>
            <div class="filter-section">
                <div class="filter-controls">
                    <button class="filter-toggle">
                        <span class="icon"><TTMFilter /></span> Filter
                    </button>
                    <div class="type-checkboxes" id="edu-checkboxes"></div>
                </div>
                <div class="search-controls">
                    <div class="search-box">
                        <input type="text" placeholder="검색어를 입력하세요." />
                        <button class="search-btn"><Search /></button>
                    </div>
                    <button class="refresh-btn"><Refresh /></button>
                </div>
                <div class="depth-controls">
                    <div class="depth-label">
                        <TTMPlates />
                        <span>Depth</span>
                    </div>
                    <button class="depth-btn" data-depth="1">1</button>
                    <button class="depth-btn" data-depth="2">2</button>
                    <button class="depth-btn" data-depth="3">3</button>
                    <button class="depth-btn" data-depth="4">4</button>
                    <button class="depth-btn" data-depth="5">5</button>

                    <!-- 전체 뎁스 컨트롤 버튼 -->
                    <div class="all-control">
                        <button class="open-all-depth"><PlusButton /></button>
                        <button class="close-all-depth"><MinusButton /></button>
                    </div>
                </div>
            </div>
            <div id="edu-tree" class="tree"></div>
        </div>
    </div>
</template>

<script setup>
import TTMBulb from '~/assets/images/svg/ttm-bulb.svg';
import TTMOfficeBag from '~/assets/images/svg/ttm-office-bag.svg';
import TTMOpenBook from '~/assets/images/svg/ttm-open-book.svg';
import TTMFilter from '~/assets/images/svg/ttm-filter-line.svg';
import TTMPlates from '~/assets/images/svg/plates.svg';
import PlusButton from '~/assets/images/svg/add.svg';
import MinusButton from '~/assets/images/svg/minus.svg';
import Search from '~/assets/images/svg/btn-search.svg';
import Refresh from '~/assets/images/svg/btn-reset.svg';

const { $treeInstance: treeInstance, $ttmController: ttmController } = useNuxtApp();

/* DOM 트리 구조 생성 이후 백터 그래픽 렌더링 시작 */
onBeforeMount(() => {
    treeInstance.forEach(instance => {
        ttmController(instance.containerId, instance.dataUrl, instance.checkboxContainerId);
    });
})

definePageMeta({
  layout: 'default',
})
</script>

<style>

</style>