import api from '../api/api';
import Cookies from 'js-cookie';

export async function TokenVerify(token: string) {
    if (!token) return 'not-authorized';

    try {
        const res = await api.get('/users/authenticated',
            {
                validateStatus: function (status) {
                    return status < 500; // Resolve only if the status code is less than 500.
                },
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (res.status !== 202) { // Not authenticated, token invalid!
            Cookies.remove('user');
            Cookies.remove('token');

            return "not-authorized";
        }

        return "authorized";
    }
    catch {
        return "error";
    }
}