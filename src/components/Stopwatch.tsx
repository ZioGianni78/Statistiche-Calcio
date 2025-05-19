import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayIcon, PauseIcon, RotateCcwIcon, FlagIcon } from 'lucide-react'; // Icons for controls

const timePointLabels = ['1° Tempo', '2° Tempo', '3° Tempo', '4° Tempo', 'Tempo Supplementare', 'Intervallo', 'Fine Partita'];

const Stopwatch: React.FC = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSelectingLabel, setIsSelectingLabel] = useState(false); // State to show/hide label selection
  const [currentDisplayedLabel, setCurrentDisplayedLabel] = useState<string | null>(null); // State to display the selected label
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTime((prevTime) => prevTime + 10); // Update every 10ms
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    // Cleanup function to clear interval when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]); // Re-run effect when isRunning changes

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const centiseconds = Math.floor((milliseconds % 1000) / 10);

    const pad = (num: number) => num.toString().padStart(2, '0');

    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  };

  const handleStartStop = () => {
    setIsRunning(!isRunning);
    // If stopping, hide label selection
    if (isRunning) {
      setIsSelectingLabel(false);
    }
  };

  const handleReset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setTime(0);
    setIsSelectingLabel(false); // Hide label selection on reset
    setCurrentDisplayedLabel(null); // Clear the displayed label
  };

  // Function to show label selection
  const handleShowLabelSelection = () => {
    if (isRunning) {
      setIsSelectingLabel(true);
    }
  };

  // Function to handle selecting a time point label
  const handleSelectTimePoint = (label: string) => {
    if (isRunning) {
      setCurrentDisplayedLabel(label); // Set the selected label to be displayed
      setIsSelectingLabel(false); // Hide label selection after selecting
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Cronometro</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">

        {/* Display the selected label above the main timer */}
        {currentDisplayedLabel && (
          <div className="w-full text-center text-lg font-semibold text-gray-800 dark:text-gray-200">
            {currentDisplayedLabel}
          </div>
        )}

        <div className="text-6xl font-mono">
          {formatTime(time)}
        </div>
        <div className="flex space-x-4">
          <Button onClick={handleStartStop} variant={isRunning ? 'destructive' : 'default'}>
            {isRunning ? <><PauseIcon className="mr-2 h-4 w-4" /> Stop</> : <><PlayIcon className="mr-2 h-4 w-4" /> Start</>}
          </Button>
          <Button onClick={handleReset} variant="outline" disabled={isRunning && time === 0}>
            <RotateCcwIcon className="mr-2 h-4 w-4" /> Reset
          </Button>
          {/* Button to show label selection */}
          <Button onClick={handleShowLabelSelection} variant="secondary" disabled={!isRunning || isSelectingLabel}>
            <FlagIcon className="mr-2 h-4 w-4" /> Seleziona Tempo
          </Button>
        </div>

        {/* Label selection area */}
        {isSelectingLabel && isRunning && (
          <div className="w-full flex flex-wrap justify-center gap-2 mt-4">
            {timePointLabels.map((label) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                onClick={() => handleSelectTimePoint(label)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Stopwatch;