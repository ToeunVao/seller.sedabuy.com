import { useContext, useEffect, useState } from 'react';
import { Button, Card, Space, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Context } from 'context/context';
import CustomModal from 'components/modal';
import { toast } from 'react-toastify';
import couponService from 'services/seller/coupon';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import DeleteButton from 'components/delete-button';
import FilterColumns from 'components/filter-column';
import useDidUpdate from 'helpers/useDidUpdate';
import { fetchCoupon } from 'redux/slices/sellerCoupons';
import numberToPrice from 'helpers/numberToPrice';
import { getDateFormat } from 'helpers/get-date-format';

const SellerCoupon = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { coupons, meta, loading } = useSelector(
    (state) => state.sellerCoupons,
    shallowEqual,
  );
  const { setIsModalVisible } = useContext(Context);

  const [couponId, setCouponId] = useState(null);
  const [text, setText] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [filters, setFilters] = useState({ page: 1 });
  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      is_show: true,
    },
    {
      title: t('title'),
      dataIndex: 'translation',
      key: 'title',
      is_show: true,
      render: (translation) => translation?.title,
    },
    {
      title: t('code'),
      dataIndex: 'name',
      key: 'name',
      is_show: true,
    },

    {
      title: t('price'),
      dataIndex: 'price',
      key: 'price',
      is_show: true,
      render: (price, row) =>
        row?.type === 'fix' ? numberToPrice(price) : `${price}%`,
    },
    {
      title: t('quantity'),
      dataIndex: 'qty',
      key: 'try',
      is_show: true,
    },
    {
      title: t('expired.at'),
      dataIndex: 'expired_at',
      key: 'expired_at',
      is_show: true,
      render: (expiredAt) => (
        <Tag color={moment(new Date()).isBefore(expiredAt) ? 'blue' : 'red'}>
          {getDateFormat({ date: expiredAt, showHour: false })}
        </Tag>
      ),
    },
    {
      title: t('options'),
      key: 'options',
      is_show: true,
      render: (row) => (
        <Space>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => goToEdit(row)}
          />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setCouponId([row?.id]);
              setIsModalVisible(true);
              setText(true);
            }}
          />
        </Space>
      ),
    },
  ]);

  const params = {
    perPage: 10,
    page: filters.page,
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const goToEdit = (row) => {
    dispatch(
      addMenu({
        url: `seller/coupons/${row?.id}`,
        id: 'coupon_edit',
        name: t('edit.coupon'),
      }),
    );
    navigate(`/seller/coupons/${row?.id}`);
  };

  const goToAdd = () => {
    dispatch(
      addMenu({
        id: 'add.coupon',
        url: 'seller/coupons/add',
        name: t('add.coupon'),
      }),
    );
    navigate('/seller/coupons/add');
  };

  const deleteCoupon = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...couponId.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    couponService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setLoadingBtn(false);
        setCouponId(null);
        setIsModalVisible(false);
        setText(null);
      });
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const rowSelection = {
    selectedRowKeys: couponId,
    onChange: (key) => {
      setCouponId(key);
    },
  };

  const allDelete = () => {
    if (couponId === null || couponId.length === 0) {
      toast.warning(t('select.coupon'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  const fetch = () => {
    dispatch(fetchCoupon(params));
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      title={t('coupons')}
      extra={
        <Space wrap>
          <DeleteButton onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <FilterColumns columns={columns} setColumns={setColumns} />
          <Button type='primary' onClick={goToAdd}>
            {t('add.coupon')}
          </Button>
        </Space>
      }
    >
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        rowKey={(record) => record.id}
        dataSource={coupons}
        columns={columns?.filter((item) => item.is_show)}
        pagination={{
          showSizeChanger: false,
          pageSize: meta?.per_page || 10,
          current: meta?.current_page || 1,
          total: meta?.total || 0,
        }}
        loading={loading}
        onChange={onChangePagination}
      />
      <CustomModal
        click={deleteCoupon}
        text={text ? t('delete') : t('all.delete')}
        setText={setCouponId}
        loading={loadingBtn}
      />
    </Card>
  );
};

export default SellerCoupon;
