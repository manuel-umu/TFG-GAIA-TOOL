import ReportsView from '../views/ReportsView.vue';

const reportsRoutes = [
    { 
        path: '/reports', 
        name: 'Reports',
        component: ReportsView ,
        meta: { requiresAuth: true }
    }, 
];

export default reportsRoutes;