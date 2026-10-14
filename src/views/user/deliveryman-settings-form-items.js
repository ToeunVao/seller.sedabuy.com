import { Col, Form, Input, Row, Select, Switch } from 'antd';
import { DebounceSelect } from 'components/search';
import MediaUpload from 'components/upload';
import Map from 'components/map';
import { useTranslation } from 'react-i18next';
import countryService from 'services/deliveryzone/country';
import cityService from 'services/deliveryzone/city';

const type_of_technique = [
  { label: 'Benzine', value: 'benzine' },
  { label: 'Diesel', value: 'diesel' },
  { label: 'Gas', value: 'gas' },
  { label: 'Motorbike', value: 'motorbike' },
  { label: 'Bike', value: 'bike' },
  { label: 'Foot', value: 'foot' },
  { label: 'Electric', value: 'electric' },
];

export const DeliverymanSettingsFormItems = ({
  form,
  image,
  location,
  setLocation,
  setAddress,
  setImage,
}) => {
  const { t } = useTranslation();
  const selectedTypeOfTechnique = Form.useWatch('type_of_technique', form);
  const country = Form.useWatch('country', form);
  const fetchCountries = (search) => {
    const params = {
      search: search || undefined,
      perPage: 10,
      page: 1,
      has_price: 1,
    };

    return countryService.get(params).then(({ data }) =>
      data?.flatMap((item) => ({
        label: item?.translation?.title,
        value: item?.id,
        key: item?.region_id,
      })),
    );
  };

  const fetchCities = (search) => {
    const params = {
      search: search || undefined,
      perPage: 10,
      page: 1,
      country_id: country?.value,
      has_price: 1,
    };

    return cityService.get(params).then(({ data }) =>
      data?.flatMap((item) => ({
        label: item?.translation?.title,
        value: item?.id,
        key: item?.id,
      })),
    );
  };
  return (
    <Row gutter={12} className='w-100'>
      <Col span={12}>
        <Form.Item
          label={t('type.of.technique')}
          name='type_of_technique'
          rules={[
            {
              required: true,
              message: t('required'),
            },
          ]}
        >
          <Select options={type_of_technique} />
        </Form.Item>
      </Col>
      {selectedTypeOfTechnique !== 'foot' &&
        selectedTypeOfTechnique !== 'bike' && (
          <>
            <Col span={12}>
              <Form.Item
                label={t('brand')}
                name='brand'
                // rules={[
                //   {
                //     required: true,
                //     message: t('required'),
                //   },
                // ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('model')}
                name='model'
                // rules={[
                //   {
                //     required: true,
                //     message: t('required'),
                //   },
                // ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('car.number')}
                name='number'
                // rules={[
                //   {
                //     required: true,
                //     message: t('required'),
                //   },
                // ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('car.color')}
                name='color'
                // rules={[
                //   {
                //     required: true,
                //     message: t('required'),
                //   },
                // ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </>
        )}
      <Col span={12}>
        <Form.Item
          name='country'
          label={t('country')}
          rules={[
            {
              required: true,
              message: t('required'),
            },
          ]}
        >
          <DebounceSelect
            fetchOptions={fetchCountries}
            placeholder={t('select.country')}
            onChange={() => {
              form.setFieldsValue({ city: [] });
            }}
            autoComplete='none'
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name='city' label={t('city')}>
          <DebounceSelect
            fetchOptions={fetchCities}
            placeholder={t('select.city')}
            refetchOptions={true}
            disabled={!country}
            autoComplete='none'
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label={t('image')} name='images'>
          <MediaUpload
            type='deliveryman/settings'
            imageList={image}
            setImageList={setImage}
            form={form}
            length='1'
            multiple
          />
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item label={t('online')} name='online' valuePropName='checked'>
          <Switch />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label={t('map')} name='location'>
          <Map
            location={location}
            setLocation={setLocation}
            setAddress={setAddress}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};
