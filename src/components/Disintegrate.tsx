import React, { useState, useEffect, cloneElement, ReactElement, useRef } from 'react';
import './Disintegrate.css';

export const Direction = {
  random: 'random' as const,
  left: 'left' as const,
  up: 'up' as const
} as const;

export type Direction = typeof Direction[keyof typeof Direction];

interface AnimationTiming {
  initialDelay?: number;    // Initial pause before effect starts
  fadeInDuration?: number;  // How long it takes for the effect to reach full intensity
  holdDuration?: number;    // How long to hold at full intensity
  fadeOutDuration?: number; // How long it takes to fade out
}

interface DisintegrateProps {
  children: ReactElement;
  isActive?: boolean;
  onComplete?: () => void;
  duration?: number;
  direction?: Direction;
  timing?: AnimationTiming;
  filterParams?: {
    baseFrequency: number;
    numOctaves: number;
    slope: number;
    intercept: number;
  };
}

export const Disintegrate: React.FC<DisintegrateProps> = ({
  children,
  isActive = false,
  onComplete,
  direction = 'random',
  timing = {
    initialDelay: 200,
    fadeInDuration: 400,
    holdDuration: 200,
    fadeOutDuration: 1200
  },
  filterParams = {
    baseFrequency: 0.02,
    numOctaves: 1,
    slope: 2,
    intercept: -0.5
  }
}) => {
  const [isDisintegrating, setIsDisintegrating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'fadeIn' | 'hold' | 'fadeOut' | 'complete'>('initial');
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const filterRef = useRef<SVGFilterElement>(null);

  const getDirectionAngles = (dir: Direction): { xAngle: number, yAngle: number } => {
    switch (dir) {
      case 'left': return { xAngle: 0, yAngle: 1 };
      case 'up': return { xAngle: 1, yAngle: 0 };
      default: return { xAngle: 0, yAngle: 0 };
    }
  };

  useEffect(() => {
    if (isActive && !isDisintegrating) {
      startDisintegration();
    }
  }, [isActive]);

  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
  const easeInCubic = (t: number): number => t * t * t;

  const resetEffect = () => {
    const displacementMap = filterRef.current?.querySelector('feDisplacementMap');
    if (displacementMap) {
      displacementMap.setAttribute('scale', '0');
    }
    setIsDisintegrating(false);
    setAnimationPhase('initial');
    onComplete?.();
  };

  const startDisintegration = () => {
    setIsDisintegrating(true);
    setAnimationPhase('initial');
    startTimeRef.current = performance.now();
    setRandomSeed();
    animate();
  };

  const setRandomSeed = () => {
    const turbulence = filterRef.current?.querySelector('feTurbulence');
    if (turbulence) {
      turbulence.setAttribute('seed', Math.floor(Math.random() * 1000).toString());
    }
  };

  const getPhaseProgress = (elapsed: number): { phase: typeof animationPhase, progress: number } => {
    const { 
      initialDelay = 200, 
      fadeInDuration = 400, 
      holdDuration = 200, 
      fadeOutDuration = 1200 
    } = timing;
    const totalDuration = initialDelay + fadeInDuration + holdDuration + fadeOutDuration;

    if (elapsed < initialDelay) {
      return { phase: 'initial', progress: elapsed / initialDelay };
    } else if (elapsed < initialDelay + fadeInDuration) {
      return { 
        phase: 'fadeIn', 
        progress: (elapsed - initialDelay) / fadeInDuration 
      };
    } else if (elapsed < initialDelay + fadeInDuration + holdDuration) {
      return { 
        phase: 'hold', 
        progress: (elapsed - initialDelay - fadeInDuration) / holdDuration 
      };
    } else if (elapsed < totalDuration) {
      return { 
        phase: 'fadeOut', 
        progress: (elapsed - initialDelay - fadeInDuration - holdDuration) / fadeOutDuration 
      };
    }
    return { phase: 'complete', progress: 1 };
  };

  const getEffectIntensity = (phase: typeof animationPhase, progress: number): number => {
    switch (phase) {
      case 'initial':
        return 0;
      case 'fadeIn':
        return easeInCubic(progress) * 0.3; // Reduced initial intensity to 30%
      case 'hold':
        return 0.3; // Hold at 30%
      case 'fadeOut':
        // Linear progression from 30% to 100% during fadeOut
        return 0.3 + (progress * 0.7);
      default:
        return 0;
    }
  };

  const animate = () => {
    if (!startTimeRef.current) return;

    const elapsed = performance.now() - startTimeRef.current;
    const { phase, progress } = getPhaseProgress(elapsed);
    const intensity = getEffectIntensity(phase, progress);

    if (phase !== animationPhase) {
      setAnimationPhase(phase);
    }

    const displacementMap = filterRef.current?.querySelector('feDisplacementMap');
    const { xAngle, yAngle } = getDirectionAngles(direction);
    
    if (displacementMap) {
      const scale = intensity * (timing.fadeOutDuration || 1200);
      if (direction === 'random') {
        displacementMap.setAttribute('scale', scale.toString());
      } else {
        displacementMap.setAttribute('xChannelSelector', xAngle !== 0 ? 'R' : 'A');
        displacementMap.setAttribute('yChannelSelector', yAngle !== 0 ? 'G' : 'A');
        displacementMap.setAttribute('scale', scale.toString());
      }
    }

    if (phase !== 'complete') {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setTimeout(resetEffect, 0);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const childWithProps = cloneElement(children, {
    className: `${children.props.className || ''} ${
      isDisintegrating ? 'disintegrating' : ''
    }`.trim(),
    style: {
      ...children.props.style,
      filter: isDisintegrating ? 'url(#dissolve-filter)' : 'none',
      transition: `opacity ${timing.fadeOutDuration}ms ease`,
      opacity: isDisintegrating ? 0 : 1,
    },
  });

  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter
            ref={filterRef}
            id="dissolve-filter"
            x="-200%"
            y="-200%"
            width="500%"
            height="500%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={direction === 'random' ? 0.04 : filterParams.baseFrequency}
              numOctaves={filterParams.numOctaves}
              result="bigNoise"
            />
            <feComponentTransfer in="bigNoise" result="bigNoiseAdjusted">
              <feFuncR type="linear" slope={filterParams.slope} intercept={filterParams.intercept} />
              <feFuncG type="linear" slope={filterParams.slope} intercept={filterParams.intercept} />
            </feComponentTransfer>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="1"
              result="fineNoise"
            />
            <feMerge result="mergedNoise">
              <feMergeNode in="bigNoiseAdjusted" />
              <feMergeNode in="fineNoise" />
            </feMerge>
            <feDisplacementMap
              in="SourceGraphic"
              in2="mergedNoise"
              scale="0"
              xChannelSelector="G"
              yChannelSelector="R"
            />
          </filter>
        </defs>
      </svg>
      <div className="disintegrate-wrapper">{childWithProps}</div>
    </>
  );
};