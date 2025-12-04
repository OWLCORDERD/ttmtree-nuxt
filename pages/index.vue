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
                    <div class="type-checkboxes" v-if="checkBoxTypes?.competency">
                        <div class="type-checkbox" v-for="type in checkBoxTypes.competency" :key="type">
                            <input type="checkbox"
                                :id="'competency-' + type"
                                :value="type"
                                @change="handleCheckBoxChange($event, type, 'competency')"
                                :checked="filterCheckedYn.competency[type]" />
                            <button type="button" class="custom-checkbox" @change="handleCheckBoxChange($event, type, 'competency')">
                                <CheckBox />
                            </button>
                            <label :for="'competency-' + type">{{ displayTypesName(type) }}</label>
                        </div>
                    </div>
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
                <div class="depth-controls competency">
                    <div class="depth-label">
                        <TTMPlates />
                        <span>Depth</span>
                    </div>
                    <button class="depth-btn active" data-depth="1">1</button>
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
                    <div class="type-checkboxes" v-if="checkBoxTypes?.job">
                        <div class="type-checkbox" v-for="type in checkBoxTypes.job" :key="type">
                            <input type="checkbox"
                                :id="'job-' + type"
                                :value="type"
                                @change="handleCheckBoxChange($event, type, 'competency')"
                                :checked="filterCheckedYn.job[type]" />
                            <button type="button" class="custom-checkbox" @change="handleCheckBoxChange($event, type, 'job')">
                                <CheckBox />
                            </button>
                            <label :for="'job-' + type">{{ displayTypesName(type) }}</label>
                        </div>
                    </div>
                </div>
                <div class="search-controls">
                    <div class="search-box">
                        <input type="text" placeholder="검색어를 입력하세요." />
                        <button class="search-btn"><Search /></button>
                    </div>
                    <button class="refresh-btn"><Refresh /></button>
                </div>
                <div class="depth-controls job">
                    <div class="depth-label">
                        <TTMPlates />
                        <span>Depth</span>
                    </div>
                    <button class="depth-btn active" data-depth="1">1</button>
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
                    <div class="type-checkboxes" v-if="checkBoxTypes?.edu">
                        <div class="type-checkbox" v-for="type in checkBoxTypes.edu" :key="type">
                            <input type="checkbox"
                                :id="'edu-' + type"
                                :value="type"
                                @change="handleCheckBoxChange($event, type, 'edu')"
                                :checked="filterCheckedYn.edu[type]" />
                            <button type="button" class="custom-checkbox" @change="handleCheckBoxChange($event, type, 'edu')">
                                <CheckBox />
                            </button>
                            <label :for="'edu-' + type">{{ displayTypesName(type) }}</label>
                        </div>
                    </div>
                </div>
                <div class="search-controls">
                    <div class="search-box">
                        <input type="text" placeholder="검색어를 입력하세요." />
                        <button class="search-btn"><Search /></button>
                    </div>
                    <button class="refresh-btn"><Refresh /></button>
                </div>
                <div class="depth-controls edu">
                    <div class="depth-label">
                        <TTMPlates />
                        <span>Depth</span>
                    </div>
                    <button class="depth-btn active" data-depth="1">1</button>
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
import CheckBox from '~/assets/images/svg/check.svg';

const { $treeInstance: treeInstance, 
    $ttmController: ttmController,
    $designConfig: designConfig } = useNuxtApp();

const treeInstanceStore = useMyTreeInstanceStore();

/* DOM 트리 구조 생성 이후 백터 그래픽 렌더링 시작 */
onBeforeMount(() => {
    treeInstance.forEach(instance => {
        ttmController(instance.containerId, instance.dataUrl, instance.checkboxContainerId);
    });
})

onMounted(() => {
    loading.value = false;
})

const checkBoxTypes = computed(() => {
    return {
        competency: Array.from(treeInstanceStore.$state.Tree_competency.types),
        job: treeInstanceStore.$state.Tree_job.types,
        edu: treeInstanceStore.$state.Tree_edu.types,
    }
})

// 2025.12.03[mhlim]: 각 트리 컨테이너 체크박스 필터 상태관리
const filterCheckedYn = ref({
    // 역량 체계
    competency: {
        'COMPETENCY': true, // 역량
        'BEHAVIORAL_INDICATOR': true, // 행동지표
    },
    // 직무 체계
    job: {
        'JOB_FAMILY': true, // 직계
        'JOB_SERIES': true, // 직렬
        'JOB': true, // 직무
        'TASK': true, // Task
        'KST': true, // K/S/T
    },
    // 교육 체계
    edu: {
        'COURSE': true, // 교육과정
        'LESSON': true, // 교과목
        'LEARNING_OBJECT': true, // 학습목표
        'MODULE': true, // 모듈
    }
})

const loading = ref(true);

const displayTypesName = (type) => {
    if (designConfig?.types?.displayNames[type]) {
        return designConfig?.types?.displayNames?.[type];
    } else {
        return type;
    }
}

const handleCheckBoxChange = (event, type, category) => {
    event.preventDefault();

    const currentContainer = filterCheckedYn.value[category];

    currentContainer[type] = !currentContainer[type];
}

definePageMeta({
  layout: 'default',
})
</script>