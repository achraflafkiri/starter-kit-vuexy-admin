import { useRouter } from 'next/router';

// Function to store token in local storage or cookies
export const storeAuthToken = (token: string) => {
  localStorage.setItem('accessToken', token); // Storing in localStorage
};

// Function to check if token exists
export const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken'); // Checking in localStorage
  return !!token; // Return true if token exists, false otherwise
};
