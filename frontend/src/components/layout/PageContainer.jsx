import React from 'react';

export default function PageContainer({ children, className = '' }) {
  return (
    <main className={`max-w-[1140px] mx-auto px-4 sm:px-6 pt-6 pb-28 ${className}`}>
      {children}
    </main>
  );
}
