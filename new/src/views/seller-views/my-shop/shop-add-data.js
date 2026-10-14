import { useMemo, useState } from 'react';
import { Col, Form, Input, InputNumber, Row, Select, Space, Tag } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { shallowEqual, useSelector } from 'react-redux';
import Map from 'components/map';
import { useTranslation } from 'react-i18next';
import MediaUpload from 'components/upload';
import shopTagService from 'services/shopTag';
import { ShopTypes } from 'constants/shop-types';
import { deliveryTimeTypes } from './delivery-time-types';
import { SHOP_EMAIL_STATUSES } from 'constants/index';
import { useParams } from 'react-router-dom';
import { FileOutlined } from '@ant-design/icons';
import { CustomCard } from 'components/custom-card';
import { RefetchSearch } from 'components/refetch-search';
import AddressForm from 'components/forms/address-form';

const ShopAddData = ({
  logoImage,
  setLogoImage,
  backImage,
  setBackImage,
  form,
  location,
  setLocation,
}) => {
  const { t } = useTranslation();
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { uuid } = useParams();

  const [value, setValue] = useState('');

  const status = Form.useWatch('status', form);
  const sellerDocuments = activeMenu?.data?.documents || [];

  const emailStatusOptions = useMemo(
    () =>
      SHOP_EMAIL_STATUSES.map((item) => ({
        label: t(item),
        value: item,
        key: item,
      })),
    [uuid],
  );

  async function fetchShopTag(search) {
    const params = { search };
    return shopTagService.getAllSeller(params).then(({ data }) =>
      data.map((item) => ({
        label: item?.translation?.title || 'no name',
        value: item?.id,
        key: item?.id,
      })),
    );
  }

  return (
    <Row gutter={12}>
      <Col span={24} className='mb-4'>
        <Row gutter={20}>
          <Col span={12}>
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
          <Col span={12}>
            <CustomCard title={t('shop.logo.&.cover')}>
              <Row gutter={12} style={{ marginBottom: 42 }}>
                <Col>
                  <Form.Item
                    label={`${t('logo')} (1:1)`}
                    name='logo_img'
                    rules={[
                      {
                        required: !logoImage?.length,
                        message: t('required'),
                      },
                    ]}
                  >
                    <MediaUpload
                      type='shops/logo'
                      imageList={logoImage}
                      setImageList={setLogoImage}
                      form={form}
                      multiple={false}
                      name='logo_img'
                    />
                  </Form.Item>
                </Col>
                <Col>
                  <Form.Item
                    label={`${t('cover')} (2:1)`}
                    name='background_img'
                    rules={[
                      {
                        required: !backImage?.length,
                        message: t('required'),
                      },
                    ]}
                  >
                    <MediaUpload
                      type='shops/background'
                      imageList={backImage}
                      setImageList={setBackImage}
                      form={form}
                      multiple={false}
                      name='background_img'
                      wider
                    />
                  </Form.Item>
                </Col>
              </Row>
            </CustomCard>
          </Col>
        </Row>
      </Col>
      <Col span={24} className='mb-4'>
        <CustomCard title={t('shop.information')}>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item
                label={t('phone')}
                name='phone'
                rules={[
                  { required: true, message: t('required') },
                  {
                    type: 'number',
                    max: 99999999999999999999,
                    message: t('max.length.20'),
                  },
                ]}
              >
                <InputNumber min={0} className='w-100' />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={t('shop.tags')}
                name='tags'
                rules={[{ required: true, message: t('required') }]}
              >
                <RefetchSearch mode='multiple' fetchOptions={fetchShopTag} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={t('shop.type')}
                name='delivery_type'
                tooltip={t(
                  'IN_HOUSE delivered by admin, SELLER delivered by seller',
                )}
                rules={[{ required: true, message: t('required') }]}
              >
                <Select options={ShopTypes} />
              </Form.Item>
            </Col>
          </Row>
          {Boolean(sellerDocuments?.length) && (
            <Col span={8}>
              <Form.Item label={t('uploaded.documents.for.verification')}>
                <Space gap='4px 0' wrap>
                  {sellerDocuments?.map((item) => (
                    <a
                      href={item?.path}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <Tag icon={<FileOutlined />}>{item?.title}</Tag>
                    </a>
                  ))}
                </Space>
              </Form.Item>
            </Col>
          )}
          {status === 'rejected' && (
            <Col span={8}>
              <Form.Item label={t('status.note')} name='status_note'>
                <TextArea rows={1} maxLength={100} />
              </Form.Item>
            </Col>
          )}
        </CustomCard>
      </Col>
      <Col span={24} className='mb-4'>
        <Row gutter={20}>
          <Col span={12}>
            <CustomCard title={t('delivery.information')}>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    name='delivery_time_type'
                    label={t('delivery_time_type')}
                    rules={[{ required: true, message: t('required') }]}
                  >
                    <Select
                      className='w-100'
                      options={deliveryTimeTypes.map((deliveryTimeType) => ({
                        label: t(deliveryTimeType.label),
                        value: deliveryTimeType.value,
                        key: deliveryTimeType.key,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name='delivery_time_from'
                    label={t('delivery_time_from')}
                    rules={[
                      { required: true, message: t('required') },
                      {
                        type: 'number',
                        max: 9999999999,
                        message: t('max.length.10'),
                      },
                    ]}
                  >
                    <InputNumber min={0} className='w-100' />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name='delivery_time_to'
                    label={t('delivery_time_to')}
                    rules={[
                      { required: true, message: t('required') },
                      {
                        type: 'number',
                        max: 9999999999,
                        message: t('max.length.10'),
                      },
                    ]}
                  >
                    <InputNumber min={0} className='w-100' />
                  </Form.Item>
                </Col>
              </Row>
            </CustomCard>
          </Col>
          <Col span={12}>
            <CustomCard title={t('order.information')}>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label={t('tax')}
                    name='tax'
                    rules={[{ required: true, message: t('required') }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      addonAfter={'%'}
                      className='w-100'
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name='emailStatuses' label={t('email.statuses')}>
                    <Select
                      mode='multiple'
                      labelInValue
                      options={emailStatusOptions}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </CustomCard>
          </Col>
        </Row>
      </Col>
      <Col span={24} className='mb-4'>
        <CustomCard title={t('address.information')}>
          <Row gutter={12}>
            <Col span={24}>
              <AddressForm
                value={value}
                setValue={setValue}
                setLocation={setLocation}
              />
            </Col>
            <Col span={24}>
              <Map
                location={location}
                setLocation={setLocation}
                setAddress={(value) =>
                  form.setFieldsValue({ [`address[${defaultLang}]`]: value })
                }
              />
            </Col>
          </Row>
        </CustomCard>
      </Col>
    </Row>
  );
};

export default ShopAddData;
