import React from 'react';
import { Outlet } from 'react-router-dom';
import { Hourglass } from './Hourglass';
import { motion } from 'framer-motion';

export const Layout: React.FC = () => {
  return (
    <>
      <Hourglass />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ width: '100%', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}
      >
        <Outlet />
      </motion.div>
    </>
  );
};
