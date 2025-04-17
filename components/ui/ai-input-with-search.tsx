'use client';

import { Globe, Paperclip, Send, Search, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAutoResizeTextarea } from '@/components/hooks/use-auto-resize-textarea';

interface AIInputWithSearchProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onSubmit?: (value: string, withSearch: boolean) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
  defaultSearchEnabled?: boolean;
  initialValue?: string;
}

export function AIInputWithSearch({
  id = 'ai-input-with-search',
  placeholder = 'Search the web...',
  minHeight = 48,
  maxHeight = 164,
  onSubmit,
  onFileSelect,
  className,
  defaultSearchEnabled = true,
  initialValue = '',
}: AIInputWithSearchProps) {
  const [value, setValue] = useState(initialValue);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });
  const [showSearch, setShowSearch] = useState(defaultSearchEnabled);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
      adjustHeight();
    }
  }, [initialValue]);

  useEffect(() => {
    if (isSubmitting && value.trim() === '') {
      setIsSubmitting(false);
    }
  }, [value, isSubmitting]);

  const handleSubmit = () => {
    if (value.trim() && !isSubmitting) {
      setIsSubmitting(true);

      try {
        onSubmit?.(value, showSearch);
        setValue('');
        adjustHeight(true);
      } finally {
        setTimeout(() => {
          setIsSubmitting(false);
        }, 500);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect?.(file);
    }
  };

  return (
    <div className={cn('w-full py-4', className)}>
      <div className="relative max-w-xl w-full mx-auto">
        {isSubmitting && showSearch && (
          <div className="absolute -top-10 left-0 right-0 mx-auto w-fit bg-sky-500/15 text-sky-500 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Searching the web...</span>
          </div>
        )}
        <div className="relative flex flex-col">
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            <Textarea
              id={id}
              value={value}
              placeholder={
                showSearch ? 'Search the web...' : 'Send a message...'
              }
              className="w-full rounded-xl rounded-b-none px-3 sm:px-4 py-2 sm:py-3 bg-black/5 dark:bg-white/5 border-none dark:text-white placeholder:text-black/70 dark:placeholder:text-white/70 resize-none focus-visible:ring-0 leading-[1.2] text-sm sm:text-base"
              ref={textareaRef}
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
            />
          </div>

          <div className="h-12 bg-black/5 dark:bg-white/5 rounded-b-xl">
            <div className="absolute left-2 sm:left-3 bottom-3 flex items-center gap-1 sm:gap-2">
              <label
                className={cn(
                  'cursor-pointer rounded-lg p-2 bg-black/5 dark:bg-white/5',
                  isSubmitting && 'opacity-50 cursor-not-allowed',
                )}
              >
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
                <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors" />
              </label>
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                disabled={isSubmitting}
                className={cn(
                  'rounded-full transition-all flex items-center gap-1 sm:gap-2 px-1 sm:px-1.5 py-1 border h-7 sm:h-8',
                  showSearch
                    ? 'bg-sky-500/15 border-sky-400 text-sky-500'
                    : 'bg-black/5 dark:bg-white/5 border-transparent text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white',
                  isSubmitting && 'opacity-50 cursor-not-allowed',
                )}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <motion.div
                    animate={{
                      rotate: showSearch ? 180 : 0,
                      scale: showSearch ? 1.1 : 1,
                    }}
                    whileHover={{
                      rotate: showSearch ? 180 : 15,
                      scale: 1.1,
                      transition: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 10,
                      },
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 25,
                    }}
                  >
                    <Globe
                      className={cn(
                        'w-3.5 h-3.5 sm:w-4 sm:h-4',
                        showSearch ? 'text-sky-500' : 'text-inherit',
                      )}
                    />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {showSearch && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{
                        width: 'auto',
                        opacity: 1,
                      }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs sm:text-sm overflow-hidden whitespace-nowrap text-sky-500 flex-shrink-0"
                    >
                      Search
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
            <div className="absolute right-2 sm:right-3 bottom-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!value.trim() || isSubmitting}
                className={cn(
                  'rounded-lg p-1.5 sm:p-2 transition-colors',
                  value && !isSubmitting
                    ? 'bg-sky-500/15 text-sky-500'
                    : 'bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40',
                  isSubmitting && 'opacity-50 cursor-not-allowed',
                )}
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
