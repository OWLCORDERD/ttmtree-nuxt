<template>
    <!-- 트리 컨테이너 영역-->
    <div class="container">
        <div class="tree-container">
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
                                :checked="filterCheckedYn.competency[type]" 
                                :disabled="classificationTypeDisabled.competency"/>
                            <button type="button" class="custom-checkbox" @change="handleCheckBoxChange($event, type, 'competency')">
                                <CheckBox />
                            </button>
                            <label :for="'competency-' + type">{{ displayTypesName(type) }}</label>
                        </div>
                    </div>
                </div>
                <div class="search-controls">
                    <!-- 검색어 입력 필드 (역량체계) -->
                    <div class="search-box">
                        <input type="text"
                        :placeholder="classificationTypeDisabled.competency ? '리더십/공통 역량은 역량체계와 매핑하지 않습니다.' : '검색어를 입력하세요.'"
                        ref="searchCompInput"
                        :disabled="classificationTypeDisabled.competency"
                        v-model="searchFrameWorkKeyword.competency.keyword" />
                        
                        <!-- 검색어 연관 목록 데이터 표시 -->
                        <ttm-search-filter
                        v-model="searchFrameWorkKeyword.competency"
                        v-if="searchFrameWorkKeyword.competency.keyword !== ''
                        && treeInstanceStore.$state.currentSearchNode?.COMP === null" />
                        
                        <button class="search-btn"
                            :disabled="classificationTypeDisabled.competency">
                            <Search />
                        </button>
                    </div>
                    <button class="refresh-btn"
                        :disabled="classificationTypeDisabled.competency"
                        @click="() => {
                            treeInstanceStore.resetSearchNode('competency');
                            searchFrameWorkKeyword.competency.keyword = '';
                        }">
                        <Refresh />
                    </button>
                </div>
                <div class="depth-controls competency">
                    <div class="depth-label">
                        <TTMPlates />
                        <span>Depth</span>
                    </div>
                    <template v-for="(item, index) in treeInstanceStore.$state.comp.types">
                        <button class="depth-btn"
                            :data-depth="index + 1"
                            :disabled="classificationTypeDisabled.competency">
                            {{ index + 1 }}
                        </button>
                    </template>
                    <!-- 전체 뎁스 컨트롤 버튼 -->
                    <div class="all-control">
                        <button class="open-all-depth"
                            :disabled="classificationTypeDisabled.competency">
                            <PlusButton />
                        </button>
                        <button class="close-all-depth"
                            :disabled="classificationTypeDisabled.competency">
                            <MinusButton />
                        </button>
                    </div>
                </div>
            </div>
            <div class="tree-area">
                <div class="tree" id="comp-tree"></div>
            </div>
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
                                :disabled="classificationTypeDisabled.job"
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
                    <!-- 검색어 입력 필드 (직무체계) -->
                    <div class="search-box">
                        <input type="text"
                        :placeholder="classificationTypeDisabled.job ? '리더십/공통 역량은 직무체계와 매핑하지 않습니다.' : '검색어를 입력하세요.'"
                        ref="searchJobInput"
                        :disabled="classificationTypeDisabled.job"
                        v-model="searchFrameWorkKeyword.job.keyword" />
                        
                        <ttm-search-filter
                            v-model="searchFrameWorkKeyword.job"
                            v-if="searchFrameWorkKeyword.job.keyword !== '' &&
                            treeInstanceStore.$state.currentSearchNode.JOB === null" />
                        
                        <button class="search-btn"
                            :disabled="classificationTypeDisabled.job">
                            <Search />
                        </button>
                    </div>
                    <button class="refresh-btn"
                    @click="() => {
                        treeInstanceStore.resetSearchNode('job');
                        searchFrameWorkKeyword.job.keyword = '';
                    }"><Refresh /></button>
                </div>
                <div class="depth-controls job">
                    <div class="depth-label">
                        <TTMPlates />
                        <span>Depth</span>
                    </div>
                    <template v-for="(item, index) in treeInstanceStore.$state.job.types">
                        <button class="depth-btn" :data-depth="index + 1"
                            :disabled="classificationTypeDisabled.job">
                            {{ index + 1 }}
                        </button>
                    </template>

                    <!-- 전체 뎁스 컨트롤 버튼 -->
                    <div class="all-control">
                        <button class="open-all-depth"
                            :disabled="classificationTypeDisabled.job">
                            <PlusButton />
                        </button>
                        <button class="close-all-depth"
                            :disabled="classificationTypeDisabled.job">
                            <MinusButton />
                        </button>
                    </div>
                </div>
            </div>
            <div class="tree-area">
                <div class="tree" id="job-tree"></div>
            </div>
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
                    <!-- 검색어 입력 필드 (교육체계) -->
                    <div class="search-box">
                        <input type="text"
                        placeholder="검색어를 입력하세요."
                        ref="searchEduInput"
                        v-model="searchFrameWorkKeyword.edu.keyword" />

                        <ttm-search-filter 
                            v-model="searchFrameWorkKeyword.edu"
                            v-if="searchFrameWorkKeyword.edu.keyword !== ''
                            && treeInstanceStore.$state.currentSearchNode?.EDU === null"
                        />
                        <button class="search-btn"><Search /></button>
                    </div>
                    <button class="refresh-btn" @click="() => {
                        treeInstanceStore.resetSearchNode('edu');
                        searchFrameWorkKeyword.edu.keyword = ''
                    }"><Refresh /></button>
                </div>
                <div class="depth-controls edu">
                    <div class="depth-label">
                        <TTMPlates />
                        <span>Depth</span>
                    </div>
                    <template v-for="(item, index) in treeInstanceStore.$state.edu.types">
                        <button class="depth-btn" 
                            :data-depth="index + 1">
                            {{ index + 1 }}
                        </button>
                    </template>

                    <!-- 전체 뎁스 컨트롤 버튼 -->
                    <div class="all-control">
                        <button class="open-all-depth"><PlusButton /></button>
                        <button class="close-all-depth"><MinusButton /></button>
                    </div>
                </div>
            </div>
            <div class="tree-area">
                <div class="tree" id="edu-tree"></div>
            </div>
        </div>
        </div>

        <div class="btn-wrap">
        <button type="button" class="btn-line-m-main"
            v-if="treeInstanceStore.$state.classificationType !== 'CONSIGNMENT'"
            @click="() => {
                treeInstanceStore.treeModeChange('mapping');
            }"
        >
            <MappingMode />
            <span class='title'
            >매핑모드</span>
        </button>
        <button type="button" class="btn-line-m-main"
            @click="() => {
                treeInstanceStore.treeModeChange('edit');
            }">
            <CourseEdit />
            <span class='title'>과정구성 편집</span>
        </button>
        <button type="button" class="btn-fill-m-main"
        @click="(e) => handleClassificationTypeChange(e, 'JOB')">
            <CourseEdit />
            <span class='title'>직무역량</span>
        </button>
        <button type="button" class="btn-fill-m-main"
        @click="(e) => handleClassificationTypeChange(e, 'LEADERSHIP')">
            <CourseEdit />
            <span class='title'>리더십/공통역량</span>
        </button>
        <button type="button" class="btn-fill-m-main"
        @click="(e) => handleClassificationTypeChange(e, 'CONSIGNMENT')">
            <CourseEdit />
            <span class='title'>수탁/컨소시엄 역량</span>
        </button>
    </div>
    </div>

    <!-- 체계 유형별 상세 모달 -->
    <ttm-detail-modal v-if="detailModalStore.modalOpen" />
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
import MappingMode from '~/assets/images/svg/ttm-connect.svg';
import CourseEdit from '~/assets/images/svg/gnb-setting.svg';

const { $treeInstance: treeInstance, 
    $drawTTMTree: drawTTMTree,
    $designConfig: designConfig } = useNuxtApp();

const treeInstanceStore = useMyTreeInstanceStore();
const detailModalStore = useMyDetailModalStore();

// 2025.12.16 [mhlim]: 역량분류 타입에 따라 검색 필터 영역 비활성화 상태관리
const classificationTypeDisabled = computed(() => {
    if (treeInstanceStore.$state.classificationType === 'LEADERSHIP') {
        return {
            competency: false,
            job: true,
        };
    } else if (treeInstanceStore.$state.classificationType === 'CONSIGNMENT') {
        return {
            competency: true,
            job: true,
        };
    } else {
        return {
            competency: false,
            job: false,
        };
    }
}, { immediate: true });

/* DOM 트리 구조 생성 이후 백터 그래픽 렌더링 시작 */
onBeforeMount(() => {
    drawTTMTree();
})

const checkBoxTypes = computed(() => {
    return {
        competency: Array.from(treeInstanceStore.$state.comp.types),
        job: treeInstanceStore.$state.job.types,
        edu: treeInstanceStore.$state.edu.types,
    }
})

// 각 체계별 동적 검색어 입력 값 및 검색어 연관 목록 데이터 관리
const searchFrameWorkKeyword = reactive({
    competency: {
        keyword: '',
        data: [],
    },
    job: {
        keyword: '',
        data: [],
    },
    edu: {
        keyword: '',
        data: [],
    },
});

// 검색 디바운스 타이머 스케줄링 관리
const searchDebounceScheduler = reactive({
    competency: null,
    job: null,
    edu: null,
});

// 2025.12.12[mhlim]: 역량체계 검색어 입력 필드 keyword 감시
// -> 스케줄링에 등록하여 1초마다 검색하도록 디바운스 적용
watch(() => searchFrameWorkKeyword.competency.keyword, (newKeyword) => {
    // 기존 타이머 클리어
    if (searchDebounceScheduler.competency) {
        clearTimeout(searchDebounceScheduler.competency);
    }

    treeInstanceStore.$state.currentSearchNode.COMP = null;
    
    // 빈 문자열이면 검색 필터링 배열 초기화
    if (newKeyword === '') {
        searchFrameWorkKeyword.competency.data = [];
        return;
    }
    
    // 1초 검색 디바운스
    searchDebounceScheduler.competency = setTimeout(() => {
        const treeRoot = treeInstanceStore.$state.comp.root;
        if(treeRoot?.data?.type === 'ROOT') {
            searchCurrentTreeDepth('competency', newKeyword, treeRoot);
        }
    }, 500);
}, { immediate: false });

// 2025.12.12[mhlim]: 직무체계 검색어 입력 필드 keyword 감시
// -> 스케줄링에 등록하여 1초마다 검색하도록 디바운스 적용
watch(() => searchFrameWorkKeyword.job.keyword, (newKeyword) => {
    // 기존 타이머 클리어
    if (searchDebounceScheduler.job) {
        clearTimeout(searchDebounceScheduler.job);
    }

    treeInstanceStore.$state.currentSearchNode.JOB = null;
    
    // 빈 문자열이면 검색 필터링 배열 초기화
    if (newKeyword === '') {
        searchFrameWorkKeyword.job.data = [];
        return;
    }
    
    // 1초 검색 디바운스
    searchDebounceScheduler.job = setTimeout(() => {
        const treeRoot = treeInstanceStore.$state.job.root;
        if(treeRoot?.data?.type === 'ROOT') {
            searchCurrentTreeDepth('job', newKeyword, treeRoot);
        }
    }, 500);
}, { immediate: false });

// 2025.12.12[mhlim]: 교육체계 검색어 입력 필드 keyword 감시
// -> 스케줄링에 등록하여 1초마다 검색하도록 디바운스 적용
watch(() => searchFrameWorkKeyword.edu.keyword, (newKeyword) => {
    // 기존 타이머 클리어
    if (searchDebounceScheduler.edu) {
        clearTimeout(searchDebounceScheduler.edu);
    }

    treeInstanceStore.$state.currentSearchNode.EDU = null;
    
    // 빈 문자열이면 검색 필터링 배열 초기화
    if (newKeyword === '') {
        searchFrameWorkKeyword.competency.data = [];
        return;
    }
    
    // 1초 검색 디바운스
    searchDebounceScheduler.edu = setTimeout(() => {
        const treeRoot = treeInstanceStore.$state.edu.root;
        if(treeRoot?.data?.type === 'ROOT') {
            searchCurrentTreeDepth('edu', newKeyword, treeRoot);
        }
    }, 500);
}, { immediate: false });

// 2025.12.12[mhlim]: 각 체계 트리별 검색 입력 값 포함된 아이템 필터링 처리
const searchCurrentTreeDepth = (itemType, keyword, currentTreeRoot) => {
    // 검색 시작 전 기존 조회 데이터 배열 초기화
    searchFrameWorkKeyword[itemType].data = [];
    
    const search = (node) => {
        if (node.data.name.includes(keyword)) {
            searchFrameWorkKeyword[itemType].data.push(node);
        }
        
        // children 검색
        if (node.children) {
            for (const child of node.children) {
                search(child);
            }
        }

        // _children 검색
        if (node._children) {
            for (const child of node._children) {
                search(child);
            }
        }
    };

    search(currentTreeRoot);
}

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

const handleClassificationTypeChange = (event, classificationType) => {
    event.preventDefault();

    treeInstanceStore.$state.classificationType = classificationType;

    // 역량분류에 따라 트리 렌더링 재생성
    drawTTMTree();
}

definePageMeta({
  layout: 'default',
})
</script>