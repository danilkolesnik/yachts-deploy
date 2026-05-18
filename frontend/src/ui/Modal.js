import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
} from "@material-tailwind/react";

const SIZE_CLASSES = {
  sm: "min-w-[320px] max-w-md",
  md: "min-w-[400px] max-w-lg",
  lg: "min-w-[560px] max-w-3xl",
  xl: "min-w-[720px] max-w-5xl w-[92vw]",
  "2xl": "min-w-[880px] max-w-6xl w-[95vw]",
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