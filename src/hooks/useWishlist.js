import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';

export const useWishlist = (user) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id)
        .limit(1000);

      if (error) throw error;
      
      const wishlistIds = data?.map(item => 
        typeof item.product_id === 'string' ? parseInt(item.product_id) : item.product_id
      ) || [];
      
      setWishlist(wishlistIds);
    } catch (error) {
      console.error('Wishlist error:', error);
      setWishlist([]);
    }
  }, [user]);

  const toggleWishlist = useCallback(async (product) => {
    if (!product || loading) return;
    
    setLoading(true);
    try {
      if (!user) throw new Error('Please log in to manage your wishlist');

      const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
      const isCurrentlyInWishlist = wishlist.includes(productId);

      if (isCurrentlyInWishlist) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error && error.code !== 'PGRST116') throw error;
        
        setWishlist(prev => prev.filter(id => id !== productId));
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: productId
          });

        if (error && error.code !== '23505') throw error;
        
        setWishlist(prev => [...prev, productId]);
      }

      return !isCurrentlyInWishlist;
    } catch (error) {
      console.error('Wishlist error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, wishlist, loading]);

  return { wishlist, loading, toggleWishlist, loadWishlist };
};