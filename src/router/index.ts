import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: 'eschirtz' },
    },
    {
      path: '/solar-punk',
      component: () => import('@/views/SolarPunkView.vue'),
      meta: { title: 'Solar Punk' },
    },
  ],
})

router.afterEach((to) => {
  document.title = to.meta.title ?? 'eschirtz'
})

export default router
