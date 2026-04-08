import IndicatorView from '../views/IndicatorView.vue';

const indicatorRoutes = [
    { 
        path: '/indicators', 
        name: 'Indicators',
        component: IndicatorView ,
        meta: { requiresAuth: true }
    }
];

export default indicatorRoutes;