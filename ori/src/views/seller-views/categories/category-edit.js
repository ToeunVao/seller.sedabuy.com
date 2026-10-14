import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
} from 'antd';
import { toast } from 'react-toastify';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import LanguageList from 'components/language-list';
import TextArea from 'antd/es/input/TextArea';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, removeFromMenu } from 'redux/slices/menu';
import sellerCategory from 'services/seller/category';
import { useTranslation } from 'react-i18next';
import MediaUpload from 'components/upload';
import requestModelsService from 'services/seller/request-models';
import { AsyncTreeSelect } from 'components/async-tree-select';
import getLanguageFields from 'helpers/getLanguageFields';
import useDidUpdate from 'helpers/useDidUpdate';
import createImage from 'helpers/createImage';
import { CustomCard } from 'components/custom-card';

const SellerCategoryEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { state } = useLocation();

  const [type, setType] = useState('main');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(
    activeMenu.data?.image ? [activeMenu.data?.image] : [],
  );
  const [form] = Form.useForm();
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [category, setCategory] = useState(null);

  const { uuid } = useParams();
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );

  const fetchCategory = () => {
    setLoading(true);
    sellerCategory
      .getById(uuid)
      .then((res) => {
        const body = {
          id: res?.data?.id,
          ...getLanguageFields(languages, res?.data, ['title', 'description']),
          input: res?.data?.input || 0,
          image: [createImage(res?.data?.img)],
          keywords: res?.data?.keywords?.split(','),
          parent_id: {
            label: res?.data?.parent?.translation?.title,
            value: res?.data?.parent_id,
            key: res?.data?.parent_id,
          },
        };
        form.setFieldsValue(body);
        setImage([createImage(res?.data?.img)]);
        setCategory(res?.data);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onFinish = (values) => {
    setLoadingBtn(true);
    const body = {
      id: values.id,
      type: 'category',
      data: {
        ...values,
        type: values.parent_id?.value ? type : 'main',
        active: values.active ? 1 : 0,
        keywords: values.keywords.join(','),
        parent_id: values.parent_id?.value,
        images: image?.map((img) => img.name),
      },
    };
    const nextUrl = 'seller/categories';
    requestModelsService
      .requestChange(body)
      .then(() => {
        toast.success(t('successfully.updated'));
        dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
        navigate(`/${nextUrl}`, { state: { tab: 'request' } });
      })
      .finally(() => setLoadingBtn(false));
  };

  const fetchCategories = () => {
    const params = { perPage: 100, type: 'main' };
    return sellerCategory.selectPaginate(params).then((res) =>
      res.data
        .filter((item) => item.id !== category?.id)
        .map((item) => ({
          label: item?.translation?.title,
          value: item?.id,
          key: item?.id,
          type: 'main',
          children: item?.children?.map((el) => ({
            label: el?.translation?.title,
            value: el?.id,
            key: el?.id,
            type: 'sub_main',
            children: el?.children?.map((three) => ({
              label: three?.translation?.title,
              value: three?.id,
              key: three?.id,
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

  const fetch = () => {
    fetchCategory();
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    fetch();
  }, [uuid, state?.parentId]);

  useDidUpdate(() => {
    if (uuid && state?.parentId && activeMenu.refetch) {
      fetch();
    }
  }, [uuid, state?.parentId, activeMenu.refetch]);

  return (
    <>
      <Card
        title={state?.parentId ? t('edit.sub.category') : t('edit.category')}
        extra={<LanguageList />}
        loading={loading}
      >
        <Form
          name='basic'
          layout='vertical'
          onFinish={onFinish}
          initialValues={{
            active: true,
            ...activeMenu.data,
          }}
          form={form}
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
    </>
  );
};
export default SellerCategoryEdit;
