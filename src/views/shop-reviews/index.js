import { useEffect, useState } from 'react';
import { EyeOutlined } from '@ant-design/icons';
import { Button, Card, Rate, Space, Table } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from 'redux/slices/menu';
import useDidUpdate from 'helpers/useDidUpdate';
import { useTranslation } from 'react-i18next';
import { fetchShopReviews } from 'redux/slices/shop-reviews';
import ShopReviewShowModal from './shopReviewShow';
import moment from 'moment';
import FilterColumns from 'components/filter-column';
import shopService from 'services/restaurant';
import { InfiniteSelect } from 'components/infinite-select';

export default function SellerOrderReviews() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { reviews, meta, loading } = useSelector(
    (state) => state.shopReviews,
    shallowEqual,
  );

  const [id, setId] = useState(null);
  const [show, setShow] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    shop: null,
  });
  const [hasMore, setHasMore] = useState({ shop: false });
  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'order',
      is_show: true,
    },
    {
      title: t('user'),
      dataIndex: 'user',
      key: 'user',
      is_show: true,
      render: (user) => `${user?.firstname || ''} ${user?.lastname || ''}`,
    },
    {
      title: t('comment'),
      dataIndex: 'comment',
      key: 'comment',
      is_show: true,
      render: (comment) => comment?.split(',')?.[0],
    },
    {
      title: t('rating'),
      dataIndex: 'rating',
      key: 'rating',
      is_show: true,
      render: (rating) => <Rate disabled defaultValue={rating} />,
    },
    {
      title: t('created.at'),
      dataIndex: 'created_at',
      key: 'created_at',
      is_show: true,
      render: (createdAt) => moment(createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('options'),
      key: 'options',
      is_show: true,
      render: (row) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setShow(row?.id)} />
        </Space>
      ),
    },
  ]);

  const params = {
    page: filters.page,
    type: 'shop',
    type_id: filters.shop?.value,
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const handleHasMoreChange = (key, value) => {
    setHasMore((prev) => ({ ...prev, [key]: value }));
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setId(newSelectedRowKeys);
  };

  const rowSelection = {
    id,
    onChange: onSelectChange,
  };

  const fetchShops = ({ search, page }) => {
    const params = {
      search: search || undefined,
      status: 'approved',
      page,
    };
    return shopService.search(params).then((res) => {
      handleHasMoreChange('shop', Boolean(res?.links?.next));
      return res?.data?.map((item) => ({
        label: item?.translation?.title || t('N/A'),
        value: item?.id,
        key: item?.id,
      }));
    });
  };

  const handleFilter = (items) => {
    const data = activeMenu.data;
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...data, ...items },
      }),
    );
  };

  const fetch = () => {
    dispatch(fetchShopReviews(params));
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

  useDidUpdate(() => {
    fetch();
  }, [filters]);

  return (
    <Card
      title={t('shop.reviews')}
      extra={
        <Space wrap>
          <InfiniteSelect
            placeholder={t('select.shop')}
            hasMore={hasMore.shop}
            fetchOptions={fetchShops}
            style={{ width: 180 }}
            onChange={(shop) => handleFiltersChange({ shop, page: 1 })}
            value={filters.shop}
          />
          <FilterColumns columns={columns} setColumns={setColumns} />
        </Space>
      }
    >
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={reviews}
        pagination={{
          showSizeChanger: false,
          current: meta?.current_page || 1,
          total: meta?.total || 0,
          pageSize: meta?.per_page || 10,
        }}
        rowKey={(record) => record.id}
        onChange={onChangePagination}
        loading={loading}
      />
      {Boolean(show) && (
        <ShopReviewShowModal id={show} handleCancel={() => setShow(null)} />
      )}
    </Card>
  );
}
