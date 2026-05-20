export const ROUTES = {
  // LANDING PAGE
  HOME: '/',

  // AUTH
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // User
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  PROFILE: '/profile',

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users-management',
  ADMIN_ROLES: '/admin/roles-management',

  // ERROR
  UNAUTHORIZED: '/unauthorized',
};

export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
];

export const ADMIN_ROUTES = [
  ROUTES.ADMIN,
  ROUTES.ADMIN_USERS,
  ROUTES.ADMIN_ROLES,
];

/** Routes that should redirect if already authenticated */
export const AUTH_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
];
