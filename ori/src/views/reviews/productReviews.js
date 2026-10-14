import { useContext, useEffect, useState } from 'react';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Rate, Space, Table } from 'antd';
import { toast } from 'react-toastify';
import CustomModal from 'components/modal';
import { Context } from 'context/context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setRefetch } from 'redux/slices/menu';
import useDidUpdate from 'helpers/useDidUpdate';
import { useTranslation } from 'react-i18next';
import reviewService from 'services/review';
import { fetchProductReviews } from 'redux/slices/productReview';
import ProductReviewShowModal from './productReviewShow';
import moment from 'moment';
import DeleteButton from 'components/delete-button';
import FilterColumns from 'components/filter-column';

export default function ProductReviews() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { reviews, meta, loading } = useSelector(
    (state) => state.productReview,
    shallowEqual,
  );
  const { setIsModalVisible } = useContext(Context);

  const [id, setId] = useState(null);
  const [show, setShow] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [text, setText] = useState(null);
  const [filters, setFilters] = useState({ page: 1 });
  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
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
      title: t('shop'),
      dataIndex: 'shop',
      key: 'shop',
      is_show: true,
      render: (shop) => shop?.translation?.title || t('N/A'),
    },
    {
      title: t('product'),
      dataIndex: 'product',
      key: 'product',
      is_show: true,
      render: (product) => product?.translation?.title || t('N/A'),
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
          <Button icon={<EyeOutlined />} onClick={() => setShow(row.id)} />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setId([row.id]);
              setIsModalVisible(true);
              setText(true);
            }}
          />
        </Space>
      ),
    },
  ]);

  const params = {
    page: filters.page,
    search: filters.search || undefined,
    perPage: 10,
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const reviewDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    reviewService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setId(null);
        setLoadingBtn(false);
        setIsModalVisible(false);
        setText(null);
      });
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

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.review'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  const fetch = () => {
    dispatch(fetchProductReviews(params));
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
      title={t('product.reviews')}
      extra={
        <Space wrap>
          <DeleteButton onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <FilterColumns columns={columns} setColumns={setColumns} />
        </Space>
      }
    >
      <Divider />
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={reviews}
        pagination={{
          showSizeChanger: false,
          pageSize: meta?.per_page || 10,
          total: meta?.total,
          current: meta?.current_page || 1,
        }}
        rowKey={(record) => record.id}
        onChange={onChangePagination}
        loading={loading}
      />
      <CustomModal
        click={reviewDelete}
        text={text ? t('delete') : t('delete.selected')}
        setText={setId}
        loading={loadingBtn}
      />
      {Boolean(show) && (
        <ProductReviewShowModal id={show} handleCancel={() => setShow(null)} />
      )}
    </Card>
  );
}
