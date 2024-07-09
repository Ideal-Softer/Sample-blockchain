import { FC } from "react";

interface ModalProps {
	show: boolean;
  handleModal: () => void;
  children: any;
  customClass: string;
}

const Modal:FC<ModalProps> = ({ show, handleModal, children, customClass }) => {
  return(
    <div className={`modal ${customClass}  ${show ? 'show' : ''}`}>
      <div className="modal_back" onClick={handleModal}></div>
			<div className="modal__content">
				{children}
			</div>
		</div>
  )
}

export default Modal;