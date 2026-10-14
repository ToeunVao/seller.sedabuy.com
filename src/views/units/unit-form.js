import { useTranslation } from 'react-i18next';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Row,
  Col,
  Input,
  Select,
  Switch,
  Space,
  Button,
  Divider,
} from 'antd';
import LanguageList from 'components/language-list';
import { useEffect, useState } from 'react';
import getTranslationFields from 'helpers/getTranslationFields';
import { toast } from 'react-toastify';
import { disableRefetch, removeFromMenu } from 'redux/slices/menu';
import unitService from 'services/unit';
import getLanguageFields from 'helpers/getLanguageFields';
import useDidUpdate from 'helpers/useDidUpdate';

const unitPositions = ['before', 'after'];

export const UnitForm = ({ title, id, onSubmit }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnit = () => {
    setIsLoading(true);
    unitService
      .getById(id)
      .then((res) => {
        form.setFieldsValue({
          ...getLanguageFields(languages, res?.data),
          position: res?.data?.position,
          active: Boolean(res?.data?.active),
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const onFinish = (values) => {
    setIsSubmitting(true);
    const body = {
      title: getTranslationFields(languages, values, 'title'),
      position: values.position,
      active: values.active ? 1 : 0,
    };
    onSubmit(body)
      .then(() => {
        const nextUrl = 'catalog/units';
        toast.success(t('successfully.created'));
        dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
        navigate(`/${nextUrl}`);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const fetch = () => {
    fetchUnit();
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    if (id) {
      fetch();
    }
  }, [id]);

  useDidUpdate(() => {
    if (activeMenu.refetch && id) {
      fetch();
    }
  }, [activeMenu.refetch, id]);

  return (
    <Card title={t(title)} extra={<LanguageList />} loading={isLoading}>
      <Form form={form} layout='vertical' onFinish={onFinish}>
        <Row gutter={12}>
          <Col span={8}>
            {languages?.map((item) => (
              <Form.Item
                key={`title[${item?.locale}]`}
                label={t('title')}
                name={`title[${item?.locale}]`}
                hidden={item?.locale !== defaultLang}
                rules={[
                  {
                    required: item?.locale === defaultLang,
                    message: t('required'),
                  },
                  {
                    validator(_, value) {
                      if (
                        value &&
                        value?.trim()?.length < 2 &&
                        item?.locale === defaultLang
                      ) {
                        return Promise.reject(
                          new Error(t('must.be.at.least.2')),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input maxLength={50} />
              </Form.Item>
            ))}
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('position')}
              name='position'
              tooltip={t('show.unit.before.or.after.quantity')}
              rules={[
                {
                  required: true,
                  message: t('required'),
                },
              ]}
            >
              <Select
                options={unitPositions.map((unitPosition) => ({
                  label: t(unitPosition),
                  value: unitPosition,
                  key: unitPosition,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('active')}
              name='active'
              valuePropName='checked'
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Divider />
        <Space className='w-100 justify-content-end'>
          <Button htmlType='submit' type='primary' loading={isSubmitting}>
            {t('submit')}
          </Button>
        </Space>
      </Form>
    </Card>
  );
};
