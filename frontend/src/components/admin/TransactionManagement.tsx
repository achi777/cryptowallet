import React, { useState, useEffect } from 'react';
import { Transaction, PageResponse, TransactionStatus, TransactionType } from '../../types';
import { adminDashboardApi } from '../../services/adminApi';

const TransactionManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<PageResponse<Transaction>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<string>('desc');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>(undefined);

  useEffect(() => {
    loadTransactions();
  }, [currentPage, pageSize, sortBy, sortDir, statusFilter, typeFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      let transactionResponse: PageResponse<Transaction>;
      
      if (searchQuery.trim()) {
        transactionResponse = await adminDashboardApi.searchTransactions(searchQuery, currentPage, pageSize, sortBy, sortDir);
      } else {
        transactionResponse = await adminDashboardApi.getAllTransactions(
          currentPage, 
          pageSize, 
          sortBy, 
          sortDir, 
          statusFilter, 
          typeFilter
        );
      }
      
      setTransactions(transactionResponse);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    loadTransactions();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(0);
    loadTransactions();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setCurrentPage(0);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  const formatTxHash = (hash: string) => {
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}`;
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TransactionStatus.CONFIRMED:
        return 'bg-green-100 text-green-800';
      case TransactionStatus.FAILED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING:
        return '⏳';
      case TransactionStatus.CONFIRMED:
        return '✅';
      case TransactionStatus.FAILED:
        return '❌';
      default:
        return '❓';
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    return type === TransactionType.SEND ? '📤' : '📥';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">📈 Transaction Management</h2>
        <div className="text-sm text-muted">
          Total: {transactions.totalElements} transactions
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium mb-1">Search Transactions</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by hash or address..."
                className="form-input flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="btn btn-primary">
                🔍 Search
              </button>
              {searchQuery && (
                <button onClick={handleClearSearch} className="btn btn-secondary">
                  ✖️ Clear
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter || 'all'}
              onChange={(e) => {
                const value = e.target.value;
                setStatusFilter(value === 'all' ? undefined : value as TransactionStatus);
                setCurrentPage(0);
              }}
              className="form-input"
            >
              <option value="all">All Status</option>
              <option value={TransactionStatus.PENDING}>Pending</option>
              <option value={TransactionStatus.CONFIRMED}>Confirmed</option>
              <option value={TransactionStatus.FAILED}>Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={typeFilter || 'all'}
              onChange={(e) => {
                const value = e.target.value;
                setTypeFilter(value === 'all' ? undefined : value as TransactionType);
                setCurrentPage(0);
              }}
              className="form-input"
            >
              <option value="all">All Types</option>
              <option value={TransactionType.SEND}>Send</option>
              <option value={TransactionType.RECEIVE}>Receive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Page Size</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
              className="form-input"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-lg font-bold">
            {transactions.content.filter(t => t.status === TransactionStatus.PENDING).length}
          </div>
          <div className="text-sm text-muted">Pending</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-lg font-bold">
            {transactions.content.filter(t => t.status === TransactionStatus.CONFIRMED).length}
          </div>
          <div className="text-sm text-muted">Confirmed</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl mb-2">❌</div>
          <div className="text-lg font-bold">
            {transactions.content.filter(t => t.status === TransactionStatus.FAILED).length}
          </div>
          <div className="text-sm text-muted">Failed</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-lg font-bold">{transactions.totalElements}</div>
          <div className="text-sm text-muted">Total</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg">🔄 Loading transactions...</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('id')}>
                      ID {getSortIcon('id')}
                    </th>
                    <th className="text-left py-3 px-4">Hash</th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('type')}>
                      Type {getSortIcon('type')}
                    </th>
                    <th className="text-left py-3 px-4">From</th>
                    <th className="text-left py-3 px-4">To</th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('amount')}>
                      Amount {getSortIcon('amount')}
                    </th>
                    <th className="text-left py-3 px-4">Fee</th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('status')}>
                      Status {getSortIcon('status')}
                    </th>
                    <th className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('createdAt')}>
                      Date {getSortIcon('createdAt')}
                    </th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.content.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono">{transaction.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-sm" title={transaction.txHash}>
                          {formatTxHash(transaction.txHash)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTypeIcon(transaction.type)}</span>
                          <span className="font-medium">{transaction.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-sm" title={transaction.fromAddress}>
                          {formatAddress(transaction.fromAddress)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-sm" title={transaction.toAddress}>
                          {formatAddress(transaction.toAddress)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold">
                          {transaction.amount.toFixed(8)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-sm">
                          {transaction.fee ? transaction.fee.toFixed(8) : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${getStatusColor(transaction.status)}`}>
                          <span>{getStatusIcon(transaction.status)}</span>
                          {transaction.status}
                        </span>
                        {transaction.confirmations !== undefined && (
                          <div className="text-xs text-muted mt-1">
                            {transaction.confirmations} confirmations
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">{formatDate(transaction.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            className="btn btn-secondary btn-small"
                            title="View details"
                            onClick={() => alert(`Transaction details for ${transaction.txHash} - Feature coming soon!`)}
                          >
                            👁️
                          </button>
                          {transaction.memo && (
                            <button
                              className="btn btn-secondary btn-small"
                              title={`Memo: ${transaction.memo}`}
                            >
                              📝
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.content.length === 0 && !loading && (
              <div className="text-center py-8 text-muted">
                {searchQuery ? 'No transactions found matching your search.' : 'No transactions found.'}
              </div>
            )}

            {/* Pagination */}
            {transactions.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-sm text-muted">
                  Showing {transactions.number * transactions.size + 1} to {Math.min((transactions.number + 1) * transactions.size, transactions.totalElements)} of {transactions.totalElements} transactions
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(transactions.number - 1)}
                    disabled={transactions.first}
                    className="btn btn-secondary btn-small"
                  >
                    ← Previous
                  </button>
                  
                  {[...Array(Math.min(5, transactions.totalPages))].map((_, index) => {
                    const pageNum = Math.max(0, Math.min(transactions.number - 2, transactions.totalPages - 5)) + index;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`btn btn-small ${transactions.number === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(transactions.number + 1)}
                    disabled={transactions.last}
                    className="btn btn-secondary btn-small"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionManagement;