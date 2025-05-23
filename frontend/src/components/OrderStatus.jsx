import React from 'react';
import { FiClock, FiPackage, FiCheck, FiX } from 'react-icons/fi';

export function OrderStatus({ status }) {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-purple-100 text-purple-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = () => {
    switch (status.toLowerCase()) {
      case 'pending': return <FiClock className="mr-2" />;
      case 'processing': return <FiPackage className="mr-2" />;
      case 'shipped': return <FiPackage className="mr-2" />;
      case 'delivered': return <FiCheck className="mr-2" />;
      case 'cancelled': return <FiX className="mr-2" />;
      default: return <FiClock className="mr-2" />;
    }
  };

  return (
    <span className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
      {getStatusIcon()}
      {status}
    </span>
  );
}
