import { useEffect, useState } from 'react';
import { Button, Divider, Form, Space } from 'antd';
import ShopAddData from './shop-add-data';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { setMenuData } from 'redux/slices/menu';
import shopService from 'services/seller/shop';
import { useTranslation } from 'react-i18next';
import getDefaultLocation from 'helpers/getDefaultLocation';
import { fetchMyShop } from 'redux/slices/myShop';
import { ShopTypes } from 'constants/shop-types';
import getTranslationFields from 'helpers/getTranslationFields';

const ShopMain = ({ next }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { settings } = useSelector(
    (state) => state.globalSettings,
    shallowEqual,
  );
  const { languages } = useSelector((state) => state.formLang, shallowEqual);

  const [location, setLocation] = useState(
    activeMenu?.data?.location
      ? {
          lat: parseFloat(activeMenu?.data?.location?.latitude),
          lng: parseFloat(activeMenu?.data?.location?.longitude),
        }
      : getDefaultLocation(settings),
  );
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [logoImage, setLogoImage] = useState(
    activeMenu.data?.logo_img ? [activeMenu.data?.logo_img] : [],
  );
  const [backImage, setBackImage] = useState(
    activeMenu.data?.background_img ? [activeMenu.data?.background_img] : [],
  );

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      data.open_time = JSON.stringify(data?.open_time);
      data.close_time = JSON.stringify(data?.close_time);
      dispatch(
        setMenuData({ activeMenu, data: { ...activeMenu.data, ...data } }),
      );
    };
  }, []);

  const onFinish = (values) => {
    setLoadingBtn(true);
    const body = {
      images: [logoImage?.[0]?.name, backImage?.[0]?.name],
      status: values?.status,
      // open: values?.open,
      title: getTranslationFields(languages, values, 'title'),
      description: getTranslationFields(languages, values, 'description'),
      address: getTranslationFields(languages, values, 'address', true),
      phone: String(values?.phone),
      tags: values?.tags?.map((tag) => tag?.value),
      delivery_type: values?.delivery_type?.value || values?.delivery_type, // shop type
      user_id: values?.user?.value,
      delivery_time_type:
        values?.delivery_time_type?.value || values?.delivery_time_type,
      delivery_time_from: values?.delivery_time_from || 0,
      delivery_time_to: values?.delivery_time_to || 0,
      tax: values?.tax || 0,
      percentage: values?.percentage || 0,
      email_statuses: values?.emailStatuses?.length
        ? values?.emailStatuses?.map((emailStatus) => emailStatus?.value)
        : undefined,
      lat_long: [location?.lat, location?.lng],
    };
    shopUpdate(values, body);
  };

  const shopUpdate = (values, params) => {
    shopService
      .update(params)
      .then(() => {
        batch(() => {
          dispatch(
            setMenuData({
              activeMenu,
              data: values,
            }),
          );
          dispatch(fetchMyShop({}));
        });
        next();
      })
      .finally(() => setLoadingBtn(false));
  };

  return (
    <>
      <Form
        form={form}
        name='basic'
        layout='vertical'
        onFinish={onFinish}
        initialValues={{
          visibility: true,
          status: 'new',
          ...activeMenu.data,
          delivery_type: activeMenu.data?.delivery_type ?? ShopTypes[0],
        }}
      >
        <ShopAddData
          logoImage={logoImage}
          setLogoImage={setLogoImage}
          backImage={backImage}
          setBackImage={setBackImage}
          form={form}
          location={location}
          setLocation={setLocation}
        />
        <Divider />
        <Space className='w-100 justify-content-end'>
          <Button type='primary' htmlType='submit' loading={loadingBtn}>
            {t('next')}
          </Button>
        </Space>
      </Form>
    </>
  );
};
export default ShopMain;
