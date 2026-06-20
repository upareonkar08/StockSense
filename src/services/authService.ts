import type { User } from '../types';
import { dummyUser } from '../data/dummyData';

export const login = async (email: string, _password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulates network delay
  return { ...dummyUser, email };
};

export const signup = async (data: any): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulates network delay
  return {
    ...dummyUser,
    name: data.name || dummyUser.name,
    email: data.email || dummyUser.email,
  };
};

export const logout = async (): Promise<null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return null;
};
