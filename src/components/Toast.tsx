import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success" />,
    error: <AlertCircle className="w-5 h-5 text-danger" />,
    info: <Info className="w-5 h-5 text-forest-500" />,
  };

  const bgColors = {
    success: 'bg-success/10 border-success/20',
    error: 'bg-danger/10 border-danger/20',
    info: 'bg-forest-50 border-forest-200',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bgColors[type]} shadow-lg animate-slide-in-right`}
    >
      {icons[type]}
      <p className="text-stone-800 text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-stone-400 hover:text-stone-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>;
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

export default Toast;
