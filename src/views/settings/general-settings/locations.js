import { Button, Col, Divider, Form, Input, Row, Select, Space } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { shallowEqual, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Map from 'components/map';
import settingService from 'services/settings';
import { fetchSettings as getSettings } from 'redux/slices/globalSettings';
import useDemo from 'helpers/useDemo';
import getAddress from 'helpers/getAddress';
import useGoogle from 'react-google-autocomplete/lib/usePlacesAutocompleteService';
import { MAP_API_KEY } from 'configs/app-global';
import { CustomCard } from 'components/custom-card';

const Locations = ({ location, setLocation }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const dispatch = useDispatch();
  const [loadingBtn, setLoadingBtn] = useState(false);
  const { isDemo } = useDemo();
  const [value, setValue] = useState('');
  const { placePredictions, getPlacePredictions, isPlacePredictionsLoading } =
    useGoogle({
      apiKey: MAP_API_KEY,
      libraries: ['places', 'geocode'],
    });

  const updateSettings = (data) => {
    setLoadingBtn(true);
    settingService
      .update(data)
      .then(() => {
        toast.success(t('successfully.updated'));
        dispatch(getSettings());
      })
      .finally(() => setLoadingBtn(false));
  };

  const onFinish = (values) => {
    const body = {
      ...values,
      location: `${location.lat}, ${location.lng}`,
    };
    updateSettings(body);
  };

  return (
    <Form
      layout='vertical'
      form={form}
      name='global-settings'
      onFinish={onFinish}
      initialValues={{
        ...activeMenu.data,
      }}
    >
      <CustomCard title={t('location')}>
        <Row>
          <Col span={24}>
            <Form.Item
              label={t('google.map.key')}
              name='google_map_key'
              rules={[
                {
                  required: true,
                  message: t('required'),
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              key={'address'}
              label={t('address')}
              name={`address`}
              rules={[
                {
                  required: true,
                  message: t('required'),
                },
              ]}
            >
              <Select
                allowClear
                searchValue={value}
                showSearch
                autoClearSearchValue
                loading={isPlacePredictionsLoading}
                options={placePredictions?.map((prediction) => ({
                  label: prediction.description,
                  value: prediction.description,
                }))}
                onSearch={(searchValue) => {
                  setValue(searchValue);
                  if (searchValue.length > 0) {
                    getPlacePredictions({ input: searchValue });
                  }
                }}
                onSelect={async (value) => {
                  const address = await getAddress(value);
                  setLocation({
                    lat: address?.geometry.location.lat,
                    lng: address?.geometry.location.lng,
                  });
                }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label={t('map')}
              name='location'
              style={{ borderRadius: '50px' }}
            >
              <Map
                location={location}
                setLocation={setLocation}
                setAddress={(value) => form.setFieldsValue({ address: value })}
              />
            </Form.Item>
          </Col>
        </Row>
        <Divider />
        <Space className='w-100 justify-content-end'>
          <Button
            type='primary'
            onClick={() => form.submit()}
            loading={loadingBtn}
            disabled={isDemo}
          >
            {t('save')}
          </Button>
        </Space>
      </CustomCard>
    </Form>
  );
};

export default Locations;
