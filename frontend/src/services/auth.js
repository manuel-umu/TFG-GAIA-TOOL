import axiosInstance from './axiosInstance';

async function isAuthenticated() {
    try {
        const response = await axiosInstance.get('/users/me');
        return { authenticated: true, user: response.data };
    } catch (error) {
        return { authenticated: false, user: null };
    }
}

export { isAuthenticated };