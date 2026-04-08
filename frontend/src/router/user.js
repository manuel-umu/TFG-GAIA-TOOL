import WelcomeView from '../views/WelcomeView.vue';
import LoginView from '../views/LoginView.vue';
import HomeView from '../views/HomeView.vue';
import ConfigurationView from '../views/ConfigurationView.vue';
import ProfileView from '../views/ProfileView.vue';

const userRoutes = [
    {
    path: '/',
    redirect: '/home'
    },
    { 
        path: '/welcome', 
        name: 'Welcome',
        component: WelcomeView 
    },
    { 
        path: '/login', 
        name: 'Login',
        component: LoginView 
    },
    { 
        path: '/signup', 
        name: 'Signup',
        component: LoginView 
    },
    { 
        path: '/profile', 
        name: 'Profile',
        component: ProfileView,
        meta: { requiresAuth: true } 
    },
    { 
        path: '/home', 
        name: 'Home',
        component: HomeView,
        meta: { requiresAuth: true } 
    }, 
    { 
        path: '/settings', 
        name: 'Configuration',
        component: ConfigurationView,
        meta: { requiresAuth: true } 
    }, 
    
];

export default userRoutes;