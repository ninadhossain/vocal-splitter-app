import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Job, StemInfo } from '@/types';

interface UseJobSSEReturn {
  job: Job | null;
  progress: number;
  currentStep: string;
  isProcessing: boolean;
  isComplete: boolean;
  error: string | null;
}

export function useJobSSE(
  jobId: string | null,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
): UseJobSSEReturn {
  const [job, setJob] = useState<Job | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>('Initializing');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setProgress(0);
      setIsProcessing(false);
      setIsComplete(false);
      setError(null);
      return;
    }

    setIsProcessing(true);
    setIsComplete(false);
    setError(null);
    setProgress(5);
    setCurrentStep('Connecting to AI Worker stream...');

    const eventSource = new EventSource(`${apiBaseUrl}/api/jobs/${jobId}/events`);

    eventSource.addEventListener('connected', () => {
      setCurrentStep('Worker stream connected. Processing audio...');
    });

    eventSource.addEventListener('progress', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        if (data.step) {
          setCurrentStep(data.step);
        }
      } catch (err) {
        console.error('Failed to parse SSE progress event:', err);
      }
    });

    eventSource.addEventListener('complete', (e) => {
      try {
        const data = JSON.parse(e.data);
        setProgress(100);
        setCurrentStep('Stem separation complete!');
        setIsProcessing(false);
        setIsComplete(true);
        if (data.job) {
          setJob(data.job);
        }

        // Trigger celebratory confetti effect
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981'],
        });
      } catch (err) {
        console.error('Failed to parse SSE complete event:', err);
      } finally {
        eventSource.close();
      }
    });

    eventSource.addEventListener('error', (e: any) => {
      try {
        if (e.data) {
          const data = JSON.parse(e.data);
          setError(data.error || 'Separation job encountered an error.');
        } else {
          // Check if job finished already by querying REST
          fetch(`${apiBaseUrl}/api/jobs/${jobId}`)
            .then((r) => r.json())
            .then((res) => {
              if (res.job?.status === 'COMPLETED') {
                setJob(res.job);
                setIsComplete(true);
                setIsProcessing(false);
                setProgress(100);
              }
            })
            .catch(() => {});
        }
      } catch {
        setError('Connection to audio processing worker lost.');
      }
    });

    return () => {
      eventSource.close();
    };
  }, [jobId, apiBaseUrl]);

  return {
    job,
    progress,
    currentStep,
    isProcessing,
    isComplete,
    error,
  };
}
