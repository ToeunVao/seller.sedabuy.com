import { useEffect, useState } from 'react';
import {
  Button,
  Col,
  Form,
  Input,
  Row,
  Switch,
  message,
  Divider,
  Space,
} from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import getTranslationFields from 'helpers/getTranslationFields';
import LanguageList from 'components/language-list';
import MediaUpload from 'components/upload';
import warehouseService from 'services/warehouse';
import { RefetchSearch } from 'components/refetch-search';
import regionService from 'services/deliveryzone/region';
import countryService from 'services/deliveryzone/country';
import cityService from 'services/deliveryzone/city';
import Map from 'components/map';
import areaService from 'services/deliveryzone/area';
import AddressForm from 'components/forms/address-form';
import getDefaultLocation from 'helpers/getDefaultLocation';
import { CustomCard } from 'components/custom-card';
import getLanguageFields from 'helpers/getLanguageFields';
import useDidUpdate from 'helpers/useDidUpdate';

const EditDeliveryPoint = ({ next }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { settings } = useSelector(
    (state) => state.globalSettings,
    shallowEqual,
  );

  const [image, setImage] = useState([]);
  const [id, setId] = useState(null);
  const [loading, setLoading] = useState([]);
  const [location, setLocation] = useState(getDefaultLocation(settings));
  const [value, setValue] = useState('');
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [formData, setFormData] = useState({});
  const { country, region, city } = formData;
  const { languages, defaultLang } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );

  const getDeliveryPoint = () => {
    setLoading(true);
    warehouseService
      .get()
      .then(({ data }) => {
        const {
          city,
          country,
          region,
          area,
          location,
          address,
          img,
          translation,
          id,
          ...rest
        } = data?.[0] || {};

        const deliveryzone = {
          area: { label: area?.translation?.title, value: area?.id },
          city: { label: city?.translation?.title, value: city?.id },
          country: { label: country?.translation?.title, value: country?.id },
          region: { label: region?.translation?.title, value: region?.id },
        };

        const formData = {
          ...getLanguageFields(languages, data?.[0]),
          ...deliveryzone,
          ...rest,
          ...(languages?.reduce((result, language) => {
            result[`address[${language?.locale}]`] =
              data?.[0]?.address?.[language?.locale];
            return result;
          }, {}) || {}),
        };

        setId(id);
        form.setFieldsValue(formData);
        setFormData(deliveryzone);
        if (location)
          setLocation({
            lat: location?.latitude,
            lng: location?.longitude,
          });
        if (img) setImage([{ name: img }]);
      })
      .finally(() => setLoading(false));
  };

  const createWarehouse = (body) => {
    warehouseService
      .create(body)
      .then(({ data }) => {
        message.success(t('successfully.created'));
        const formFieldsValue = form.getFieldsValue(true);
        dispatch(
          setMenuData({
            activeMenu,
            data: { ...formFieldsValue, id: data.id },
          }),
        );
        next();
      })
      .finally(() => setLoadingBtn(false));
  };
  const updateWarehouse = (id, body) => {
    warehouseService
      .update(id, body)
      .then(() => {
        message.success(t('successfully'));
        const formFieldsValue = form.getFieldsValue(true);
        dispatch(
          setMenuData({
            activeMenu,
            data: { ...formFieldsValue, id },
          }),
        );
        next();
      })
      .finally(() => setLoadingBtn(false));
  };
  const onFinish = (values) => {
    setLoadingBtn(true);
    const { area, city, country, region, active } = values;
    const body = {
      location: {
        latitude: location?.lat,
        longitude: location?.lng,
      },
      active: active ? 1 : 0,
      area_id: area?.value,
      city_id: city?.value,
      country_id: country?.value,
      region_id: region?.value,
      images: image.map((image) => image.name),
      title: getTranslationFields(languages, values, 'title'),
      address: getTranslationFields(languages, values, 'address'),
    };

    if (id) updateWarehouse(id, body);
    else createWarehouse(body);
  };

  async function fetchRegion(search) {
    const params = {
      search,
      status: 1,
      perPage: 10,
    };
    return regionService.get(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation?.title || 'no name',
        value: item.id,
      })),
    );
  }
  async function fetchCountry(search) {
    const params = { search, status: 1, perPage: 10, region_id: region?.value };
    return countryService.get(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation?.title || 'no name',
        value: item.id,
      })),
    );
  }
  async function fetchCity(search) {
    const params = {
      search,
      status: 1,
      perPage: 10,
      country_id: country?.value,
    };
    return cityService.get(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation?.title || 'no name',
        value: item.id,
      })),
    );
  }
  async function fetchArea(search) {
    const params = {
      search,
      status: 1,
      perPage: 10,
      city_id: city?.value,
    };
    return areaService.get(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation?.title || 'no name',
        value: item.id,
      })),
    );
  }

  const fetch = () => {
    getDeliveryPoint();
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    fetch();
  }, []);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetch();
    }
  }, [activeMenu.refetch]);

  return (
    <Form
      name='add.delivery.point'
      layout='vertical'
      onFinish={onFinish}
      form={form}
      initialValues={{ clickable: true, ...activeMenu.data }}
    >
      <Row gutter={[24, 24]}>
        <Col span={12}>
          <CustomCard
            title={t('delivery.zone')}
            className='h-100'
            loading={loading}
          >
            <Col span={24}>
              <Form.Item
                label={t('region')}
                name='region'
                rules={[{ required: true, message: t('required') }]}
              >
                <RefetchSearch
                  fetchOptions={fetchRegion}
                  dropdownRender={(menu) => <>{menu}</>}
                  refetch={true}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, region: value }));
                    form.resetFields(['city', 'area', 'country']);
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label={t('country')}
                name='country'
                rules={[{ required: true, message: t('required') }]}
              >
                <RefetchSearch
                  fetchOptions={fetchCountry}
                  dropdownRender={(menu) => <>{menu}</>}
                  refetch={true}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, country: value }));
                    form.resetFields(['city', 'area']);
                  }}
                  disabled={!Boolean(region?.value)}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label={t('city')}
                name='city'
                rules={[{ required: false, message: t('required') }]}
              >
                <RefetchSearch
                  fetchOptions={fetchCity}
                  dropdownRender={(menu) => <>{menu}</>}
                  refetch={true}
                  disabled={!Boolean(country?.value)}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, city: value }));
                    form.resetFields(['area']);
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label={t('area')}
                name='area'
                rules={[{ required: false, message: t('required') }]}
              >
                <RefetchSearch
                  fetchOptions={fetchArea}
                  dropdownRender={(menu) => <>{menu}</>}
                  refetch={true}
                  disabled={!Boolean(city?.value)}
                />
              </Form.Item>
            </Col>
          </CustomCard>
        </Col>
        <Col span={12}>
          <CustomCard title={t('media')} className='h-100' loading={loading}>
            <Col span={24}>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    rules={[
                      {
                        required: false,
                        message: t('required'),
                      },
                    ]}
                    label={t('image')}
                    name='images'
                  >
                    <MediaUpload
                      type='products'
                      imageList={image}
                      setImageList={setImage}
                      form={form}
                      length='1'
                      multiple={false}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('active')}
                    name='active'
                    valuePropName='checked'
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </CustomCard>
        </Col>
        <Col span={24}>
          <CustomCard
            title={t('address')}
            loading={loading}
            extra={<LanguageList />}
          >
            <Row gutter={12}>
              <Col span={12}>
                <AddressForm
                  setLocation={setLocation}
                  value={value}
                  setValue={setValue}
                />
              </Col>
              <Col span={12}>
                {languages.map((item, idx) => (
                  <Form.Item
                    key={'title' + idx}
                    label={t('title')}
                    name={`title[${item.locale}]`}
                    rules={[
                      {
                        required: item.locale === defaultLang,
                        message: t('required'),
                      },
                    ]}
                    hidden={item.locale !== defaultLang}
                  >
                    <Input />
                  </Form.Item>
                ))}
              </Col>
              <Col span={24}>
                <Map
                  location={location}
                  setLocation={setLocation}
                  setAddress={(value) =>
                    form.setFieldsValue({
                      [`address[${defaultLang}]`]: value,
                    })
                  }
                />
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
};

export default EditDeliveryPoint;
