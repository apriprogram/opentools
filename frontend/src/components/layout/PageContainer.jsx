import React from 'react';

export default function PageContainer({ children, className = '' }) {
  return (
    <main className={`w-full px-4 sm:px-6 md:px-8 pt-6 pb-28 ${className}`}>
      {children}
    </main>
  );
}
