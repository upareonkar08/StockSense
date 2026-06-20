import { useState, useEffect, useCallback } from 'react';
import type { Holding } from '../types';
import * as portfolioService from '../services/portfolioService';

export const usePortfolio = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const fetchPortfolio = async () => {
      setIsLoading(true);
      try {
        const data = await portfolioService.getPortfolio();
        if (active) {
          setHoldings(data);
        }
      } catch (err) {
        console.error("Failed to load portfolio:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    fetchPortfolio();
    return () => {
      active = false;
    };
  }, []);

  const add = useCallback(async (h: Omit<Holding, 'id'>) => {
    try {
      const newHolding = await portfolioService.addHolding(h);
      setHoldings(prev => [...prev, newHolding]);
      return newHolding;
    } catch (err) {
      console.error("Failed to add holding:", err);
      throw err;
    }
  }, []);

  const update = useCallback(async (id: string, h: Partial<Holding>) => {
    try {
      await portfolioService.updateHolding(id, h);
      setHoldings(prev => prev.map(item => item.id === id ? { ...item, ...h } as Holding : item));
    } catch (err) {
      console.error("Failed to update holding:", err);
      throw err;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await portfolioService.deleteHolding(id);
      setHoldings(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete holding:", err);
      throw err;
    }
  }, []);

  return {
    holdings,
    addHolding: add,
    updateHolding: update,
    deleteHolding: remove,
    isLoading
  };
};
export default usePortfolio;
