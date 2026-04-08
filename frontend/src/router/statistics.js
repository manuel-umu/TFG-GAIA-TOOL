import StatisticsView from '../views/StatisticsView.vue';

const statisticsRoutes = [
    { 
        path: '/statistics', 
        name: 'Statistics',
        component: StatisticsView ,
        meta: { requiresAuth: true }
    }, 
];

export default statisticsRoutes;