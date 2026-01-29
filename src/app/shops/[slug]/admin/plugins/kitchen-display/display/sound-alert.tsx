'use client';

import { useEffect, useRef, useCallback } from 'react';

// ============================================
// Kitchen Display Sound Alert Component
// Plays notification sound when new orders arrive
// ============================================

interface SoundAlertProps {
  enabled: boolean;
  volume: number;
  newOrderIds: string[];
  onPlayed: (playedIds: string[]) => void;
}

export function SoundAlert({ 
  enabled, 
  volume, 
  newOrderIds, 
  onPlayed 
}: SoundAlertProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedRef = useRef<Set<string>>(new Set());

  // Initialize audio on first user interaction
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/kitchen-bell.mp3');
      audioRef.current.preload = 'auto';
    }
  }, []);

  // Play sound for new orders
  useEffect(() => {
    if (!enabled || !audioRef.current) return;
    
    // Find orders we haven't played yet
    const unplayedIds = newOrderIds.filter(id => !playedRef.current.has(id));
    
    if (unplayedIds.length > 0) {
      // Set volume
      audioRef.current.volume = Math.min(1, Math.max(0, volume / 100));
      
      // Play sound
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error('[Kitchen Display] Error playing sound:', err);
      });
      
      // Mark as played
      unplayedIds.forEach(id => playedRef.current.add(id));
      onPlayed(unplayedIds);
    }
  }, [enabled, volume, newOrderIds, onPlayed]);

  // No visual output - just audio
  return null;
}

// ============================================
// Alternative: Use Web Audio API for more control
// ============================================

export function useKitchenSound(enabled: boolean, volume: number) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Web Audio
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initAudio = async () => {
      try {
        audioContextRef.current = new AudioContext();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        
        // Load sound file
        const response = await fetch('/sounds/kitchen-bell.mp3');
        const arrayBuffer = await response.arrayBuffer();
        bufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
      } catch (err) {
        console.error('[Kitchen Display] Error initializing audio:', err);
      }
    };

    initAudio();

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100;
    }
  }, [volume]);

  // Play function
  const playSound = useCallback(() => {
    if (!enabled || !audioContextRef.current || !bufferRef.current || !gainNodeRef.current) {
      return;
    }

    // Resume context if suspended (needed for auto-play policies)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = bufferRef.current;
    source.connect(gainNodeRef.current);
    source.start(0);
  }, [enabled]);

  return { playSound };
}





