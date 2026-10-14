import { useTranslation } from 'react-i18next';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Divider, Form, Input, Row, Space } from 'antd';
import { useEffect, useState } from 'react';
import getTranslationFields from 'helpers/getTranslationFields';
import { toast } from 'react-toastify';
import { disableRefetch, removeFromMenu } from 'redux/slices/menu';
import LanguageList from 'components/language-list';
import shopTagService from 'services/shopTag';
import getLanguageFields from 'helpers/getLanguageFields';
import useDidUpdate from 'helpers/useDidUpdate';

export const ShopTagForm = ({ title, id, onSubmit }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = () => {
    setIsLoading(true);
    shopTagService
      .getById(id)
      .then((res) => {
        const body = {
          ...getLanguageFields(languages, res?.data),
        };
        form.setFieldsValue(body);
      })
      .finally(() => {
        setIsLoading(false);
      });
    dispatch(disableRefetch(activeMenu));
  };

  const onFinish = (values) => {
    setIsSubmitting(true);
    const body = {
      title: getTranslationFields(languages, values, 'title'),
    };
    onSubmit(body)
      .then(() => {
        const nextUrl = 'shop-tag';
        toast.success(t('successfully.created'));
        dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
        navigate(`/${nextUrl}`);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  useEffect(() => {
    if (id) {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useDidUpdate(() => {
    if (id && activeMenu.refetch) {
      fetch();
    }
  }, [id, activeMenu.refetch]);

  return (
    <Card title={t(title)} extra={<LanguageList />} loading={isLoading}>
      <Form form={form} layout='vertical' onFinish={onFinish}>
        <Row gutter={12}>
          <Col span={24}>
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
        </Row>
        <Divider />
        <Space className='w-100 justify-content-end'>
          <Button type='primary' htmlType='submit' loading={isSubmitting}>
            {t('submit')}
          </Button>
        </Space>
      </Form>
    </Card>
  );
};
