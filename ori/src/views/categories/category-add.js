import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Switch,
  InputNumber,
  Divider,
  Space,
} from 'antd';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import LanguageList from 'components/language-list';
import TextArea from 'antd/es/input/TextArea';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { removeFromMenu } from 'redux/slices/menu';
import categoryService from 'services/category';
import { useTranslation } from 'react-i18next';
import MediaUpload from 'components/upload';
import { AsyncTreeSelect } from 'components/async-tree-select';
import { CustomCard } from 'components/custom-card';
import getTranslationFields from 'helpers/getTranslationFields';

const CategoryAdd = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [type, setType] = useState('main');
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
      type: values.parent_id?.value ? type : 'main',
      title: getTranslationFields(languages, values, 'title'),
      description: getTranslationFields(languages, values, 'description'),
      parent_id: values.parent_id?.value,
      keywords: values.keywords?.join(','),
      input: values.input,
      active: values.active ? 1 : 0,
      images: image?.map((img) => img.name) || [],
    };
    const nextUrl = 'catalog/categories';
    categoryService
      .create(body)
      .then(() => {
        toast.success(t('successfully.created'));
        dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
        navigate(`/${nextUrl}`);
      })
      .finally(() => setLoadingBtn(false));
  };

  const fetchCategories = () => {
    const params = { perPage: 100, type: 'main' };
    return categoryService.getAll(params).then((res) =>
      res.data.map((item) => ({
        label: item.translation?.title,
        value: item.id,
        key: item.id,
        type: 'main',
        children: item.children?.map((el) => ({
          label: el.translation?.title,
          value: el.id,
          key: el.id,
          type: 'sub_main',
          disabled: el.type === 'child',
          children: el.children?.map((three) => ({
            label: three.translation?.title,
            value: three.id,
            key: three.id,
            disabled: true,
            type: 'child',
          })),
        })),
      })),
    );
  };

  const handleSelectCategory = (value, node) => {
    const { type } = node || {};
    const nextType =
      type === 'main' ? 'sub_main' : type === 'sub_main' ? 'child' : 'main';
    setType(nextType);
  };
  return (
    <Card title={t('add.category')} extra={<LanguageList />}>
      <Form
        layout='vertical'
        initialValues={{
          active: true,
        }}
        form={form}
        onFinish={onFinish}
      >
        <Row gutter={[12, 20]}>
          <Col span={24}>
            <CustomCard title={t('basic')}>
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
                              return Promise.reject(
                                new Error(t('must.be.at.least.2')),
                              );
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
              </Row>
            </CustomCard>
          </Col>
          <Col span={24}>
            <CustomCard title={t('additional.information')}>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    label={t('parent.category')}
                    name='parent_id'
                    rules={[{ required: false, message: t('required') }]}
                  >
                    <AsyncTreeSelect
                      refetch
                      fetchOptions={fetchCategories}
                      onSelect={handleSelectCategory}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
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
                <Col span={8}>
                  <Form.Item
                    name='input'
                    label={t('order.of.category')}
                    rules={[
                      {
                        required: true,
                        message: t('required'),
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      parser={(value) => parseInt(value, 10)}
                      max={9999999}
                      className='w-100'
                    />
                  </Form.Item>
                </Col>
                <Col>
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
                <Col>
                  <Form.Item
                    label={t('active')}
                    name='active'
                    valuePropName='checked'
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </CustomCard>
          </Col>
        </Row>
        <Divider />
        <Space className='w-100 justify-content-end'>
          <Button type='primary' htmlType='submit' loading={loadingBtn}>
            {t('submit')}
          </Button>
        </Space>
      </Form>
    </Card>
  );
};
export default CategoryAdd;
