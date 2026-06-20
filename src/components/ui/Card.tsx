import React from 'react';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = false, ...props }) => {
  const classes = `bg-white rounded-xl border border-borderColor p-6 shadow-sm ${className}`;

  if (hoverEffect) {
    return (
      <motion.div
        className={classes}
        whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(99,102,241,0.15)" }}
        transition={{ duration: 0.2 }}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};
export default Card;
