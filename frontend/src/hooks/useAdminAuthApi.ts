import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAuthApi } from '../services/api';
import type {
  Admin,
  AdminRegistration,
  AdminRole,
  AuthResponse,
  ChangePassword,
  PageResponse,
} from '../types';
import { qk } from './queryKeys';

export interface AdminListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface AdminAuthSearchParams extends AdminListParams {
  query: string;
}

export function useAdminById(id: number | undefined) {
  return useQuery<Admin>({
    queryKey: qk.admin(id ?? -1),
    queryFn: () => adminAuthApi.getById(id as number),
    enabled: typeof id === 'number',
  });
}

export function useAdminByUsername(username: string | undefined) {
  return useQuery<Admin>({
    queryKey: qk.adminByUsername(username ?? ''),
    queryFn: () => adminAuthApi.getByUsername(username as string),
    enabled: typeof username === 'string' && username.length > 0,
  });
}

export function useAllAdmins(params: AdminListParams = {}) {
  const { page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = params;
  return useQuery<PageResponse<Admin>>({
    queryKey: qk.adminsList({ page, size, sortBy, sortDir }),
    queryFn: () => adminAuthApi.getAll(page, size, sortBy, sortDir),
  });
}

export function useSearchAdmins(params: AdminAuthSearchParams) {
  const { query, page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = params;
  return useQuery<PageResponse<Admin>>({
    queryKey: qk.adminsSearch({ query, page, size, sortBy, sortDir }),
    queryFn: () => adminAuthApi.search(query, page, size, sortBy, sortDir),
    enabled: query.length > 0,
  });
}

export function useAdminsByRole(role: AdminRole | undefined) {
  return useQuery<Admin[]>({
    queryKey: qk.adminsByRole(role ?? ''),
    queryFn: () => adminAuthApi.getByRole(role as AdminRole),
    enabled: typeof role === 'string' && role.length > 0,
  });
}

export function useActiveAdminCount() {
  return useQuery<number>({
    queryKey: qk.adminsActiveCount,
    queryFn: () => adminAuthApi.getActiveCount(),
  });
}

export function useRegisterAdmin() {
  const qc = useQueryClient();
  return useMutation<AuthResponse, Error, AdminRegistration>({
    mutationFn: (data) => adminAuthApi.register(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminsRoot });
    },
  });
}

export function useUpdateAdmin() {
  const qc = useQueryClient();
  return useMutation<Admin, Error, { id: number; data: Partial<Admin> }>({
    mutationFn: ({ id, data }) => adminAuthApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: qk.admin(id) });
      qc.invalidateQueries({ queryKey: qk.adminsRoot });
    },
  });
}

export function useDeactivateAdmin() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => adminAuthApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminsRoot });
    },
  });
}

export function useDeleteAdmin() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => adminAuthApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminsRoot });
    },
  });
}

export function useChangeAdminPassword() {
  return useMutation<string, Error, { id: number; passwords: ChangePassword }>({
    mutationFn: ({ id, passwords }) => adminAuthApi.changePassword(id, passwords),
  });
}
