import { useState } from 'react';
import { Direction, Disintegrate } from './components/Disintegrate';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [direction, setDirection] = useState<Direction>('left');
  const [timing, setTiming] = useState({
    initialDelay: 200,
    fadeInDuration: 400,
    holdDuration: 200,
    fadeOutDuration: 1200
  });
  const [filterParams, setFilterParams] = useState({
    baseFrequency: 0.02,
    numOctaves: 1,
    slope: 2,
    intercept: -0.5
  });

  const handleComplete = () => {
    console.log('Effect complete');
    setIsActive(false);
  };

  // Add controls panel
  const Controls = () => (
    <div className="fixed top-4 right-4 bg-white/10 backdrop-blur-sm p-4 rounded-lg space-y-4">
      <div className="space-y-2">
        <label className="block text-white text-sm">Direction</label>
        <select 
          value={direction}
          onChange={(e) => setDirection(e.target.value as Direction)}
          className="w-full bg-gray-800 text-white rounded px-2 py-1"
        >
          {Object.values(Direction).map(dir => (
            <option key={dir} value={dir}>{dir}</option>
          ))}
        </select>
      </div>

      <div className="border-t border-white/20 pt-4 mt-4">
        <h3 className="text-white text-sm font-medium mb-2">Timing Controls</h3>
        {Object.entries(timing).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <label className="block text-white text-sm">
              {key} (ms)
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setTiming(prev => ({
                ...prev,
                [key]: parseInt(e.target.value) || 0
              }))}
              className="w-full bg-gray-800 text-white rounded px-2 py-1"
            />
          </div>
        ))}
      </div>

      <div className="border-t border-white/20 pt-4">
        <h3 className="text-white text-sm font-medium mb-2">Filter Controls</h3>
        {Object.entries(filterParams).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <label className="block text-white text-sm">
              {key}
            </label>
            <input
              type="number"
              value={value}
              step={key === 'baseFrequency' ? 0.01 : key === 'intercept' ? 0.1 : 1}
              onChange={(e) => setFilterParams(prev => ({
                ...prev,
                [key]: parseFloat(e.target.value) || 0
              }))}
              className="w-full bg-gray-800 text-white rounded px-2 py-1"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <Controls />
      
      <button
        onClick={() => setIsActive(true)}
        className="mb-8 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
      >
        <Sparkles size={20} />
        Disintegrate
      </button>

      <Disintegrate 
        isActive={isActive} 
        onComplete={handleComplete} 
        direction={direction}
        timing={timing}
        filterParams={filterParams}
      >
        <div className="p-8 rounded-lg shadow-xl bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90%">
          <h2 className="text-2xl font-bold text-white">Click to Disintegrate</h2>
          <p className="mt-2 text-white">
            This element will disintegrate when the effect is active
          </p>
          <p className="mt-2 text-white">
            Challenge: 2 of 200 | Gavin Monroe | 2025
          </p>
        </div>
      </Disintegrate>
    </div>
  );
}