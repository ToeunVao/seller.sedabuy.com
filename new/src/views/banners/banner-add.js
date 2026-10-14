import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Card, Form } from 'antd';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { removeFromMenu, setMenuData } from 'redux/slices/menu';
import bannerService from 'services/banner';
import { useTranslation } from 'react-i18next';
import LanguageList from 'components/language-list';
import BannerForm from './banner-form';

const BannerAdd = () => {
  const { t } = useTranslation();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      dispatch(setMenuData({ activeMenu, data }));
    };
  }, []);

  const onFinish = (body) => {
    const nextUrl = 'banners';

    return bannerService.create(body).then(() => {
      toast.success(t('successfully.created'));
      batch(() => {
        dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
      });
      navigate(`/${nextUrl}`);
    });
  };

  return (
    <Card title={t('add.banner')} extra={<LanguageList />}>
      <BannerForm form={form} handleSubmit={onFinish} />
    </Card>
  );
};

export default BannerAdd;
