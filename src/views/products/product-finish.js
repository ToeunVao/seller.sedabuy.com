import { useEffect, useState } from 'react';
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
import { useNavigate, useParams } from 'react-router-dom';
import { removeFromMenu } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import productService from 'services/product';
import { toast } from 'react-toastify';
import requestAdminModelsService from 'services/request-models';
import ColumnImage from 'components/column-image';

const ProductFinish = ({ prev, isRequest }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { uuid } = useParams();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(null);
  const [isButtonLoading, setButtonLoading] = useState(false);

  const changedInfo = activeMenu.data;
  const originalInfo = isRequest ? activeMenu.data.model : data;

  const getLanguageFields = (data) => {
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
  };

  const fetchProduct = (uuid) => {
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
  };

  const onFinish = () => {
    const nextUrl = 'catalog/products';
    if (isRequest && activeMenu.data) {
      setButtonLoading(true);
      const requestBody = {
        id: activeMenu.data.model_id,
        type: 'product',
        data: activeMenu.data,
      };
      requestAdminModelsService
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
    dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
    navigate(`/${nextUrl}`);
  };

  useEffect(() => {
    if (!isRequest) {
      fetchProduct(uuid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRequest]);

  return !loading ? (
    <>
      {isRequest && (
        <>
          <Descriptions bordered title={t('changed.info')}>
            <Descriptions.Item
              label={`${t('title')} (${defaultLang})`}
              span={3}
            >
              {changedInfo[`title[${defaultLang}]`]}
            </Descriptions.Item>
            <Descriptions.Item
              label={`${t('description')} (${defaultLang})`}
              span={3}
            >
              {changedInfo[`description[${defaultLang}]`]}
            </Descriptions.Item>
            <Descriptions.Item label={t('shop')} span={1.5}>
              {changedInfo?.shop?.translation?.title}
            </Descriptions.Item>
            <Descriptions.Item label={t('category')} span={1.5}>
              {changedInfo?.category?.label}
            </Descriptions.Item>
            <Descriptions.Item label={t('brand')} span={1.5}>
              {changedInfo?.brand?.label}
            </Descriptions.Item>
            <Descriptions.Item label={t('unit')} span={1.5}>
              {changedInfo?.unit?.label}
            </Descriptions.Item>
            <Descriptions.Item label={t('images')} span={3}>
              <Row gutter={12}>
                {changedInfo?.images
                  ?.filter((item) => !item.isVideo)
                  .map((item, idx) => (
                    <Col key={'image' + idx}>
                      <img width={80} alt='product' src={item.url} />
                    </Col>
                  ))}
              </Row>
            </Descriptions.Item>
            <Descriptions.Item label={t('tax')}>
              {changedInfo?.tax || 0}
            </Descriptions.Item>
            <Descriptions.Item label={t('min.quantity')}>
              {changedInfo?.min_qty}
            </Descriptions.Item>
            <Descriptions.Item label={t('max.quantity')}>
              {changedInfo?.max_qty}
            </Descriptions.Item>
          </Descriptions>
          {!!changedInfo?.stocks?.length && (
            <Collapse className='mt-4'>
              <Collapse.Panel key='stocks' header={t('stocks')}>
                {changedInfo?.stocks.map((item, idx) => (
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
                        label={changedInfo?.extras[idx].label}
                      >
                        {extra?.label}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                ))}
              </Collapse.Panel>
            </Collapse>
          )}
        </>
      )}
      <Descriptions bordered className='mt-4' title={t('original.info')}>
        <Descriptions.Item
          label={`${t('title')} (${defaultLang})`}
          span={3}
          column={3}
        >
          {originalInfo.translation?.title ||
            originalInfo[`title[${defaultLang}]`]}
        </Descriptions.Item>
        <Descriptions.Item
          label={`${t('description')} (${defaultLang})`}
          span={3}
          column={3}
        >
          {originalInfo?.translation?.description ||
            originalInfo[`description[${defaultLang}]`]}
        </Descriptions.Item>
        <Descriptions.Item label={t('shop')} span={3} column={3}>
          {originalInfo.shop?.translation?.title}
        </Descriptions.Item>
        <Descriptions.Item label={t('category')} span={3} column={3}>
          {originalInfo.category?.translation?.title}
        </Descriptions.Item>
        <Descriptions.Item label={t('brand')} span={3} column={3}>
          {originalInfo.brand?.title}
        </Descriptions.Item>
        <Descriptions.Item label={t('unit')} span={3} column={3}>
          {originalInfo.unit?.translation?.title}
        </Descriptions.Item>
        <Descriptions.Item label={t('images')} span={3} column={3}>
          <Row gutter={12}>
            {originalInfo?.galleries
              ?.filter((item) => !item?.preview)
              ?.map((item) => (
                <Col key={item?.id}>
                  <ColumnImage image={item?.path} />
                </Col>
              ))}
          </Row>
        </Descriptions.Item>
        <Descriptions.Item span={3} column={3} label={t('tax')}>
          {originalInfo.tax || 0}
        </Descriptions.Item>
        <Descriptions.Item span={3} column={3} label={t('min.quantity')}>
          {originalInfo.min_qty}
        </Descriptions.Item>
        <Descriptions.Item span={3} column={3} label={t('max.quantity')}>
          {originalInfo.max_qty}
        </Descriptions.Item>
      </Descriptions>
      {!!originalInfo.stocks?.length && (
        <Collapse className='mt-4'>
          <Collapse.Panel key='stockcs' header={t('stocks')}>
            {originalInfo.stocks?.map((item, idx) => (
              <Descriptions key={'desc' + idx} bordered className='mt-4'>
                <Descriptions.Item label={t('price')} span={2} column={2}>
                  {item.price}
                </Descriptions.Item>
                <Descriptions.Item label={t('quantity')} span={2} column={2}>
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
      <Divider />
      <Space className='w-100 justify-content-end'>
        <Button onClick={prev}>{t('prev')}</Button>
        <Button loading={isButtonLoading} type='primary' onClick={onFinish}>
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
