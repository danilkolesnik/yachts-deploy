import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
} from "@material-tailwind/react";

const Modal = ({ isOpen, onClose, title, children, bodyClassName = "overflow-hidden" }) => {
  return (
    <Dialog open={isOpen} handler={onClose} dismiss={{ outsidePress: false }} className="">
      <DialogHeader className="text-black">{title}</DialogHeader>
      <DialogBody className={bodyClassName}>{children}</DialogBody>
    </Dialog>
  );
};

export default Modal;