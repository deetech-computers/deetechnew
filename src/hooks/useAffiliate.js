import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';

export const useAffiliate = (user) => {
  const [affiliateCode, setAffiliateCode] = useState('');

  const loadAffiliateCode = useCallback(async () => {
    try {
      if (user) {
        const { data: affiliate, error } = await supabase
          .from('affiliates')
          .select('affiliate_code')
          .eq('user_id', user.id)
          .single();

        if (!error && affiliate) {
          setAffiliateCode(affiliate.affiliate_code);
        }
      }
    } catch (error) {
      console.error('Error loading affiliate code:', error);
    }
  }, [user]);

  return { affiliateCode, loadAffiliateCode };
};