import AuditsView from '../views/AuditsView.vue';

const auditsRoutes = [
    { 
        path: '/audits', 
        name: 'Audits',
        component: AuditsView ,
        meta: { requiresAuth: true }
    }, 
];

export default auditsRoutes;