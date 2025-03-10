import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
} from "@material-tailwind/react";

const Modal = ({ isOpen, onClose, title, children }) => {
  return (
    <Dialog open={isOpen} handler={onClose} dismiss={{ outsidePress: true }}>
      <DialogHeader className="text-black">{title}</DialogHeader>
      <DialogBody>{children}</DialogBody>
    </Dialog>
  );
};

export default Modal;