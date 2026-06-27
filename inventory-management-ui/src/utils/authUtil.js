const TOKEN_KEY = "inventoryflow_token";
const TOKEN_TYPE_KEY = "inventoryflow_token_type";
const USER_KEY = "inventoryflow_user";

export const saveAuthData = (authData) => {
  if (!authData || !authData.token) {
    return;
  }

  const user = {
    id: authData.id,
    name: authData.name,
    email: authData.email,
    role: authData.role,
  };

  localStorage.setItem(TOKEN_KEY, authData.token);
  localStorage.setItem(TOKEN_TYPE_KEY, authData.type || "Bearer");
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const saveUser = (user) => {
  if (!user) {
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getTokenType = () => {
  return localStorage.getItem(TOKEN_TYPE_KEY) || "Bearer";
};

export const getAuthorizationHeader = () => {
  const token = getToken();

  if (!token) {
    return null;
  }

  return `${getTokenType()} ${token}`;
};

export const getUser = () => {
  const userData = localStorage.getItem(USER_KEY);

  if (!userData) {
    return null;
  }

  try {
    return JSON.parse(userData);
  } catch (error) {
    removeAuthData();
    return null;
  }
};

export const getUserRole = () => {
  const user = getUser();
  return user?.role || null;
};

export const isAuthenticated = () => {
  return Boolean(getToken());
};

export const isAdmin = () => {
  return getUserRole() === "ADMIN";
};

export const isStaff = () => {
  return getUserRole() === "STAFF";
};

export const removeAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_TYPE_KEY);
  localStorage.removeItem(USER_KEY);
};