export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch (error) {
    return null;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const hasRole = (allowedRoles, userRole) => {
  return allowedRoles.includes(userRole);
};