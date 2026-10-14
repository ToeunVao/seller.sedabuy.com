import React, { useState } from 'react';
import { Card, Col, Pagination, Row, Spin } from 'antd';
import Meta from 'antd/es/card/Meta';
import { PlusOutlined } from '@ant-design/icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import getImage from 'helpers/getImage';
import { toast } from 'react-toastify';
import ProductModal from './product-modal';
import { useTranslation } from 'react-i18next';
import { BsFillGiftFill } from 'react-icons/bs';
import { getCartData } from 'redux/selectors/cartSelector';
import RiveResult from 'components/rive-result';
import { setProductsParams } from 'redux/slices/cart';

export default function ProductCard() {
  const colLg = {
    lg: 8,
    xl: 6,
    xxl: 6,
  };
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const currentData = useSelector((state) => getCartData(state.cart));
  const { products, loading, meta } = useSelector(
    (state) => state.product,
    shallowEqual,
  );
  const { currency } = useSelector((state) => state.cart, shallowEqual);
  const { before_order_phone_required } = useSelector(
    (state) => state.globalSettings.settings,
    shallowEqual,
  );

  const [extrasModal, setExtrasModal] = useState(null);

  const onChangePagination = (page) => {
    dispatch(setProductsParams({ page }));
  };

  const addProductToCart = (item) => {
    if (!currency) {
      toast.warning(t('please.select.currency'));
      return;
    }
    if (currentData?.user?.length === 0) {
      toast.warning(t('please.select.user'));
      return;
    }
    if (!currentData?.phone && before_order_phone_required === '1') {
      toast.warning(t('please.enter.phone'));
      return;
    }
    if (Number(currentData?.phone) < 0) {
      toast.warning(t('invalid.phone.number'));
      return;
    }
    if (!currentData.address && currentData?.delivery_type === 1) {
      toast.warning(t('please.select.address'));
      return;
    }
    if (!currentData.delivery_point && currentData?.delivery_type === 0) {
      toast.warning(t('please.select.delivery.point'));
      return;
    }
    if (!currentData?.paymentType) {
      toast.warning(t('please.select.payment.type'));
      return;
    }
    if (!currentData.deliveries) {
      toast.warning(t('please.select.delivery'));
      return;
    }
    if (!currentData?.delivery_date) {
      toast.warning(t('please.select.delivery.date'));
      return;
    }
    if (currentData?.delivery_time === null) {
      toast.warning(t('please.select.delivery.time'));
      return;
    }
    setExtrasModal(item);
  };

  return (
    <div className='px-2'>
      {loading ? (
        <Spin className='d-flex justify-content-center my-5' />
      ) : (
        <Row gutter={12} className='mt-4 product-card'>
          {products?.length === 0 ? (
            <Col span={24}>
              <RiveResult id='nosell' />
            </Col>
          ) : (
            products?.map((item, index) => (
              <Col {...colLg} key={index}>
                <Card
                  className='products-col'
                  key={item?.id}
                  cover={<img alt={item?.name} src={getImage(item?.img)} />}
                  onClick={() => addProductToCart(item)}
                >
                  <span className='pos-system-product-card-title'>
                    {item?.translation?.title}
                  </span>
                  <div className='preview'>
                    <PlusOutlined />
                  </div>
                  {item?.stocks?.map((it) => (
                    <span className={it?.bonus ? 'show-bonus' : 'd-none'}>
                      <BsFillGiftFill /> {it.bonus?.value}
                      {'+'}
                      {it.bonus?.bonus_quantity}
                    </span>
                  ))}
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}
      {Boolean(extrasModal) && (
        <ProductModal
          extrasModal={extrasModal}
          setExtrasModal={setExtrasModal}
        />
      )}
      <div className='d-flex justify-content-end my-5'>
        <Pagination
          total={meta?.total || 0}
          current={meta?.current_page || 1}
          pageSize={Number(meta?.per_page || 12)}
          showSizeChanger={false}
          active={1}
          onChange={onChangePagination}
        />
      </div>
    </div>
  );
}
