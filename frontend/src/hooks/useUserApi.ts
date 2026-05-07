import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../services/api';
import type { User, UserRegistration, LoginCredentials, AuthResponse } from '../types';
import { qk } from './queryKeys';

export function useUserById(id: number | undefined) {
  return useQuery<User>({
    queryKey: qk.user(id ?? -1),
    queryFn: () => userApi.getById(id as number),
    enabled: typeof id === 'number',
  });
}

export function useUserByUsername(username: string | undefined) {
  return useQuery<User>({
    queryKey: qk.userByUsername(username ?? ''),
    queryFn: () => userApi.getByUsername(username as string),
    enabled: typeof username === 'string' && username.length > 0,
  });
}

export function useAllUsers() {
  return useQuery<User[]>({
    queryKey: qk.usersRoot,
    queryFn: () => userApi.getAll(),
  });
}

export function useRegisterUser() {
  return useMutation<AuthResponse, Error, UserRegistration>({
    mutationFn: (data) => userApi.register(data),
  });
}

export function useLoginUser() {
  return useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: (creds) => userApi.login(creds),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation<User, Error, { id: number; data: Partial<User> }>({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: qk.user(id) });
      qc.invalidateQueries({ queryKey: qk.usersRoot });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => userApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.usersRoot });
    },
  });
}
