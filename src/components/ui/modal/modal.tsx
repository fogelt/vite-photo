interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'danger';
  onConfirm?: () => void;
  onClose: () => void;
}

export function Modal({ isOpen, title, message, type = 'info', onConfirm, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white max-w-sm w-full p-8 shadow-2xl border border-stone-100 space-y-6">
        <div className="space-y-2">
          <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-stone-900">
            {title}
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed font-light">
            {message}
          </p>
        </div>

        <div className="flex gap-4 pt-2">
          {onConfirm ? (
            <>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`flex-1 text-[9px] uppercase tracking-widest py-3 font-bold transition-all ${type === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-stone-900 text-white hover:bg-stone-700'
                  }`}
              >
                Bekräfta
              </button>
              <button
                onClick={onClose}
                className="flex-1 text-[9px] uppercase tracking-widest py-3 border border-stone-200 text-stone-400 hover:text-stone-900 hover:border-stone-900 font-bold transition-all"
              >
                Avbryt
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-stone-900 text-white text-[9px] uppercase tracking-widest py-3 font-bold hover:bg-stone-700 transition-all"
            >
              Stäng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}