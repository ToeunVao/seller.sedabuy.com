import { useState } from 'react';
import { Button, Col, Form, Modal, Row, Select } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setRefetch } from 'redux/slices/menu';
import shopService from 'services/shop';

const statuses = ['new', 'approved', 'rejected'];

export default function ShopStatusModal({ data, handleCancel }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    const params = {
      status: values.status,
    };
    shopService
      .statusChange(data.uuid, params)
      .then(() => {
        handleCancel();
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal
      visible={!!data}
      title={data?.translation?.title || t('N/A')}
      onCancel={handleCancel}
      footer={[
        <Button type='default' onClick={handleCancel}>
          {t('cancel')}
        </Button>,
        <Button type='primary' onClick={() => form.submit()} loading={loading}>
          {t('save')}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={onFinish}
        initialValues={{ status: data.status }}
      >
        <Row gutter={12}>
          <Col span={24}>
            <Form.Item
              label={t('status')}
              name='status'
              rules={[
                {
                  required: true,
                  message: t('required'),
                },
              ]}
            >
              <Select>
                {statuses.map((item, idx) => (
                  <Select.Option key={item + idx} value={item}>
                    {t(item)}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
