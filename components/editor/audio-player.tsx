'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { RiForward10Line, RiReplay10Line } from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export interface AudioPlayerProps {
  src: string;
  title?: string;
}

export function AudioPlayer({ src, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadeddata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadeddata', updateDuration);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  const skip = (sec: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(audioRef.current.duration, audioRef.current.currentTime + sec)
    );
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
  };

  const speedLevels = [0.75, 1, 1.25, 1.5, 2, 3];

  const changePlaybackSpeed = (speed: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const cycleSpeed = () => {
    const currentIndex = speedLevels.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speedLevels.length;
    const nextSpeed = speedLevels[nextIndex];
    changePlaybackSpeed(nextSpeed);
  };

  return (
    <div className="flex justify-center">
      <div className="p-4 bg-card rounded-3xl relative max-w-lg w-full">
        <Button
          type="button"
          size="default"
          onClick={cycleSpeed}
          className="absolute top-2 right-2 text-xs px-2 py-1 h-8 w-12"
          title="Change playback speed"
          variant="outline"
        >
          {playbackSpeed}x
        </Button>
        <audio
          ref={audioRef}
          src={src}
          style={{ display: 'none' }}
          onEnded={() => setPlaying(false)}
        />
        <div className="flex flex-col gap-2">
          {title && (
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                {title.replace(/\.[^/.]+$/, '')}
              </span>
            </div>
          )}
          <div className="flex justify-center items-center gap-2">
            <Button type="button" size="lg" onClick={() => skip(-10)} title="« 10s">
              <RiReplay10Line className="text-2xl" />
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={togglePlay}
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </Button>
            <Button type="button" size="lg" onClick={() => skip(10)} title="10s »">
              <RiForward10Line />
            </Button>
          </div>
          <div className="flex items-center gap-4 md:gap-8 px-2 md:px-4">
            <span className="text-xs text-muted-foreground">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleSliderChange}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
