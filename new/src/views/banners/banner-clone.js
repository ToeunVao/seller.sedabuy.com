import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Card, Form, Spin } from 'antd';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, removeFromMenu, setMenuData } from 'redux/slices/menu';
import bannerService from 'services/banner';
import { useTranslation } from 'react-i18next';
import LanguageList from 'components/language-list';
import BannerForm from './banner-form';

const BannerClone = () => {
  const { t } = useTranslation();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const { languages } = useSelector((state) => state.formLang, shallowEqual);

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      dispatch(setMenuData({ activeMenu, data }));
    };
  }, []);

  const createMediaFile = (items) => {
    const mediaObject = { images: [], previews: [] };
    const previews = items
      .filter((item) => item.preview)
      .map((item) => ({
        uid: item.id,
        name: item.preview,
        url: item.preview,
      }));
    const videos = items
      .filter((item) => item.preview)
      .map((item) => ({
        uid: item.id,
        name: item.path,
        url: item.path,
        isVideo: true,
      }));
    mediaObject.previews = previews;
    mediaObject.images = videos;

    return mediaObject;
  };

  const createImages = (items) =>
    items.map((item) => ({
      uid: item.id,
      name: item.path,
      url: item.path,
      isVideo: Boolean(item.preview),
    }));

  function getLanguageFields(data) {
    if (!data) {
      return {};
    }
    const { translations } = data;
    const result = languages.map((item) => ({
      [`title[${item.locale}]`]: translations.find(
        (el) => el.locale === item.locale,
      )?.title,
      [`description[${item.locale}]`]: translations.find(
        (el) => el.locale === item.locale,
      )?.description,
    }));
    return Object.assign({}, ...result);
  }

  const getBanner = (alias) => {
    setLoading(true);
    bannerService
      .getById(alias)
      .then((res) => {
        const banner = res.data;

        const data = {
          ...banner,
          initialMediaFile: createMediaFile(res.data.galleries),
          img: createImages(banner.galleries),
          products: banner?.products?.map((item) => ({
            label: item?.translation?.title,
            value: item?.id,
            key: item?.id,
          })),
          shops: banner?.shops?.map((item) => ({
            label: item?.translation?.title,
            value: item?.id,
            key: item?.id,
          })),
          banner_type: banner?.is_shop ? 'shop' : 'product',
          ...getLanguageFields(banner),
        };

        form.setFieldsValue(data);
        dispatch(setMenuData({ activeMenu, data }));
      })
      .finally(() => {
        dispatch(disableRefetch(activeMenu));
        setLoading(false);
      });
  };

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

  useEffect(() => {
    if (activeMenu.refetch) {
      getBanner(id);
    }
  }, [activeMenu.refetch]);

  return (
    <Card title={t('clone.banner')} extra={<LanguageList />}>
      {!loading ? (
        <BannerForm form={form} handleSubmit={onFinish} />
      ) : (
        <div className='d-flex justify-content-center align-items-center'>
          <Spin size='large' className='py-5' />
        </div>
      )}
    </Card>
  );
};

export default BannerClone;
