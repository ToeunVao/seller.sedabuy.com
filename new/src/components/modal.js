import React, { useContext } from 'react';
import { Button, Modal, Space } from 'antd';
import { Context } from '../context/context';
import { useTranslation } from 'react-i18next';

const CustomModal = ({
  text,
  click,
  loading,
  setText,
  setActive,
  setVerify,
}) => {
  const { t } = useTranslation();
  const { isModalVisible, setIsModalVisible } = useContext(Context);

  const handleCancel = () => {
    setIsModalVisible(false);
    if (setText) setText([]);
    if (setActive) setActive(null);
    if (setVerify) setVerify(null);
  };

  return (
    <Modal
      centered
      closable={false}
      visible={isModalVisible}
      footer={null}
      onCancel={handleCancel}
    >
      <p>{text}</p>
      <div className='d-flex justify-content-end w-100' style={{ gap: '10px' }}>
        <Button onClick={handleCancel}>{t('no')}</Button>
        <Button type='primary' onClick={click} loading={loading}>
          {t('yes')}
        </Button>
      </div>
    </Modal>
  );
};

export default CustomModal;
