import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
} from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { shallowEqual, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ImageUploadSingle from 'components/image-upload-single';
import settingService from 'services/settings';
import { fetchSettings as getSettings } from 'redux/slices/globalSettings';
import useDemo from 'helpers/useDemo';
import { CustomCard } from 'components/custom-card';
import { Time } from './deliveryman_time';

const Setting = ({ setFavicon, favicon, setLogo, logo }) => {
  const { t } = useTranslation();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const dispatch = useDispatch();
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [form] = Form.useForm();
  const { isDemo } = useDemo();

  const updateSettings = (data) => {
    setLoadingBtn(true);
    settingService
      .update(data)
      .then(() => {
        toast.success(t('successfully.updated'));
        dispatch(getSettings());
      })
      .finally(() => setLoadingBtn(false));
  };

  const onFinish = (values) => {
    const body = {
      ...values,
      favicon: favicon.name,
      logo: logo.name,
    };
    updateSettings(body);
  };

  return (
    <Form
      layout='vertical'
      form={form}
      name='global-settings'
      onFinish={onFinish}
      initialValues={{
        delivery: '1',
        // payment_type: 'admin',
        ...activeMenu.data,
        deliveryman_order_acceptance_time: String(
          activeMenu.data?.deliveryman_order_acceptance_time || 30,
        ),
      }}
    >
      <CustomCard title={t('settings')}>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label={t('title')}
              name='title'
              tooltip={t(
                'appears in browser title bar, website header, footer etc',
              )}
              rules={[
                {
                  validator(_, value) {
                    if (!value) {
                      return Promise.reject(new Error(t('required')));
                    } else if (value && value?.trim() === '') {
                      return Promise.reject(new Error(t('no.empty.space')));
                    } else if (value && value?.trim().length < 2) {
                      return Promise.reject(new Error(t('must.be.at.least.2')));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('deliveryman.order.acceptance.time')}
              name='deliveryman_order_acceptance_time'
            >
              <Select options={Time} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('service.fee')}
              name='service_fee'
              tooltip={t(
                "additional charge that covers the platform's operational costs, applied to each order",
              )}
              rules={[
                {
                  required: true,
                  message: t('required'),
                },
              ]}
            >
              <InputNumber min={0} className='w-100' />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('minimum.order.price')}
              name='min_amount'
              tooltip={t('order total price should be more than this value')}
              rules={[{ required: true, message: t('required') }]}
            >
              <InputNumber min={0} className='w-100' />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Space>
              <Form.Item
                label={t('favicon')}
                name='favicon'
                rules={[
                  {
                    required: true,
                    message: t('required'),
                  },
                ]}
              >
                <ImageUploadSingle
                  type='languages'
                  image={favicon}
                  setImage={setFavicon}
                  form={form}
                  name='favicon'
                />
              </Form.Item>
              <Form.Item
                label={t('logo')}
                name='logo'
                rules={[
                  {
                    required: true,
                    message: t('required'),
                  },
                ]}
              >
                <ImageUploadSingle
                  type='languages'
                  image={logo}
                  setImage={setLogo}
                  form={form}
                  name='logo'
                />
              </Form.Item>
            </Space>
          </Col>
        </Row>
        <Divider />
        <Space className='w-100 justify-content-end'>
          <Button
            onClick={() => form.submit()}
            type='primary'
            disabled={isDemo}
            loading={loadingBtn}
          >
            {t('save')}
          </Button>
        </Space>
      </CustomCard>
    </Form>
  );
};

export default Setting;
