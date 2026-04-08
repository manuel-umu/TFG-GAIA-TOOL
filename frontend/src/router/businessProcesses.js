import BusinessProcessesView from '../views/BusinessProcessesView.vue';

const businessProcessesRoutes = [
    { 
        path: '/businessprocesses', 
        name: 'BusinessProcesses',
        component: BusinessProcessesView ,
        meta: { requiresAuth: true }
    }, 
];

export default businessProcessesRoutes;