import {
  Button,
  Col,
  Descriptions,
  Divider,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
} from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { shallowEqual } from 'react-redux';
import { toast } from 'react-toastify';
import settingService from 'services/settings';
import { fetchSettings as getSettings } from 'redux/slices/globalSettings';
import {
  AppleOutlined,
  FacebookOutlined,
  GoogleOutlined,
} from '@ant-design/icons';
import { CustomCard } from 'components/custom-card';

const socialAuthOptions = [
  {
    name: 'social_auth_google',
    icon: <GoogleOutlined style={{ fontSize: '1.5rem' }} />,
  },
  {
    name: 'social_auth_apple',
    icon: <AppleOutlined style={{ fontSize: '1.5rem' }} />,
  },
  {
    name: 'social_auth_facebook',
    icon: <FacebookOutlined style={{ fontSize: '1.5rem' }} />,
  },
];

const authOptions = [{ name: 'all' }, { name: 'email' }, { name: 'phone' }];

const Auth = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const dispatch = useDispatch();
  const [loadingBtn, setLoadingBtn] = useState(false);

  function updateSettings(data) {
    const payload = Object.assign({}, data);
    for (const key in payload) {
      if (key.startsWith('social_auth') && payload[key] === undefined) {
        payload[key] = true;
      }
    }
    setLoadingBtn(true);
    settingService
      .update(payload)
      .then(() => {
        toast.success(t('successfully.updated'));
        dispatch(getSettings());
      })
      .finally(() => setLoadingBtn(false));
  }

  const onFinish = (values) => updateSettings(values);

  return (
    <Form
      layout='vertical'
      form={form}
      name='global-settings'
      onFinish={onFinish}
      initialValues={{
        ...activeMenu.data,
      }}
    >
      <CustomCard title={t('auth.settings')}>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label={t('otp.expire.time') + ' ' + `( ${t('minute')} )`}
              name='otp_expire_time'
              rules={[
                {
                  required: true,
                  message: t('required'),
                },
              ]}
            >
              <InputNumber addonAfter={t('minut')} className='w-100' min={0} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('auth.options')} name='auth_option'>
              <Select
                defaultValue='all'
                options={authOptions.map((option) => ({
                  label: t(option.name),
                  value: option.name,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('social.auth.options')}>
              <Descriptions
                bordered
                column={1}
                style={{ width: 'fit-content' }}
              >
                {socialAuthOptions.map((option) => (
                  <Descriptions.Item key={option.name} label={option.icon}>
                    <Form.Item
                      noStyle
                      name={option.name}
                      valuePropName='checked'
                    >
                      <Switch defaultChecked />
                    </Form.Item>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Form.Item>
          </Col>
        </Row>
        <Divider />
        <Space className='w-100 justify-content-end'>
          <Button
            type='primary'
            onClick={() => form.submit()}
            loading={loadingBtn}
          >
            {t('save')}
          </Button>
        </Space>
      </CustomCard>
    </Form>
  );
};

export default Auth;
