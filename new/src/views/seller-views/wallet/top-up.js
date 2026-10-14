import { useState } from 'react';
import { Button, Col, Form, InputNumber, Modal, Row } from 'antd';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';
import restPaymentService from 'services/rest/payment';
import walletService from 'services/seller/wallet';
import { DebounceSelect } from 'components/search';

export default function WalletTopUp({ open = false, onCancel }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const { myShop } = useSelector((state) => state.myShop, shallowEqual);
  const { defaultCurrency } = useSelector(
    (state) => state.currency,
    shallowEqual,
  );
  const { user } = useSelector((state) => state.auth);
  const [loadingBtn, setLoadingBtn] = useState(false);

  const { settings } = useSelector(
    (state) => state.globalSettings,
    shallowEqual,
  );

  const fetchPaymentOptions = (search = '') => {
    const params = {
      search: search || undefined,
    };
    return (
      settings?.payment_type === 'admin'
        ? restPaymentService.getAll(params)
        : restPaymentService.getById(myShop?.id, params)
    ).then((res) => {
      return res?.data
        ?.filter((item) => item?.tag !== 'cash' && item?.tag !== 'wallet')
        ?.map((item) => ({
          label: t(item?.tag),
          value: item?.tag,
          key: item?.id,
        }));
    });
  };

  const onFinish = (values) => {
    setLoadingBtn(true);
    const data = {
      wallet_id: user?.walletId,
      total_price: values?.price,
      currency_id: defaultCurrency?.id,
    };
    walletService
      .topUp(values?.payment_type?.value, data)
      .then(({ data }) => {
        form.resetFields();
        window.open(data.data.url);
      })
      .finally(() => setLoadingBtn(false));
  };

  return (
    <Modal
      visible={open}
      title={t('wallet.top.up')}
      centered
      onCancel={onCancel}
      footer={[
        <Button key='cancel' onClick={onCancel}>
          {t('cancel')}
        </Button>,
        <Button
          type='primary'
          key='save'
          loading={loadingBtn}
          onClick={() => form.submit()}
        >
          {t('save')}
        </Button>,
      ]}
    >
      <Form form={form} layout='vertical' onFinish={onFinish}>
        <Row gutter={12}>
          <Col span={24}>
            <Form.Item
              name='price'
              label={t('price')}
              rules={[
                { required: true, message: t('required') },
                {
                  type: 'number',
                  min: 0,
                  message: t('should.be.greater.than.0'),
                },
              ]}
            >
              <InputNumber className='w-100' />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name='payment_type'
              label={t('payment.type')}
              rules={[{ required: true, message: t('required') }]}
            >
              <DebounceSelect fetchOptions={fetchPaymentOptions} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
