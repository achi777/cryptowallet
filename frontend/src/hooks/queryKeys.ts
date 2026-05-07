export const qk = {
  // users
  usersRoot: ['users'] as const,
  user: (id: number) => ['users', id] as const,
  userByUsername: (username: string) => ['users', 'byUsername', username] as const,
  // wallets
  walletsRoot: ['wallets'] as const,
  wallet: (id: number) => ['wallets', id] as const,
  walletsByUser: (userId: number) => ['wallets', 'byUser', userId] as const,
  walletByAddress: (addr: string) => ['wallets', 'byAddress', addr] as const,
  // transactions
  transactionsRoot: ['transactions'] as const,
  transaction: (hash: string) => ['transactions', 'byHash', hash] as const,
  transactionsByWallet: (walletId: number) => ['transactions', 'byWallet', walletId] as const,
  transactionsByUser: (userId: number) => ['transactions', 'byUser', userId] as const,
  // admin dashboard
  adminUsers: (params: object) => ['admin', 'users', params] as const,
  adminUsersSearch: (params: object) => ['admin', 'users', 'search', params] as const,
  adminWallets: (params: object) => ['admin', 'wallets', params] as const,
  adminWalletsSearch: (params: object) => ['admin', 'wallets', 'search', params] as const,
  adminTransactions: (params: object) => ['admin', 'transactions', params] as const,
  adminTransactionsSearch: (params: object) => ['admin', 'transactions', 'search', params] as const,
  adminTransactionsPending: (params: object) => ['admin', 'transactions', 'pending', params] as const,
  adminStats: ['admin', 'stats'] as const,
  adminAnalyticsUsers: (start: string, end: string) => ['admin', 'analytics', 'users', start, end] as const,
  adminAnalyticsTx: (start: string, end: string) => ['admin', 'analytics', 'tx', start, end] as const,
  adminAnalyticsVolume: (start: string, end: string, currency: string) =>
    ['admin', 'analytics', 'volume', start, end, currency] as const,
  // admin auth
  adminsRoot: ['admins'] as const,
  admin: (id: number) => ['admins', id] as const,
  adminByUsername: (username: string) => ['admins', 'byUsername', username] as const,
  adminsByRole: (role: string) => ['admins', 'byRole', role] as const,
  adminsList: (params: object) => ['admins', 'list', params] as const,
  adminsSearch: (params: object) => ['admins', 'search', params] as const,
  adminsActiveCount: ['admins', 'activeCount'] as const,
};
