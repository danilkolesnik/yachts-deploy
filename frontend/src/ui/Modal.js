import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
} from "@material-tailwind/react";

/** Fluid width with side margin; max-width caps desktop size (no min-width — safe on mobile). */
const SIZE_CLASSES = {
  sm: "w-[calc(100vw-1.5rem)] max-w-sm",
  md: "w-[calc(100vw-1.5rem)] max-w-lg",
  lg: "w-[calc(100vw-1.5rem)] max-w-3xl",
  xl: "w-[calc(100vw-1.5rem)] max-w-5xl",
  "2xl": "w-[calc(100vw-1.5rem)] !max-w-7xl",
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  bodyClassName = "overflow-hidden",
  size = "md",
  className = "",
}) => {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <Dialog
      open={isOpen}
      handler={onClose}
      dismiss={{ outsidePress: false }}
      className={`${sizeClass} ${className}`.trim()}
    >
      <DialogHeader className="text-black">{title}</DialogHeader>
      <DialogBody className={bodyClassName}>{children}</DialogBody>
    </Dialog>
  );
};

export default Modal;