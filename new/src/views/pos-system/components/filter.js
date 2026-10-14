import React, { useEffect, useState } from 'react';
import { Card, Col, Row } from 'antd';
import shopService from 'services/shop';
import brandService from 'services/brand';
import categoryService from 'services/category';
import useDidUpdate from 'helpers/useDidUpdate';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchRestProducts } from 'redux/slices/product';
import SearchInput from 'components/search-input';
import { useTranslation } from 'react-i18next';
import { setProductsParams } from 'redux/slices/cart';
import { disableRefetch } from 'redux/slices/menu';
import { InfiniteSelect } from 'components/infinite-select';

const Filter = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { productsParams } = useSelector((state) => state.cart, shallowEqual);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [search, setSearch] = useState(productsParams?.search);
  const [hasMore, setHasMore] = useState({
    shop: false,
    category: false,
    brand: false,
  });

  const params = {
    search: search || undefined,
    shop_id: productsParams?.shop?.value,
    category_id: productsParams?.category?.value,
    brand_id: productsParams?.brand?.value,
    page: productsParams?.page,
    perPage: 12,
    active: 1,
    status: 'published',
  };

  async function fetchUserShop({ search, page }) {
    const params = { search, page, status: 'approved' };
    return shopService.search(params).then((res) => {
      setHasMore((prev) => ({ ...prev, shop: Boolean(res?.links?.next) }));
      return res.data.map((item) => ({
        label: item?.translation?.title,
        value: item?.id,
        key: item?.id,
      }));
    });
  }

  async function fetchUserBrand({ search = '', page = 1 }) {
    const params = { search: search || undefined, page };
    return brandService.search(params).then((res) => {
      setHasMore((prev) => ({ ...prev, brand: Boolean(res?.links?.next) }));
      return res.data.map((item) => ({
        label: item?.title,
        value: item?.id,
        key: item?.id,
      }));
    });
  }

  async function fetchUserCategory({ search = '', page = 1 }) {
    const params = { search: search || undefined, page, type: 'main' };
    return categoryService.search(params).then((res) => {
      setHasMore((prev) => ({ ...prev, category: Boolean(res?.links?.next) }));
      return res.data.map((item) => ({
        label: item?.translation?.title,
        value: item?.id,
        key: item?.id,
      }));
    });
  }

  useEffect(() => {
    dispatch(fetchRestProducts(params));
    dispatch(disableRefetch(activeMenu));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      dispatch(fetchRestProducts(params));
      dispatch(disableRefetch(activeMenu));
    }
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    dispatch(fetchRestProducts(params));
    dispatch(disableRefetch(activeMenu));
  }, [
    productsParams.page,
    productsParams.search,
    productsParams.shop?.value,
    productsParams.category?.value,
    productsParams.brand?.value,
  ]);

  return (
    <Card>
      <Row gutter={12}>
        <Col span={6}>
          <SearchInput
            className='w-100'
            placeholder={t('search')}
            handleChange={setSearch}
          />
        </Col>
        <Col span={6}>
          <InfiniteSelect
            className='w-100'
            value={productsParams?.shop}
            hasMore={hasMore.shop}
            debounceTimeout={500}
            placeholder={t('select.shop')}
            fetchOptions={fetchUserShop}
            onChange={(value) => {
              dispatch(setProductsParams({ shop: value }));
            }}
          />
        </Col>
        <Col span={6}>
          <InfiniteSelect
            className='w-100'
            value={productsParams?.category}
            hasMore={hasMore.category}
            debounceTimeout={500}
            placeholder={t('select.category')}
            fetchOptions={fetchUserCategory}
            onChange={(value) => {
              dispatch(setProductsParams({ category: value }));
            }}
          />
        </Col>
        <Col span={6}>
          <InfiniteSelect
            className='w-100'
            value={productsParams?.brand}
            hasMore={hasMore.brand}
            debounceTimeout={500}
            placeholder={t('select.brand')}
            fetchOptions={fetchUserBrand}
            onChange={(value) => {
              dispatch(setProductsParams({ brand: value }));
            }}
          />
        </Col>
      </Row>
    </Card>
  );
};
export default Filter;
