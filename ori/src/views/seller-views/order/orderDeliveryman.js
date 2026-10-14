import { useState } from 'react';
import { Button, Col, Form, Modal, Row } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import orderService from 'services/seller/order';
import { setRefetch } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import { DebounceSelect } from 'components/search';
import sellerDeliverymenService from 'services/seller/user';

export default function OrderDeliveryman({ orderDetails: data, handleCancel }) {
  const { t } = useTranslation();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    const params = { deliveryman_id: values.deliveryman.value };
    setLoading(true);
    orderService
      .updateDelivery(data.id, params)
      .then(() => {
        handleCancel();
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => setLoading(false));
  };

  const fetchDeliverymen = (search) => {
    const paramsData = {
      perPage: 10,
      page: 1,
      exist_token: 1,
      search: search?.length ? search : undefined,
    };
    return sellerDeliverymenService.getDeliverymans(paramsData).then((res) => {
      return res?.data?.map((item) => ({
        label: `${item?.firstname || ''} ${item?.lastname || ''}`,
        value: item?.id,
        key: item?.id,
      }));
    });
  };

  return (
    <Modal
      visible={!!data}
      title={data?.title}
      onCancel={handleCancel}
      footer={[
        <Button type='primary' onClick={() => form.submit()} loading={loading}>
          {t('save')}
        </Button>,
        <Button type='default' onClick={handleCancel}>
          {t('cancel')}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={onFinish}
        initialValues={{
          deliveryman: {
            label: `${data?.deliveryman?.firstname || ''} ${
              data?.deliveryman?.lastname || ''
            }`,
            value: data?.deliveryman?.id,
            key: data?.deliveryman?.id,
          },
        }}
      >
        <Row gutter={12}>
          <Col span={24}>
            <Form.Item
              label={t('deliveryman')}
              name='deliveryman'
              rules={[
                {
                  required: true,
                  message: t('required'),
                },
              ]}
            >
              <DebounceSelect fetchOptions={fetchDeliverymen} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
