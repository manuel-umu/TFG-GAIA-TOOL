import FrameworksView from '../views/FrameworksView.vue';

const frameworksRoutes = [
  {
    path: '/frameworks',
    name: 'Frameworks',
    component: FrameworksView,
    meta: { requiresAuth: true },
  },
  {
    path: '/frameworks/upload',
    name: 'FrameworkUpload',
    component: () => import('../views/FrameworkUploadView.vue'),
    meta: { requiresAuth: true },
  },
];

export default frameworksRoutes;
