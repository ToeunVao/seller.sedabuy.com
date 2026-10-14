import { Form, Card } from 'antd';
import LanguageList from 'components/language-list';
import { useNavigate } from 'react-router-dom';
import couponService from 'services/coupon';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { removeFromMenu } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import CouponForm from './coupon-form';
import { toast } from 'react-toastify';

const CouponAdd = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const onFinish = (body) =>
    couponService.create(body).then((res) => {
      toast.success(t('successfully.created'));
      const nextUrl = 'coupons';
      dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
      navigate(`/${nextUrl}`);
      return res;
    });

  return (
    <Card title={t('add.coupon')} extra={<LanguageList />}>
      <CouponForm form={form} handleSubmit={onFinish} />
    </Card>
  );
};

export default CouponAdd;
