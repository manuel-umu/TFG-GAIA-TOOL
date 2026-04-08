import BusinessProcessView from '../views/BusinessProcessesView.vue';
import OrganizationView from '..//views/OrganizationView.vue';


const organizationRoutes = [
    { 
        path: '/organizations', 
        name: 'Organization',
        component: OrganizationView ,
        meta: { requiresAuth: true }
    }, 
];

export default organizationRoutes;