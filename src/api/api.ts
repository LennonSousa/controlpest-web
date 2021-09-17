import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 20000,
});

// Add a response interceptor
api.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
}, function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    //console.log('api interceptou error response');

    //console.log('verificando status');

    try {
        if (error.response.status === 401) {
            console.log('--401--');

            // Cookies.remove('user');
            // Cookies.remove('token');

            //window.location.reload();
        }
    }
    catch { }

    return Promise.reject(error);
});

export default api;