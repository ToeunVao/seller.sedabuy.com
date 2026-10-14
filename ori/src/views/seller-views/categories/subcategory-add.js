import { useState } from 'react';
import { Button, Col, Form, Input, Row, Select, Switch } from 'antd';
import { toast } from 'react-toastify';
import TextArea from 'antd/es/input/TextArea';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import categoryService from 'services/seller/category';
import { useTranslation } from 'react-i18next';
import MediaUpload from 'components/upload';
import getTranslationFields from 'helpers/getTranslationFields';
import { setRefetch } from 'redux/slices/menu';

const SubcategoryAdd = ({ parent = {}, setId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [image, setImage] = useState(
    activeMenu.data?.image ? [activeMenu.data?.image] : [],
  );
  const [form] = Form.useForm();
  const [loadingBtn, setLoadingBtn] = useState(false);

  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );

  const onFinish = (values) => {
    setLoadingBtn(true);
    const body = {
      type: parent?.type === 'main' ? 'sub_main' : 'child',
      title: getTranslationFields(languages, values, 'title'),
      description: getTranslationFields(languages, values, 'description'),
      parent_id: values.parent_id?.value,
      keywords: values.keywords?.join(','),
      input: values.input,
      active: values.active ? 1 : 0,
      images: image?.map((img) => img.name) || [],
    };
    categoryService
      .create(body)
      .then(() => {
        toast.success(t('successfully.created'));
        dispatch(setRefetch(activeMenu));
        form.resetFields();
      })
      .finally(() => {
        setLoadingBtn(false);
        setId(null);
      });
  };
  if (!parent?.id) return null;

  return (
    <Form
      name='basic'
      layout='vertical'
      onFinish={onFinish}
      initialValues={{
        active: true,
        ...parent,
      }}
      form={form}
    >
      <Row gutter={24}>
        <Col span={24}>
          <Form.Item
            label={t('parent.category')}
            name='parent_id'
            rules={[{ required: false, message: t('required') }]}
          >
            <Select disabled />
          </Form.Item>
        </Col>
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
                      return Promise.reject(new Error(t('must.be.at.least.2')));
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

        <Col span={24}>
          {languages?.map((item) => (
            <Form.Item
              key={`description[${item?.locale}]`}
              label={t('description')}
              name={`description[${item?.locale}]`}
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
                      return Promise.reject(new Error(t('must.be.at.least.2')));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <TextArea rows={2} maxLength={150} />
            </Form.Item>
          ))}
        </Col>

        <Col span={24}>
          <Form.Item
            label={t('keywords')}
            name='keywords'
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <Select mode='tags' style={{ width: '100%' }}></Select>
          </Form.Item>
        </Col>

        <Col span={12}>
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
              type='categories'
              imageList={image}
              setImageList={setImage}
              form={form}
              multiple={false}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={t('active')} name='active' valuePropName='checked'>
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      <Button
        type='primary'
        htmlType='submit'
        loading={loadingBtn}
        className='w-100'
      >
        {t('submit')}
      </Button>
    </Form>
  );
};
export default SubcategoryAdd;
