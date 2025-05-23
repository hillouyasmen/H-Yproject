import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiTrash2 } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      
      const data = await response.json();
      setFavorites(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const removeFavorite = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/favorites/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }

      setFavorites(favorites.filter(fav => fav.product_id !== productId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center mt-4">{error}</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-violet-900 text-white py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-black/40 backdrop-blur-xl rounded-xl overflow-hidden border border-purple-500/40 shadow-2xl shadow-purple-500/20">
          <div className="px-6 py-8 sm:px-8 flex items-center justify-between bg-gradient-to-r from-purple-900/50 to-transparent">
            <h1 className="text-3xl font-bold">My Favorites</h1>
            <FiHeart className="h-8 w-8 text-purple-400" />
          </div>

          <div className="p-6">
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No favorites yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((favorite) => (
                  <motion.div
                    key={favorite.product_id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-black/30 rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                  >
                    <div className="relative aspect-w-1 aspect-h-1 mb-4">
                      <img
                        src={favorite.product_image}
                        alt={favorite.product_name}
                        className="object-cover rounded-lg w-full h-48"
                      />
                      <button
                        onClick={() => removeFavorite(favorite.product_id)}
                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 rounded-full transition-colors"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{favorite.product_name}</h3>
                    <p className="text-purple-300">${favorite.price}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Favorites;
