'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { RiForward10Line, RiReplay10Line } from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
}

export function VideoPlayer({ src, title, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('loadeddata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('loadeddata', updateDuration);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const skip = (sec: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.duration, videoRef.current.currentTime + sec)
    );
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (value: number[]) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value[0];
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0];
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (muted) {
      videoRef.current.volume = volume;
      videoRef.current.muted = false;
      setMuted(false);
    } else {
      videoRef.current.volume = 0;
      videoRef.current.muted = true;
      setMuted(true);
    }
  };

  const speedLevels = [0.75, 1, 1.25, 1.5, 2];

  const changePlaybackSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const cycleSpeed = () => {
    const currentIndex = speedLevels.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speedLevels.length;
    const nextSpeed = speedLevels[nextIndex];
    changePlaybackSpeed(nextSpeed);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  return (
    <div className="flex justify-center">
      <div
        ref={containerRef}
        className={`relative max-w-4xl w-full bg-black rounded-3xl overflow-hidden ${
          isFullscreen ? 'h-screen' : ''
        }`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-auto"
          onEnded={() => setPlaying(false)}
          onClick={togglePlay}
        />

        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Play/Pause Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="lg"
              onClick={togglePlay}
              className="bg-black/50 hover:bg-black/70 border-none text-white"
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8" />
              )}
            </Button>
          </div>

          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
            <div className="flex justify-between items-center">
              {title && (
                <h3 className="text-white text-sm font-medium truncate">
                  {title.replace(/\.[^/.]+$/, '')}
                </h3>
              )}
              <Button
                size="sm"
                onClick={cycleSpeed}
                className="bg-black/50 hover:bg-black/70 text-white text-xs px-2 py-1 h-8 w-12"
                title="Change playback speed"
              >
                {playbackSpeed}x
              </Button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            {/* Progress Bar */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white text-xs min-w-[40px]">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={handleProgressChange}
                className="flex-1"
              />
              <span className="text-white text-xs min-w-[40px]">
                {formatTime(duration)}
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => skip(-10)}
                  className="bg-transparent hover:bg-white/20 text-white p-1"
                  title="« 10s"
                >
                  <RiReplay10Line className="w-5 h-5" />
                </Button>
                <Button
                  size="sm"
                  onClick={togglePlay}
                  className="bg-transparent hover:bg-white/20 text-white p-1"
                  title={playing ? 'Pause' : 'Play'}
                >
                  {playing ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => skip(10)}
                  className="bg-transparent hover:bg-white/20 text-white p-1"
                  title="10s »"
                >
                  <RiForward10Line className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={toggleMute}
                    className="bg-transparent hover:bg-white/20 text-white p-1"
                    title={muted ? 'Unmute' : 'Mute'}
                  >
                    {muted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>
                  <div className="w-20">
                    <Slider
                      value={[muted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-full"
                    />
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={toggleFullscreen}
                  className="bg-transparent hover:bg-white/20 text-white p-1"
                  title="Fullscreen"
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
