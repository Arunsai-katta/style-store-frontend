'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface RangeSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    onChangeEnd?: (value: [number, number]) => void;
}

export default function RangeSlider({ min, max, value, onChange, onChangeEnd }: RangeSliderProps) {
    const [minVal, setMinVal] = useState(value[0]);
    const [maxVal, setMaxVal] = useState(value[1]);
    const minValRef = useRef(value[0]);
    const maxValRef = useRef(value[1]);
    const range = useRef<HTMLDivElement>(null);

    // Convert to percentage
    const getPercent = useCallback(
        (val: number) => {
            if (max === min) return 0;
            return Math.round(((val - min) / (max - min)) * 100);
        },
        [min, max]
    );

    useEffect(() => {
        setMinVal(value[0]);
        setMaxVal(value[1]);
    }, [value]);

    useEffect(() => {
        const minPercent = getPercent(minVal);
        const maxPercent = getPercent(maxValRef.current);

        if (range.current) {
            range.current.style.left = `${minPercent}%`;
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [minVal, getPercent]);

    useEffect(() => {
        const minPercent = getPercent(minValRef.current);
        const maxPercent = getPercent(maxVal);

        if (range.current) {
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [maxVal, getPercent]);

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Math.min(Number(e.target.value), maxVal - 1);
        setMinVal(newValue);
        minValRef.current = newValue;
        onChange([newValue, maxVal]);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Math.max(Number(e.target.value), minVal + 1);
        setMaxVal(newValue);
        maxValRef.current = newValue;
        onChange([minVal, newValue]);
    };

    const handleMouseUp = () => {
        if (onChangeEnd) {
            onChangeEnd([minVal, maxVal]);
        }
    };

    const percentageDiff = max - min === 0 ? 1 : max - min;
    const isMinCloseToMax = maxVal - minVal < percentageDiff * 0.05;

    return (
        <div className="relative w-full h-8 flex items-center">
            <input
                type="range"
                min={min}
                max={max}
                value={minVal}
                onChange={handleMinChange}
                onMouseUp={handleMouseUp}
                onTouchEnd={handleMouseUp}
                className="absolute w-full h-0 outline-none z-30 pointer-events-none appearance-none"
                style={{
                    zIndex: isMinCloseToMax && minVal > max - percentageDiff / 2 ? 40 : 30
                }}
            />
            <input
                type="range"
                min={min}
                max={max}
                value={maxVal}
                onChange={handleMaxChange}
                onMouseUp={handleMouseUp}
                onTouchEnd={handleMouseUp}
                className="absolute w-full h-0 outline-none z-30 pointer-events-none appearance-none"
            />

            <div className="relative w-full" style={{ height: '4px' }}>
                <div className="absolute w-full h-full bg-gray-200 rounded-md z-10" />
                <div
                    ref={range}
                    className="absolute h-full bg-primary rounded-md z-20"
                />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        input[type=range]::-webkit-slider-thumb {
          pointer-events: all;
          width: 18px;
          height: 18px;
          -webkit-appearance: none;
          background-color: #0f3460;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          position: relative;
        }
        input[type=range]::-moz-range-thumb {
          pointer-events: all;
          width: 18px;
          height: 18px;
          background-color: #0f3460;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          position: relative;
        }
      `}} />
        </div>
    );
}
