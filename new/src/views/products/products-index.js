import { useEffect, useState } from 'react';
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Switch,
} from 'antd';
import { DebounceSelect } from 'components/search';
import shopService from 'services/restaurant';
import brandService from 'services/brand';
import categoryService from 'services/category';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import productService from 'services/product';
import { addMenu, replaceMenu, setMenuData } from 'redux/slices/menu';
import unitService from 'services/unit';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MediaUpload from 'components/upload';
import TextArea from 'antd/lib/input/TextArea';
import { RefetchSearch } from 'components/refetch-search';
import { PlusOutlined } from '@ant-design/icons';
import { AsyncTreeSelect } from 'components/async-tree-select-category';
import VideoUploaderWithModal from 'components/video-uploader';
import { CustomCard } from 'components/custom-card';
import getTranslationFields from 'helpers/getTranslationFields';

const ProductsIndex = ({ next, action_type = '', isRequest }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { uuid } = useParams();
  const [form] = Form.useForm();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );

  const [mediaList, setMediaList] = useState(
    activeMenu?.data?.initialMediaFile || { images: [], previews: [] },
  );
  const [fileList, setFileList] = useState(
    activeMenu.data?.images?.filter((item) => !item.isVideo) || [],
  );
  const [loadingBtn, setLoadingBtn] = useState(false);

  useEffect(() => {
    const data = form.getFieldsValue(true);
    dispatch(
      setMenuData({ activeMenu, data: { ...activeMenu.data, ...data } }),
    );
  }, []);

  const fetchShops = (search) => {
    const params = {
      search: search || undefined,
      active: 1,
      status: 'approved',
    };
    return shopService.get(params).then((res) =>
      res.data.map((item) => ({
        label: item?.translation?.title || t('N/A'),
        value: item?.id,
        key: item?.id,
      })),
    );
  };

  const fetchBrands = (search) => {
    const params = {
      perPage: 10,
      type: 'main',
      search: search || undefined,
      active: 1,
    };
    return brandService.getAll(params).then((res) =>
      res.data.map((item) => ({
        label: item?.title,
        value: item?.id,
        key: item?.id,
      })),
    );
  };

  const fetchCategories = (search) => {
    const params = { perPage: 100, type: 'main', search: search || undefined };
    return categoryService.getAll(params).then((res) =>
      res.data.map((item) => ({
        label: item?.translation?.title,
        value: item?.id,
        key: item?.id,
        type: 'main',
        disabled: item?.children?.length,
        children: item?.children?.map((el) => ({
          label: el?.translation?.title,
          value: el?.id,
          key: el?.id,
          type: 'sub_main',
          disabled: el?.children?.length,
          children: el?.children?.map((three) => ({
            label: three?.translation?.title,
            value: three?.id,
            key: three?.id,
            type: 'child',
          })),
        })),
      })),
    );
  };

  const fetchUnits = (search) => {
    const params = {
      perPage: 10,
      page: 1,
      active: 1,
      search: search || undefined,
    };
    return unitService.getAll(params).then((res) =>
      res?.data?.map((item) => ({
        label: item?.translation?.title,
        value: item?.id,
        key: item?.id,
      })),
    );
  };

  const createMediaFile = (items) => {
    const mediaObject = { images: [], previews: [] };
    const previews = items
      ?.filter((item) => item?.preview)
      .map((item) => ({
        uid: item?.id,
        name: item?.preview,
        url: item?.preview,
      }));
    const videos = items
      ?.filter((item) => item?.preview)
      .map((item) => ({
        uid: item?.id,
        name: item?.path,
        url: item?.path,
        isVideo: true,
      }));
    mediaObject.previews = previews;
    mediaObject.images = videos;

    return mediaObject;
  };

  const onFinish = (values) => {
    setLoadingBtn(true);
    const body = {
      // basic
      title: getTranslationFields(languages, values, 'title'),
      description: getTranslationFields(languages, values, 'description'),
      // price information
      min_qty: values?.min_qty || 0,
      max_qty: values?.max_qty || 0,
      interval: values?.interval || 1,
      tax: values?.tax || 0,
      // additional information
      age_limit: values?.age_limit || 0,
      active: values?.active ? 1 : 0,
      digital: values?.digital ? 1 : 0,
      // organization information
      shop_id: values?.shop?.value,
      category_id: values?.category?.value,
      brand_id: values?.brand?.value,
      unit_id: values?.unit?.value,
      // media
      images: [...(mediaList?.images || []), ...(fileList || [])].map(
        (item) => item?.name,
      ),
      previews: mediaList?.previews?.length
        ? mediaList?.previews?.map((item) => item?.name)
        : undefined,
    };

    if (isRequest) {
      dispatch(
        setMenuData({
          activeMenu,
          data: {
            ...activeMenu.data,
            ...body,
            images: fileList,
            brand: values.brand,
            category: values.category,
            shop: values.shop,
            unit: values.unit,
            tax: values.tax || 0,
            title: {
              ...Object.assign(
                {},
                ...languages.map((lang) => ({
                  [lang.locale]: values[`title[${lang.locale}]`],
                })),
              ),
            },
            description: {
              ...Object.assign(
                {},
                ...languages.map((lang) => ({
                  [lang.locale]: values[`description[${lang.locale}]`],
                })),
              ),
            },
          },
        }),
      );
      next();
      return;
    }

    if (action_type === 'edit') {
      productUpdate(values, body);
    } else {
      productCreate(values, body);
    }
  };

  const productCreate = (values, body) => {
    productService
      .create(body)
      .then((res) => {
        dispatch(
          replaceMenu({
            id: `product-${res?.data?.uuid}`,
            url: `product/${res?.data?.uuid}`,
            name: t('add.product'),
            data: {
              ...values,
              ...(res?.data || {}),
              initialMediaFile: createMediaFile(res?.data?.galleries),
            },
            refetch: false,
          }),
        );
        navigate(`/product/${res?.data?.uuid}/?step=1`);
      })
      .finally(() => setLoadingBtn(false));
  };

  const productUpdate = (values, params) => {
    productService
      .update(uuid, params)
      .then(() => {
        dispatch(
          setMenuData({
            activeMenu,
            data: {
              ...values,
              ...activeMenu?.data,
              digital: Boolean(params?.digital),
            },
          }),
        );
        next();
      })
      .finally(() => setLoadingBtn(false));
  };

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      dispatch(
        setMenuData({ activeMenu, data: { ...activeMenu.data, ...data } }),
      );
    };
  }, []);

  const goToAddCategory = () => {
    dispatch(
      addMenu({
        id: 'category-add',
        url: 'category/add',
        name: t('add.category'),
      }),
    );
    navigate('/category/add');
  };

  return (
    <Form
      layout='vertical'
      form={form}
      initialValues={{
        active: true,
        vegetarian: true,
        min_qty: 1,
        max_qty: 1,
        tax: 0,
        interval: 1,
        age_limit: 12,
        digital: false,
        ...activeMenu.data,
      }}
      onFinish={onFinish}
    >
      <Row gutter={20}>
        <Col flex='1'>
          <Row gutter={12}>
            <Col span={24} className='mb-4'>
              <CustomCard title={t('basic')}>
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
              </CustomCard>
            </Col>
            <Col span={24} className='mb-4'>
              <CustomCard title={t('price.information')}>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      label={t('min.qty')}
                      name='min_qty'
                      tooltip={t('minimum.quantity.user.can.order')}
                      rules={[{ required: true, message: t('required') }]}
                    >
                      <InputNumber min={1} className='w-100' />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={t('max.qty')}
                      name='max_qty'
                      tooltip={t('maximum.quantity.user.can.order')}
                      rules={[{ required: true, message: t('required') }]}
                    >
                      <InputNumber min={1} className='w-100' />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={t('interval.unit')}
                      name='interval'
                      tooltip={t(
                        'If you set 100g, every “+” adds another 100g to the cart.',
                      )}
                      rules={[
                        { required: true, message: t('required') },
                        {
                          type: 'number',
                          min: 0,
                          message: t('must.be.positive'),
                        },
                      ]}
                    >
                      <InputNumber className='w-100' />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={t('tax')}
                      name='tax'
                      rules={[
                        {
                          validator(_, value) {
                            if (value && (value < 0 || value > 100)) {
                              return Promise.reject(
                                new Error(t('must.be.between.0.and.100')),
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <InputNumber className='w-100' addonAfter='%' />
                    </Form.Item>
                  </Col>
                </Row>
              </CustomCard>
            </Col>
            <Col span={24} className='mb-4'>
              <CustomCard title={t('additional.information')}>
                <Row gutter={12} style={{ marginBottom: 52 }}>
                  <Col span={8}>
                    <Form.Item
                      label={t('age.limit')}
                      name='age_limit'
                      rules={[{ required: true, message: t('required') }]}
                    >
                      <InputNumber min={0} className='w-100' />
                    </Form.Item>
                  </Col>
                  <Col flex='1'>
                    <Form.Item
                      label={t('active')}
                      name='active'
                      valuePropName='checked'
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col flex='1'>
                    <Form.Item
                      label={t('digital')}
                      name='digital'
                      valuePropName='checked'
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              </CustomCard>
            </Col>
          </Row>
        </Col>
        <Col span={10}>
          <Row gutter={12}>
            <Col span={24} className='mb-4'>
              <CustomCard title={t('product.information')}>
                <Row gutter={12}>
                  {!isRequest && (
                    <Col span={24}>
                      <Form.Item
                        label={t('shop')}
                        name='shop'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <RefetchSearch
                          fetchOptions={fetchShops}
                          onChange={() =>
                            form.setFieldsValue({ category: undefined })
                          }
                        />
                      </Form.Item>
                    </Col>
                  )}
                  <Col span={24}>
                    <Form.Item
                      label={t('category')}
                      name='category'
                      rules={[{ required: true, message: t('required') }]}
                    >
                      <AsyncTreeSelect
                        refetch
                        fetchOptions={fetchCategories}
                        dropdownRender={(menu) => (
                          <>
                            {menu}
                            <div className='p-1'>
                              <Button
                                icon={<PlusOutlined />}
                                className='w-100'
                                onClick={goToAddCategory}
                              >
                                {t('add.category')}
                              </Button>
                            </div>
                          </>
                        )}
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label={t('brand')} name='brand'>
                      <DebounceSelect fetchOptions={fetchBrands} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      label={t('unit')}
                      name='unit'
                      rules={[{ required: true, message: t('required') }]}
                    >
                      <DebounceSelect fetchOptions={fetchUnits} />
                    </Form.Item>
                  </Col>
                </Row>
              </CustomCard>
            </Col>
            <Col span={24}>
              <CustomCard title={t('product.images.&.video')}>
                <Col span={24}>
                  <Form.Item
                    name='images'
                    rules={[
                      {
                        required: !fileList?.length,
                        message: t('required'),
                      },
                    ]}
                  >
                    <MediaUpload
                      type='products'
                      imageList={fileList}
                      setImageList={setFileList}
                      form={form}
                      multiple
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <VideoUploaderWithModal
                    form={form}
                    mediaList={mediaList}
                    setMediaList={setMediaList}
                  />
                </Col>
              </CustomCard>
            </Col>
          </Row>
        </Col>
      </Row>
      <Divider />
      <Space className='w-100 justify-content-end'>
        <Button type='primary' htmlType='submit' loading={loadingBtn}>
          {t('next')}
        </Button>
      </Space>
    </Form>
  );
};

export default ProductsIndex;
