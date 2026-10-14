import {
  Card,
  Form,
  Row,
  Col,
  Input,
  Switch,
  Space,
  Button,
  Divider,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import MediaUpload from 'components/upload';
import { toast } from 'react-toastify';
import { disableRefetch, removeFromMenu } from 'redux/slices/menu';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import brandService from 'services/brand';
import createImage from 'helpers/createImage';
import { checkIsTrueValue } from 'helpers/checkIsTrueValue';
import useDidUpdate from 'helpers/useDidUpdate';

export const BrandForm = ({ title, id, onSubmit }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [image, setImage] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBrand = () => {
    setIsLoading(true);
    brandService
      .getById(id)
      .then((res) => {
        const body = {
          title: res?.data?.title,
          images: [createImage(res?.data?.img)],
          active: checkIsTrueValue(res?.data?.active),
        };
        setImage(body.images);
        form.setFieldsValue(body);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const onFinish = (values) => {
    setIsSubmitting(true);
    const body = {
      title: values.title,
      images: image?.map((img) => img.name),
      active: values.active ? 1 : 0,
    };
    onSubmit(body)
      .then(() => {
        toast.success(t('successfully.saved'));
        const nextUrl = 'catalog/brands';
        dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
        navigate(`/${nextUrl}`);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const fetch = () => {
    fetchBrand();
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    if (id) {
      fetch();
    }
  }, [id]);

  useDidUpdate(() => {
    if (id && activeMenu.refetch) {
      fetch();
    }
  }, [id, activeMenu.refetch]);

  return (
    <Card title={t(title)} loading={isLoading} onFinish={onFinish}>
      <Form form={form} layout='vertical' onFinish={onFinish}>
        <Row gutter={12}>
          <Col span={24}>
            <Form.Item
              label={t('title')}
              name='title'
              rules={[
                { required: true, message: t('required') },
                {
                  validator(_, value) {
                    if (value && value?.trim()?.length < 2) {
                      return Promise.reject(new Error(t('must.be.at.least.2')));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input maxLength={50} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label={t('image')}
              name='images'
              rules={[
                {
                  required: !image?.length,
                  message: t('required'),
                },
              ]}
            >
              <MediaUpload
                type='brands'
                imageList={image}
                setImageList={setImage}
                form={form}
                multiple={false}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
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
