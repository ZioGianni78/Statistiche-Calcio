import React from 'react';
import Stopwatch from '@/components/Stopwatch';

const StopwatchPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Cronometro</h1>
      <Stopwatch />
    </div>
  );
};

export default StopwatchPage;