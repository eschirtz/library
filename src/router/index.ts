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
    {
      path: '/cabin',
      component: () => import('@/views/CabinView.vue'),
      meta: { title: 'Cabin' },
    },
  ],
})

router.afterEach((to) => {
  document.title = (to.meta.title as string) ?? 'eschirtz'
})

export default router
