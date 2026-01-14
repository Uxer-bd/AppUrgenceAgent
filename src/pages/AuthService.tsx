import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'auth-token';
const USER_ROLE_KEY = 'user-role';
const USER_DATA_KEY = 'user-data';

export const saveAuthData = async (token: string, user: any) => {
    await Preferences.set({ key: TOKEN_KEY, value: token });
    await Preferences.set({ key: USER_ROLE_KEY, value: user.role });
    await Preferences.set({ key: USER_DATA_KEY, value: JSON.stringify(user) });
};

export const getAuthSession = async () => {
    const token = await Preferences.get({ key: TOKEN_KEY });
    const role = await Preferences.get({ key: USER_ROLE_KEY });
    return { token: token.value, role: role.value };
};

export const clearAuthData = async () => {

    await Preferences.remove({ key: 'auth-token' });
    await Preferences.remove({ key: 'user-role' });
    await Preferences.remove({ key: 'user-data' });

    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    // Optionnel: vider aussi le localStorage par sécurité
    localStorage.clear();
};