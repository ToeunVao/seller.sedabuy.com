import { useState } from 'react';
import { Button, Col, Divider, Form, Input, Row, Select, Space } from 'antd';
import MediaUpload from 'components/upload';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';
import productService from 'services/product';
import VideoUploaderWithModal from 'components/video-uploader';
import { CustomCard } from 'components/custom-card';
import TextArea from 'antd/es/input/TextArea';
import { InfiniteSelect } from 'components/infinite-select';
import shopService from 'services/shop';
import getTranslationFields from 'helpers/getTranslationFields';

const bannerTypes = ['shop', 'product'];
const bannerZones = ['banner', 'second_banner'];

export default function BannerForm({ form, handleSubmit }) {
  const { t } = useTranslation();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { languages, defaultLang } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );

  const selectedBannerType = Form.useWatch('banner_type', form);

  //states
  const [image, setImage] = useState(
    activeMenu.data?.img.filter((item) => !item.isVideo) || [],
  );
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [mediaList, setMediaList] = useState(
    activeMenu?.data?.initialMediaFile || { images: [], previews: [] },
  );

  //functions
  const fetchProducts = ({ search, page }) => {
    const params = {
      search: search || undefined,
      page,
      perPage: 10,
      status: 'published',
    };
    return productService.getAll(params).then((res) =>
      res?.data?.map((item) => ({
        label: item?.translation?.title || t('N/A'),
        value: item?.id,
        key: item?.id,
      })),
    );
  };

  const fetchShops = ({ search, page }) => {
    const params = {
      status: 'approved',
      search: search || undefined,
      page,
      perPage: 10,
    };
    return shopService.getAll(params).then((res) =>
      res?.data?.map((item) => ({
        label: item?.translation?.title || t('N/A'),
        value: item?.id,
        key: item?.id,
      })),
    );
  };

  //submit form
  const onFinish = (values) => {
    setLoadingBtn(true);
    const videos = mediaList.images.map((item) => item.name);
    const previews = mediaList.previews.map((item) => item.name);
    const body = {
      products:
        values?.banner_type === 'product'
          ? values.products?.map((i) => i.value)
          : [],
      shops:
        values?.banner_type === 'shop'
          ? values?.shops?.map((i) => i.value)
          : [],
      images: [...videos, ...image.map((image) => image.name)],
      previews,
      clickable: true,
      title: getTranslationFields(languages, values, 'title'),
      description: getTranslationFields(languages, values, 'description'),
      type: values.type,
      is_shop: values?.banner_type === 'shop',
    };
    handleSubmit(body).finally(() => setLoadingBtn(false));
  };
  return (
    <Form
      name='banner-form'
      layout='vertical'
      onFinish={onFinish}
      form={form}
      initialValues={{
        clickable: true,
        banner_type: bannerTypes[0],
        type: bannerZones[0],
        ...activeMenu.data,
      }}
      className='d-flex flex-column h-100'
    >
      <Row gutter={12}>
        <Col span={14}>
          <CustomCard title={t('basic.information')}>
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
                        // required: item?.locale === defaultLang,
                        required: false,
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
                        // required: item?.locale === defaultLang,
                        required: false,
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
                    <TextArea rows={1} maxLength={150} />
                  </Form.Item>
                ))}
              </Col>
              <Col span={24}>
                <Form.Item
                  label={t('banner.position')}
                  name='type'
                  rules={[{ required: true, message: t('required') }]}
                >
                  <Select
                    options={bannerZones.map((bannerZone) => ({
                      label: t(bannerZone),
                      value: bannerZone,
                      key: bannerZone,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t('banner.type')}
                  name='banner_type'
                  rules={[{ required: true, message: t('required') }]}
                >
                  <Select
                    options={bannerTypes.map((bannerType) => ({
                      label: t(bannerType),
                      value: bannerType,
                      key: bannerType,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                {selectedBannerType === 'product' ? (
                  <Form.Item
                    label={t('product')}
                    name='products'
                    rules={[{ required: true, message: t('required') }]}
                  >
                    <InfiniteSelect
                      mode='multiple'
                      fetchOptions={fetchProducts}
                    />
                  </Form.Item>
                ) : (
                  <Form.Item
                    label={t('shops')}
                    name='shops'
                    rules={[{ required: true, message: t('required') }]}
                  >
                    <InfiniteSelect mode='multiple' fetchOptions={fetchShops} />
                  </Form.Item>
                )}
              </Col>
            </Row>
          </CustomCard>
        </Col>
        <Col flex={1}>
          <CustomCard title={t('media')}>
            <Row gutter={12}>
              <Col span={24}>
                <Form.Item
                  rules={[
                    {
                      required: !image?.length,
                      message: t('required'),
                    },
                  ]}
                  label={t('image')}
                  name='images'
                >
                  <MediaUpload
                    type='banners'
                    imageList={image}
                    setImageList={setImage}
                    form={form}
                    length='1'
                    multiple={false}
                  />
                </Form.Item>
              </Col>
              <div style={{ width: '100%', height: '25px' }} />
              <Col span={24}>
                <Form.Item label={t('video')}>
                  <VideoUploaderWithModal
                    name='banners'
                    form={form}
                    mediaList={mediaList}
                    setMediaList={setMediaList}
                  />
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
  );
}
