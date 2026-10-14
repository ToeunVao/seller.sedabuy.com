import { Button, Col, Form } from 'antd';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import deliveryService from 'services/delivery';
import Loading from 'components/loading';
import { shallowEqual, useSelector } from 'react-redux';
import getDefaultLocation from 'helpers/getDefaultLocation';
import { toast } from 'react-toastify';
import { DeliverymanSettingsFormItems } from './deliveryman-settings-form-items';

const DeliverymanSettings = ({ id, data }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const { settings } = useSelector(
    (state) => state.globalSettings,
    shallowEqual,
  );

  const [loadingBtn, setLoadingBtn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState([]);
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(getDefaultLocation(settings));

  const createImages = (items) =>
    items.map((item) => ({
      uid: item.id,
      name: item.path,
      url: item.path,
    }));

  const fetchDeliverySettings = (id) => {
    setLoading(true);
    deliveryService
      .getById(id)
      .then((res) => {
        const responseData = {
          ...(res?.data || {}),
          country: {
            label: res?.data?.country?.translation?.title,
            value: res?.data?.country?.id,
            key: res?.data?.country?.region_id,
          },
          city: {
            label: res?.data?.city?.translation?.title,
            value: res?.data?.city?.id,
          },
          user_id: {
            label: `${res?.data?.deliveryman?.firstname || ''} ${
              res?.data?.deliveryman?.lastname || ''
            }`,
            value: res?.data?.deliveryman?.id,
            images: createImages(res?.data?.galleries),
            location: {
              lat: res?.data?.location?.latitude,
              lng: res?.data?.location?.longitude,
            },
          },
        };
        setLocation(responseData?.user_id?.location);
        setImage(createImages(res?.data?.galleries));
        form.setFieldsValue(responseData);
      })
      .finally(() => setLoading(false));
  };

  const onFinish = (values) => {
    // if (!address?.includes(values?.country?.label)) {
    //   toast.warn(t('please.choose.current.location'));
    //   return;
    // }
    // if (values.city && !address.includes(values.city?.label)) {
    //   toast.warn(t('please.choose.current.location'));
    //   return;
    // }
    setLoadingBtn(true);
    const params = {
      ...values,
      user_id: data?.id,
      images: image[0]?.name ? [image[0]?.name] : undefined,
      country_id: values?.country?.value,
      city_id: values?.city?.value,
      region_id: values?.country?.key,
      location: {
        latitude: location?.lat,
        longitude: location?.lng,
      },
      online: Boolean(values?.online),
    };
    deliveryService
      .update(id, params)
      .then(() => toast.success(t('successfully.updated')))
      .finally(() => setLoadingBtn(false));
  };

  useEffect(() => {
    if (id) {
      fetchDeliverySettings(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <Form
      name='basic'
      layout='vertical'
      className='w-100'
      onFinish={onFinish}
      form={form}
    >
      {loading ? (
        <Loading />
      ) : (
        <DeliverymanSettingsFormItems
          form={form}
          image={image}
          location={location}
          setImage={setImage}
          setLocation={setLocation}
          setAddress={setAddress}
        />
      )}
      <Col span={24}>
        <Button type='primary' htmlType='submit' loading={loadingBtn}>
          {t('save')}
        </Button>
      </Col>
    </Form>
  );
};

export default DeliverymanSettings;
