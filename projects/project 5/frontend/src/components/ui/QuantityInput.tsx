import React, { useState, useRef, useEffect } from "react";
import { Minus, Plus, AlertCircle, Info } from "lucide-react";
import { Button } from "./Button";

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  className?: string;
  error?: string;
}

export const QuantityInput = ({
  value,
  onChange,
  min,
  max,
  className = "",
  error,
}: QuantityInputProps) => {
  const [showMinMax, setShowMinMax] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const [isAnimating, setIsAnimating] = useState(false);
  const errorTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  const validateAndSetValue = (newValue: number) => {
    if (newValue < min) {
      setLocalError(`Minimum value is ${min.toLocaleString()}`);
      setIsAnimating(true);
      // Auto-correct to minimum after a short delay
      errorTimeoutRef.current = setTimeout(() => {
        onChange(min);
        setLocalError(undefined);
        setIsAnimating(false);
      }, 1500);
    } else if (newValue > max) {
      setLocalError(`Maximum value is ${max.toLocaleString()}`);
      setIsAnimating(true);
      // Auto-correct to maximum after a short delay
      errorTimeoutRef.current = setTimeout(() => {
        onChange(max);
        setLocalError(undefined);
        setIsAnimating(false);
      }, 1500);
    } else {
      setLocalError(undefined);
      setIsAnimating(false);
      onChange(newValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowMinMax(true);
    const newValue = parseInt(e.target.value) || 0;
    onChange(newValue);
  };

  const handleBlur = () => {
    const currentValue = value || 0;
    validateAndSetValue(currentValue);
    setShowMinMax(false);
  };

  const handleMouseLeave = () => {
    const currentValue = value || 0;
    validateAndSetValue(currentValue);
    setShowMinMax(false);
  };

  const handleFocus = () => {
    setShowMinMax(true);
    setLocalError(undefined);
    setIsAnimating(false);
  };

  const increment = () => {
    const newValue = (value || 0) + Math.ceil(max * 0.01); // Increment by 1% of max
    validateAndSetValue(newValue);
  };

  const decrement = () => {
    const newValue = (value || 0) - Math.ceil(max * 0.01); // Decrement by 1% of max
    validateAndSetValue(newValue);
  };

  const setMin = () => {
    onChange(min);
    setLocalError(undefined);
    setIsAnimating(false);
  };

  const setMax = () => {
    onChange(max);
    setLocalError(undefined);
    setIsAnimating(false);
  };

  return (
    <div className={`space-y-2 ${className}`} onMouseLeave={handleMouseLeave}>
      <div className='relative flex items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={decrement}
          className='h-10 px-3'
          disabled={value <= min}>
          <Minus className='w-4 h-4' />
        </Button>

        <div className='relative flex-1'>
          <input
            ref={inputRef}
            type='number'
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full h-10 px-3 rounded-lg border text-center transition-all duration-200 ${
              localError || error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            } ${isAnimating ? "animate-shake" : ""}`}
          />

          <div className='absolute left-0 right-0 top-full mt-2'>
            {localError || error ? (
              <div className='bg-red-50 text-red-600 px-3 py-2 rounded-lg flex items-center gap-2 animate-fade-in'>
                <AlertCircle className='w-4 h-4 flex-shrink-0' />
                <span className='text-sm'>{localError || error}</span>
              </div>
            ) : (
              showMinMax && (
                <div className='bg-gray-50 px-3 py-2 rounded-lg flex items-center gap-2 animate-fade-in'>
                  <Info className='w-4 h-4 text-gray-400 flex-shrink-0' />
                  <div className='text-xs text-gray-600'>
                    <span className='font-medium'>Min:</span>{" "}
                    {min.toLocaleString()}
                    <span className='mx-2'>•</span>
                    <span className='font-medium'>Max:</span>{" "}
                    {max.toLocaleString()}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={increment}
          className='h-10 px-3'
          disabled={value >= max}>
          <Plus className='w-4 h-4' />
        </Button>
      </div>

      <div className='flex gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={setMin}
          className='flex-1'>
          Min
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={setMax}
          className='flex-1'>
          Max
        </Button>
      </div>
    </div>
  );
};
