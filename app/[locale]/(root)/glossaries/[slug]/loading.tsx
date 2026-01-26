import { Loader2 } from 'lucide-react';

const Loading = () => {
  return (
    <div className="flex h-96 w-full items-center justify-center">
      <Loader2 className="size-10 animate-spin" />
    </div>
  );
};

export default Loading;