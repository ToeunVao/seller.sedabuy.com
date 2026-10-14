import { useEffect, useState } from 'react';
import { Form, Card } from 'antd';
import LanguageList from 'components/language-list';
import { useNavigate, useParams } from 'react-router-dom';
import couponService from 'services/coupon';
import moment from 'moment';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, removeFromMenu } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import CouponForm from './coupon-form';
import { toast } from 'react-toastify';
import getLanguageFields from 'helpers/getLanguageFields';
import useDidUpdate from 'helpers/useDidUpdate';

const CouponEdit = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { languages } = useSelector((state) => state.formLang, shallowEqual);

  const [loading, setLoading] = useState(false);

  const fetchCoupon = () => {
    setLoading(true);
    couponService
      .getById(id)
      .then((res) => {
        const body = {
          ...getLanguageFields(languages, res?.data),
          name: res?.data?.name,
          type: res?.data?.type,
          expired_at: moment(res?.data.expired_at, 'YYYY-MM-DD'),
          qty: Number(res?.data?.qty),
          price: Number(res?.data?.price),
          shop_id: {
            label: res?.data?.shop?.translation?.title,
            value: res?.data?.shop?.id,
            key: res?.data?.shop?.id,
          },
          for: res.data?.for,
        };
        form.setFieldsValue({
          ...body,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onFinish = (body) =>
    couponService.update(id, body).then((res) => {
      toast.success(t('successfully.updated'));
      const nextUrl = 'coupons';
      dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
      navigate(`/${nextUrl}`);
      return res;
    });

  const fetch = () => {
    fetchCoupon();
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    if (id) {
      fetch();
    }
  }, [id]);

  useDidUpdate(() => {
    if (activeMenu.refetch && id) {
      fetch();
    }
  }, [activeMenu.refetch, id]);

  return (
    <Card title={t('edit.coupon')} extra={<LanguageList />} loading={loading}>
      <CouponForm form={form} handleSubmit={onFinish} />
    </Card>
  );
};

export default CouponEdit;
