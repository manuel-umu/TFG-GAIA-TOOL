import FrameworksView from '../views/FrameworksView.vue';

const frameworksRoutes = [
  {
    path: '/frameworks',
    name: 'Frameworks',
    component: FrameworksView,
    meta: { requiresAuth: true },
  },
];

export default frameworksRoutes;
