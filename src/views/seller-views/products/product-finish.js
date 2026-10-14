import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Col,
  Collapse,
  Descriptions,
  Divider,
  Row,
  Space,
  Spin,
} from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { removeFromMenu } from 'redux/slices/menu';
import { fetchSellerProducts } from 'redux/slices/product';
import { useTranslation } from 'react-i18next';
import productService from 'services/seller/product';
import requestModelsService from 'services/seller/request-models';
import { toast } from 'react-toastify';
import ColumnImage from 'components/column-image';

const ProductFinish = ({ prev, isRequest, mode }) => {
  const { t } = useTranslation();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );
  const navigate = useNavigate();
  const { state } = useLocation();
  const dispatch = useDispatch();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(null);
  const { uuid } = useParams();
  const { params } = useSelector((state) => state.product, shallowEqual);
  const [buttonLoadding, setButtonLoading] = useState(false);
  const { settings } = useSelector((state) => state.globalSettings);

  function onFinish() {
    const nextUrl = 'seller/products';
    const body = {
      ...params,
    };
    if (isRequest && activeMenu.data) {
      setButtonLoading(true);
      const requestBody = {
        id: activeMenu.data.model_id,
        type: 'product',
        data: activeMenu.data,
      };
      requestModelsService
        .requestChangeUpdate(activeMenu.data.request_id, requestBody)
        .then(() => {
          navigate(`/${nextUrl}`, { state: { tab: 'request' } });
          toast.success(t('successfully.updated'));
          dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
        })
        .finally(() => {
          setButtonLoading(false);
        });
      return;
    }
    if (state && mode === 'edit' && settings?.product_auto_approve === '0') {
      setButtonLoading(true);
      const requestBody = {
        type: 'product',
        id: activeMenu.data.product_id,
        data: state,
      };
      requestModelsService
        .requestChange(requestBody)
        .then(() => {
          toast.success(t('successfully.updated'));
          dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
          dispatch(fetchSellerProducts(body));
          navigate(`/${nextUrl}`, { state: { tab: 'request' } });
        })
        .finally(() => {
          setButtonLoading(false);
        });
      return;
    }
    dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
    dispatch(fetchSellerProducts(body));
    navigate(`/${nextUrl}`);
  }

  function getLanguageFields(data) {
    if (!data?.translations) {
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

  const fetchProduct = useCallback(
    (uuid) => {
      setLoading(true);
      productService
        .getById(uuid)
        .then((res) => {
          const data = {
            ...res.data,
            ...getLanguageFields(res.data),
            properties: res.data.properties.map((item, index) => ({
              id: index,
              [`key[${item.locale}]`]: item.key,
              [`value[${item.locale}]`]: item.value,
            })),
            translation: undefined,
            translations: undefined,
          };
          setData(data);
        })
        .finally(() => setLoading(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uuid],
  );

  useEffect(() => {
    if (!isRequest) {
      fetchProduct(uuid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRequest, uuid]);

  const productInfo = isRequest ? activeMenu.data : state;

  return !loading ? (
    <>
      {state || isRequest ? (
        <>
          <Descriptions title={t('product.info')} bordered>
            <Descriptions.Item
              label={`${t('title')} (${defaultLang})`}
              span={3}
            >
              {productInfo[`title[${defaultLang}]`]}
            </Descriptions.Item>
            <Descriptions.Item
              label={`${t('description')} (${defaultLang})`}
              span={3}
            >
              {productInfo[`description[${defaultLang}]`]}
            </Descriptions.Item>
            <Descriptions.Item label={t('category')} span={3}>
              {productInfo?.category?.label}
            </Descriptions.Item>
            <Descriptions.Item label={t('brand')} span={3}>
              {productInfo?.brand?.label}
            </Descriptions.Item>
            <Descriptions.Item label={t('unit')} span={3}>
              {productInfo?.unit?.label}
            </Descriptions.Item>
            <Descriptions.Item label={t('images')} span={3}>
              <Row gutter={12}>
                {productInfo?.images
                  ?.filter((item) => !item.isVideo)
                  .map((item, idx) => (
                    <Col key={'image' + idx}>
                      <img width={80} alt='product' src={item.url} />
                    </Col>
                  ))}
              </Row>
            </Descriptions.Item>
            <Descriptions.Item label={t('tax')} span={3}>
              {productInfo?.tax || 0}
            </Descriptions.Item>
            <Descriptions.Item label={t('min.quantity')} span={3}>
              {productInfo?.min_qty}
            </Descriptions.Item>
            <Descriptions.Item label={t('max.quantity')} span={3}>
              {productInfo?.max_qty}
            </Descriptions.Item>
          </Descriptions>
          {productInfo?.stocks.map((item, idx) => {
            if (!item) {
              return '';
            }
            return (
              <Descriptions key={'desc' + idx} bordered className='mt-4'>
                <Descriptions.Item label={t('price')} span={2}>
                  {item.price}
                </Descriptions.Item>
                <Descriptions.Item label={t('quantity')} span={2}>
                  {item.quantity}
                </Descriptions.Item>
                {item?.ids?.map((extra, idx) => (
                  <Descriptions.Item
                    key={'extra' + idx}
                    label={productInfo?.extras[idx].label}
                  >
                    {extra?.label}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            );
          })}
        </>
      ) : (
        <>
          <Descriptions title={t('product.info')} bordered>
            <Descriptions.Item
              label={`${t('title')} (${defaultLang})`}
              span={3}
            >
              {data[`title[${defaultLang}]`]}
            </Descriptions.Item>
            <Descriptions.Item
              label={`${t('description')} (${defaultLang})`}
              span={3}
            >
              {data[`description[${defaultLang}]`]}
            </Descriptions.Item>
            <Descriptions.Item label={t('category')} span={3}>
              {data.category?.translation?.title}
            </Descriptions.Item>
            <Descriptions.Item label={t('brand')} span={3}>
              {data.brand?.title}
            </Descriptions.Item>
            <Descriptions.Item label={t('unit')} span={3}>
              {data.unit?.translation?.title}
            </Descriptions.Item>
            <Descriptions.Item label={t('images')} span={3}>
              <Row gutter={12}>
                {data?.galleries
                  ?.filter((item) => !item.preview)
                  .map((item) => (
                    <Col key={item?.id}>
                      <ColumnImage image={item?.path} />
                    </Col>
                  ))}
              </Row>
            </Descriptions.Item>
            <Descriptions.Item label={t('tax')} span={3}>
              {data.tax || 0}
            </Descriptions.Item>
            <Descriptions.Item label={t('min.quantity')} span={3}>
              {data.min_qty || 0}
            </Descriptions.Item>
            <Descriptions.Item label={t('max.quantity')} span={3}>
              {data.max_qty || 0}
            </Descriptions.Item>
          </Descriptions>
          {!!data?.stocks?.length && (
            <Collapse className='mt-4'>
              <Collapse.Panel key='stockcs' header={t('stocks')}>
                {data?.stocks?.map((item, idx) => (
                  <Descriptions key={'desc' + idx} bordered className='mt-4'>
                    <Descriptions.Item label={t('price')} span={2} column={2}>
                      {item.price}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t('quantity')}
                      span={2}
                      column={2}
                    >
                      {item.quantity}
                    </Descriptions.Item>
                    {item.extras.map((extra, idx) => (
                      <Descriptions.Item
                        key={'extra' + idx}
                        label={extra?.group?.translation?.title}
                        span={2}
                        column={2}
                      >
                        {extra?.value?.value}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                ))}
              </Collapse.Panel>
            </Collapse>
          )}
        </>
      )}
      <Divider />
      <Space className='w-100 justify-content-end'>
        <Button onClick={prev}>{t('prev')}</Button>
        <Button loading={buttonLoadding} type='primary' onClick={onFinish}>
          {t('finish')}
        </Button>
      </Space>
    </>
  ) : (
    <div className='d-flex justify-content-center align-items-center'>
      <Spin size='large' className='py-5' />
    </div>
  );
};

export default ProductFinish;
