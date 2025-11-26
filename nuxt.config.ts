// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  app: {
    head: {
      title: 'TTM 트리 시각화 NUXT 버전',
      htmlAttrs: {
        lang: 'ko',
      },
    }
  },
  // 공통 전역 변수 scss 지정
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/base/variables.scss" as *;',
        },
      },
    }
  },
  modules: [
    'nuxt-font-loader',
    '@pinia/nuxt',
  ],
  // // 전역 css 선언
  // css: [
  //   '~/assets/scss/base/reset.scss',
  //   '~/assets/scss/base/iconfont.scss',
  //   '~/assets/scss/base/variables.scss',
  //   '~/assets/scss/base/animation.scss',
  //   '~/assets/scss/common.scss',
  // ],
  // @ts-ignore - nuxt-font-loader 모듈 타입 정의 없음
  fontLoader: {
    local: [
      {
        src: '/fonts/khnp/한수원_한울림_R.ttf',
        family: 'khnpHanulim',
        weight: 'normal',
        display: 'swap',
      }
    ]
  }
})
