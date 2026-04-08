import Vue from 'vue';
import Router from 'vue-router';
import userRoutes from './user';
import organizationRoutes from './organizations';
import indicatorRoutes from './indicators';
import processesRoutes from './businessProcesses';
import auditsRoutes from './audits';
import reportsRoutes from './reports';
import statisticsRoutes from './statistics';
import { isAuthenticated } from '../services/auth';

Vue.use(Router);

const router = new Router({
    mode: 'history',
    routes: [
        ...userRoutes,
        ...organizationRoutes,
        ...indicatorRoutes,
        ...processesRoutes,
        ...auditsRoutes,
        ...reportsRoutes,
        ...statisticsRoutes,
        {
            path: '*',
            meta: { is404: true }
        }
    ]
});

router.beforeEach(async (to, from, next) => {
  const logged = await isAuthenticated();

  if (logged.authenticated && ['Login', 'Welcome'].includes(to.name)) {
    return next({ name: 'Home' });
  }

  if (to.matched.some(record => record.meta.is404)) {
    if (logged.authenticated) {
      return next({ name: 'Home' });
    } else {
      return next({ name: 'Welcome' });
    }
  }

  if (!logged.authenticated && to.matched.some(record => record.meta.requiresAuth)) {
    if (['Home'].includes(to.name)){
      return next({ name: 'Welcome' });
    } else {
      return next({ name: 'Login' });
    }
  }
  
  next();
});


export default router;