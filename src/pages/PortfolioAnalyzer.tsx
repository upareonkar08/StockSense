import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { usePortfolio } from '../hooks/usePortfolio';
import type { Holding } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatPercent } from '../utils/formatters';

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } }
};

const tickerMap: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corp.',
  GOOGL: 'Alphabet Inc.',
  TSLA: 'Tesla Inc.',
  NVDA: 'NVIDIA Corp.',
  AMZN: 'Amazon.com Inc.',
  META: 'Meta Platforms Inc.',
  NFLX: 'Netflix Inc.'
};

type SortField = 'symbol' | 'companyName' | 'quantity' | 'buyPrice' | 'currentPrice' | 'value' | 'pnl' | 'pnlPercent';
type SortDirection = 'asc' | 'desc';

interface AddStockInputs {
  symbol: string;
  companyName: string;
  quantity: number;
  buyPrice: number;
  purchaseDate: string;
}

export const PortfolioAnalyzer: React.FC = () => {
  const { holdings, addHolding, updateHolding, deleteHolding, isLoading } = usePortfolio();
  
  // Side Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editHolding, setEditHolding] = useState<Holding | null>(null);
  
  // Confirmation Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Sorting State
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AddStockInputs>();
  
  React.useEffect(() => {
    document.title = "Portfolio Analyzer — StockSense";
  }, []);

  // Watch stock symbol to autofill company name
  const watchedSymbol = watch('symbol', '');
  useEffect(() => {
    if (watchedSymbol) {
      const upper = watchedSymbol.toUpperCase();
      // Auto-uppercase logic in input
      if (watchedSymbol !== upper) {
        setValue('symbol', upper);
      }
      if (tickerMap[upper]) {
        setValue('companyName', tickerMap[upper]);
      }
    }
  }, [watchedSymbol, setValue]);

  // Set form values when editing
  useEffect(() => {
    if (editHolding) {
      reset({
        symbol: editHolding.symbol,
        companyName: editHolding.companyName,
        quantity: editHolding.quantity,
        buyPrice: editHolding.buyPrice,
        purchaseDate: editHolding.purchaseDate
      });
    } else {
      reset({
        symbol: '',
        companyName: '',
        quantity: undefined,
        buyPrice: undefined,
        purchaseDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [editHolding, reset]);

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Summary Metrics calculations
  const totalInvested = holdings.reduce((sum, h) => sum + (h.quantity * h.buyPrice), 0);
  const currentValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
  const totalPnL = currentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedHoldings = () => {
    const data = [...holdings];
    return data.sort((a, b) => {
      let aVal: any = a[sortField as keyof Holding];
      let bVal: any = b[sortField as keyof Holding];

      // Computed properties sorting
      if (sortField === 'value') {
        aVal = a.quantity * a.currentPrice;
        bVal = b.quantity * b.currentPrice;
      } else if (sortField === 'pnl') {
        aVal = (a.quantity * a.currentPrice) - (a.quantity * a.buyPrice);
        bVal = (b.quantity * b.currentPrice) - (b.quantity * b.buyPrice);
      } else if (sortField === 'pnlPercent') {
        const costA = a.quantity * a.buyPrice;
        const costB = b.quantity * b.buyPrice;
        aVal = costA > 0 ? (((a.quantity * a.currentPrice) - costA) / costA) * 100 : 0;
        bVal = costB > 0 ? (((b.quantity * b.currentPrice) - costB) / costB) * 100 : 0;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });
  };

  // Form Submit Action
  const onSubmit = async (data: AddStockInputs) => {
    const symbolUpper = data.symbol.toUpperCase();
    
    // Simulate finding current price (lookup or default to buy price + small fluctuation)
    const mockCurrentPrice = tickerMap[symbolUpper] 
      ? (holdings.find(h => h.symbol === symbolUpper)?.currentPrice || data.buyPrice * 1.15)
      : data.buyPrice;

    if (editHolding) {
      await updateHolding(editHolding.id, {
        symbol: symbolUpper,
        companyName: data.companyName,
        quantity: Number(data.quantity),
        buyPrice: Number(data.buyPrice),
        currentPrice: mockCurrentPrice,
        purchaseDate: data.purchaseDate
      });
      triggerToast(`Successfully updated ${symbolUpper} holding.`);
    } else {
      await addHolding({
        symbol: symbolUpper,
        companyName: data.companyName,
        quantity: Number(data.quantity),
        buyPrice: Number(data.buyPrice),
        currentPrice: mockCurrentPrice,
        purchaseDate: data.purchaseDate
      });
      triggerToast(`Successfully added ${symbolUpper} to portfolio.`);
    }
    
    setIsPanelOpen(false);
    setEditHolding(null);
  };

  // Delete Action Confirm
  const handleDeleteConfirm = async () => {
    if (deleteId) {
      const holding = holdings.find(h => h.id === deleteId);
      await deleteHolding(deleteId);
      triggerToast(`Removed ${holding?.symbol || 'holding'} from portfolio.`);
    }
    setIsDeleteModalOpen(false);
    setDeleteId(null);
  };

  const sortedHoldings = getSortedHoldings();

  // Rendering sort icons
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="ml-1 text-slate-400" />;
    return sortDirection === 'asc' 
      ? <ArrowUp size={12} className="ml-1 text-accent" /> 
      : <ArrowDown size={12} className="ml-1 text-accent" />;
  };

  const getDeleteHoldingSymbol = () => {
    return holdings.find(h => h.id === deleteId)?.symbol || '';
  };

  return (
    <DashboardLayout>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-8 text-left"
      >
        {/* Top bar header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-textPrimary tracking-tight">Portfolio Analyzer</h2>
            <p className="text-sm text-textSecondary font-medium">Add, track, and manage your current holdings list.</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setEditHolding(null);
              setIsPanelOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Add Stock</span>
          </Button>
        </div>

        {/* Success toast notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -40, x: 40 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -40, x: 40 }}
              className="fixed top-4 right-4 bg-emerald-500 text-white py-3 px-5 rounded-lg shadow-xl font-semibold text-sm flex items-center gap-2 z-50"
            >
              <span>✅</span> {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Row 1: Metrics summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card hoverEffect className="space-y-2">
            <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Total Invested</p>
            <h3 className="text-2xl font-extrabold text-textPrimary">{formatCurrency(totalInvested)}</h3>
          </Card>
          <Card hoverEffect className="space-y-2">
            <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Current Value</p>
            <h3 className="text-2xl font-extrabold text-textPrimary">{formatCurrency(currentValue)}</h3>
          </Card>
          <Card hoverEffect className="space-y-2">
            <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Total P&L</p>
            <div className="flex items-baseline gap-2">
              <h3 className={`text-2xl font-extrabold ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(totalPnL)}
              </h3>
              <span className={`text-sm font-semibold ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                ({formatPercent(totalPnLPercent)})
              </span>
            </div>
          </Card>
        </div>

        {/* Row 2: Holdings Table Card */}
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-borderColor">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">Holdings</h3>
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-borderColor">
              <thead>
                <tr className="bg-slate-50/50">
                  <th scope="col" onClick={() => handleSort('symbol')} className="px-6 py-3.5 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-slate-100/50">
                    <span className="flex items-center">Symbol {renderSortIcon('symbol')}</span>
                  </th>
                  <th scope="col" onClick={() => handleSort('companyName')} className="px-6 py-3.5 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 hidden md:table-cell">
                    <span className="flex items-center">Company {renderSortIcon('companyName')}</span>
                  </th>
                  <th scope="col" onClick={() => handleSort('quantity')} className="px-6 py-3.5 text-right text-xs font-semibold text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-slate-100/50">
                    <span className="flex items-center justify-end">Qty {renderSortIcon('quantity')}</span>
                  </th>
                  <th scope="col" onClick={() => handleSort('buyPrice')} className="px-6 py-3.5 text-right text-xs font-semibold text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-slate-100/50">
                    <span className="flex items-center justify-end">Buy Price {renderSortIcon('buyPrice')}</span>
                  </th>
                  <th scope="col" onClick={() => handleSort('currentPrice')} className="px-6 py-3.5 text-right text-xs font-semibold text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-slate-100/50">
                    <span className="flex items-center justify-end">Current Price {renderSortIcon('currentPrice')}</span>
                  </th>
                  <th scope="col" onClick={() => handleSort('value')} className="px-6 py-3.5 text-right text-xs font-semibold text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-slate-100/50">
                    <span className="flex items-center justify-end">Value {renderSortIcon('value')}</span>
                  </th>
                  <th scope="col" onClick={() => handleSort('pnl')} className="px-6 py-3.5 text-right text-xs font-semibold text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-slate-100/50">
                    <span className="flex items-center justify-end">P&L {renderSortIcon('pnl')}</span>
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center text-xs font-semibold text-textSecondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-textSecondary">
                      <div className="flex justify-center items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Loading holdings...</span>
                      </div>
                    </td>
                  </tr>
                ) : sortedHoldings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <span className="text-4xl">📊</span>
                        <h4 className="text-sm font-bold text-textPrimary">No stocks added yet.</h4>
                        <p className="text-xs text-textSecondary max-w-xs leading-normal">
                          Get started by tracking your holdings. Click "+ Add Stock" to add your first position.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedHoldings.map((holding, index) => {
                    const value = holding.quantity * holding.currentPrice;
                    const cost = holding.quantity * holding.buyPrice;
                    const pnl = value - cost;
                    const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

                    return (
                      <motion.tr
                        key={holding.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-textPrimary">
                          {holding.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary hidden md:table-cell">
                          {holding.companyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-textPrimary">
                          {holding.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-textSecondary">
                          {formatCurrency(holding.buyPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-textPrimary font-semibold">
                          {formatCurrency(holding.currentPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-textPrimary font-semibold">
                          {formatCurrency(value)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                          pnl >= 0 ? 'text-success' : 'text-danger'
                        }`}>
                          <div className="flex items-center justify-end gap-1">
                            <span>{pnl >= 0 ? '▲' : '▼'}</span>
                            <span>{formatCurrency(pnl)} ({formatPercent(pnlPercent)})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => {
                                setEditHolding(holding);
                                setIsPanelOpen(true);
                              }}
                              className="text-textSecondary hover:text-accent p-1 rounded hover:bg-background transition-colors"
                              title="Edit Holding"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteId(holding.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-textSecondary hover:text-danger p-1 rounded hover:bg-background transition-colors"
                              title="Delete Holding"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* ADD / EDIT STOCK PANEL (Slides in from right) */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsPanelOpen(false);
                setEditHolding(null);
              }}
              className="fixed inset-0 bg-slate-900 z-40 backdrop-blur-sm"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white border-l border-borderColor shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-borderColor flex items-center justify-between bg-slate-50">
                <h3 className="text-base font-bold text-textPrimary">
                  {editHolding ? `Edit ${editHolding.symbol}` : 'Add Stock Position'}
                </h3>
                <button
                  onClick={() => {
                    setIsPanelOpen(false);
                    setEditHolding(null);
                  }}
                  className="p-1 rounded-full text-textSecondary hover:text-textPrimary hover:bg-background transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit(onSubmit)} className="flex-grow p-6 space-y-4 overflow-y-auto text-left">
                <Input
                  id="symbol"
                  label="Stock Ticker / Symbol"
                  placeholder="e.g. AAPL"
                  error={errors.symbol?.message}
                  {...register('symbol', {
                    required: 'Stock symbol is required',
                  })}
                />
                
                <Input
                  id="companyName"
                  label="Company Name"
                  placeholder="e.g. Apple Inc."
                  error={errors.companyName?.message}
                  {...register('companyName', {
                    required: 'Company name is required'
                  })}
                />

                <Input
                  id="quantity"
                  type="number"
                  label="Quantity"
                  placeholder="e.g. 50"
                  error={errors.quantity?.message}
                  {...register('quantity', {
                    required: 'Quantity is required',
                    min: {
                      value: 1,
                      message: 'Quantity must be at least 1'
                    }
                  })}
                />

                <Input
                  id="buyPrice"
                  type="number"
                  step="0.01"
                  label="Buy Price (₹)"
                  placeholder="e.g. 145"
                  error={errors.buyPrice?.message}
                  {...register('buyPrice', {
                    required: 'Buy price is required',
                    min: {
                      value: 0.01,
                      message: 'Buy price must be greater than 0'
                    }
                  })}
                />

                <Input
                  id="purchaseDate"
                  type="date"
                  label="Purchase Date"
                  error={errors.purchaseDate?.message}
                  {...register('purchaseDate', {
                    required: 'Purchase date is required'
                  })}
                />

                <div className="pt-4 flex gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                  >
                    {editHolding ? 'Save Changes' : 'Add to Portfolio'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setIsPanelOpen(false);
                      setEditHolding(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteId(null);
        }}
        title="Remove Position"
      >
        <div className="space-y-6 text-left">
          <p className="text-sm text-textSecondary leading-relaxed">
            Are you sure you want to remove <span className="font-semibold text-textPrimary">{getDeleteHoldingSymbol()}</span> from your portfolio? This action will delete your historical purchase data for this stock.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};
export default PortfolioAnalyzer;
