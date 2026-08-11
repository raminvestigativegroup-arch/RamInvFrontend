import React from 'react';
import { ScrollReveal } from '../ScrollReveal';

interface RevealWrapperProps {
  children: React.ReactNode;
  delay?: number;
  revealOnScroll?: boolean;
}

export const RevealWrapper = ({ children, delay = 0, revealOnScroll = true }: RevealWrapperProps) => {
  if (!revealOnScroll) return <>{children}</>;
  return <ScrollReveal delay={delay}>{children}</ScrollReveal>;
};
