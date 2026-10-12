"use client";

import React, { useEffect } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";

export interface AnimatedCounterProps {
  value: number;
  precision?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  stiffness?: number;
  damping?: number;
}

export default function AnimatedCounter({
  value,
  precision = 0,
  prefix = "",
  suffix = "",
  className = "",
  stiffness = 85,
  damping = 20,
}: AnimatedCounterProps) {
  const motionVal = useMotionValue(value);
  const springVal = useSpring(motionVal, { stiffness, damping });

  const displayVal = useTransform(springVal, (current) => {
    const safeNum = Number.isFinite(current) ? current : value;
    return `${prefix}${safeNum.toFixed(precision)}${suffix}`;
  });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return <motion.span className={className}>{displayVal}</motion.span>;
}
