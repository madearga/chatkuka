// @/components/chat-input/personas.tsx
"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { PERSONAS, TRANSITION_SPRING, TRANSITION_VARIANTS } from "@/lib/ai/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonPersonaProps = {
  label: string;
  prompt: string;
  onSelectSystemPrompt: (systemPrompt: string) => void;
  systemPrompt?: string;
  icon: React.ElementType;
};

const ButtonPersona = memo(function ButtonPersona({
  label,
  prompt,
  onSelectSystemPrompt,
  systemPrompt,
  icon: Icon,
}: ButtonPersonaProps) {
  const isActive = systemPrompt === prompt;

  return (
    <Button
      key={label}
      variant="outline"
      size="sm"
      onClick={() =>
        isActive ? onSelectSystemPrompt("") : onSelectSystemPrompt(prompt)
      }
      className={cn(
        "rounded-full h-auto py-1.5 px-3 flex items-center gap-1.5 text-xs sm:text-sm",
        isActive &&
          "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
      type="button"
    >
      <Icon className="size-4" />
      {label}
    </Button>
  );
});

type PersonasProps = {
  onSelectSystemPrompt: (systemPrompt: string) => void;
  systemPrompt?: string;
};

export const Personas = memo(function Personas({
  onSelectSystemPrompt,
  systemPrompt,
}: PersonasProps) {
  return (
    <motion.div
      className="flex w-full max-w-full flex-wrap justify-center gap-2 px-2 mx-auto md:max-w-2xl no-scrollbar"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={TRANSITION_VARIANTS}
      transition={TRANSITION_SPRING}
    >
      {PERSONAS.map((persona, index) => (
        <motion.div
          key={persona.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            ...TRANSITION_SPRING,
            delay: index * 0.02,
          }}
        >
          <ButtonPersona
            key={persona.label}
            label={persona.label}
            prompt={persona.prompt}
            onSelectSystemPrompt={onSelectSystemPrompt}
            systemPrompt={systemPrompt}
            icon={persona.icon}
          />
        </motion.div>
      ))}
    </motion.div>
  );
});
