import { useContext, useEffect, useState } from 'react';
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Space,
  Table,
  Tabs,
  Tag,
  Switch,
  Typography,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Context } from 'context/context';
import CustomModal from 'components/modal';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import shopService from 'services/shop';
import { fetchShops } from 'redux/slices/shop';
import { useTranslation } from 'react-i18next';
import ShopStatusModal from './shop-status-modal';
import DeleteButton from 'components/delete-button';
import SearchInput from 'components/search-input';
import useDidUpdate from 'helpers/useDidUpdate';
import FilterColumns from 'components/filter-column';
import ColumnImage from 'components/column-image';

const { TabPane } = Tabs;
const colors = ['blue', 'red', 'gold', 'volcano', 'cyan', 'lime'];
const roles = ['all', 'new', 'approved', 'rejected'];

const Shops = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth, shallowEqual);
  const { shops, meta, loading } = useSelector(
    (state) => state.shop,
    shallowEqual,
  );
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const { setIsModalVisible } = useContext(Context);

  const [shopStatus, setShopStatus] = useState(null);
  const [text, setText] = useState(null);
  const [id, setId] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    page: 1,
  });

  const params = {
    search: filters.search || undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    page: filters.page,
    perPage: 10,
  };

  const goToAdd = () => {
    dispatch(
      addMenu({
        id: 'add-shop',
        url: `shop/add`,
        name: t('add.shop'),
      }),
    );
    navigate(`/shop/add`);
  };

  const goToEdit = (row) => {
    dispatch(
      addMenu({
        id: 'edit-shop',
        url: `shop/${row.uuid}`,
        name: t('edit.shop'),
      }),
    );
    navigate(`/shop/${row.uuid}`, { state: 'edit' });
  };

  const goToClone = (row) => {
    dispatch(
      addMenu({
        id: 'shop-clone',
        url: `shop-clone/${row.uuid}`,
        name: t('shop.clone'),
      }),
    );
    navigate(`/shop-clone/${row.uuid}`, { state: 'clone' });
  };

  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      is_show: true,
      key: 'id',
    },
    {
      title: t('title'),
      dataIndex: 'translation',
      is_show: true,
      key: 'title',
      render: (translation, row) => (
        <div className='d-flex align-items-center' style={{ gap: '8px' }}>
          <ColumnImage
            image={row?.logo_img}
            style={{
              border: '1px solid var(--grey)',
              borderRadius: '4px',
              flexShrink: 0,
            }}
          />
          <Typography.Text>{translation?.title || t('N/A')}</Typography.Text>
        </div>
      ),
    },
    {
      title: t('translations'),
      dataIndex: 'locales',
      is_show: true,
      key: 'locales',
      render: (locales) => (
        <Space>
          {locales?.map((item, index) => (
            <Tag className='text-uppercase' color={[colors[index]]}>
              {item}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('seller'),
      dataIndex: 'seller',
      is_show: true,
      key: 'seller',
      render: (seller) =>
        `${seller?.firstname || ''} ${seller?.lastname || ''}`,
    },
    {
      title: t('open.time'),
      dataIndex: 'open',
      is_show: true,
      key: 'open',
      render: (open) => (
        <Tag color={open ? 'blue' : 'red'}>{t(open ? 'open' : 'closed')} </Tag>
      ),
    },
    {
      title: t('featured'),
      dataIndex: 'featured',
      is_show: true,
      render: (featured, row) => (
        <Switch
          checked={Boolean(featured)}
          onChange={() => {
            setIsModalVisible(true);
            setId(row?.uuid);
            setText(t('set.feature.text'));
          }}
        />
      ),
    },
    {
      title: t('verify'),
      dataIndex: 'verify',
      is_show: true,
      render: (active, row) => (
        <Switch
          onChange={() => {
            setIsModalVisible(true);
            setId(row?.uuid);
            setText(t('set.verify.text'));
          }}
          checked={active}
        />
      ),
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      is_show: true,
      render: (status, row) => (
        <div
          style={{ minWidth: 'max-content', cursor: 'pointer' }}
          onClick={() => setShopStatus(row)}
        >
          <Tag
            color={
              status === 'new' ? 'blue' : status === 'rejected' ? 'red' : 'cyan'
            }
          >
            {t(status)}
          </Tag>
          <EditOutlined />
        </div>
      ),
    },
    {
      title: t('options'),
      dataIndex: 'options',
      key: 'options',
      is_show: true,
      render: (_, row) => (
        <Space>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => goToEdit(row)}
          />
          <Button icon={<CopyOutlined />} onClick={() => goToClone(row)} />
          {user?.role !== 'manager' && (
            <DeleteButton
              icon={<DeleteOutlined />}
              onClick={() => {
                setId([row.id]);
                setIsModalVisible(true);
                setText(t('delete'));
              }}
            />
          )}
        </Space>
      ),
    },
  ]);

  const handleFilterChange = (values = {}) => {
    setFilters((prev) => ({ ...prev, ...values }));
  };

  const shopDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    shopService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        setIsModalVisible(false);
        setText(null);
        setId(null);
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  const handleVerify = () => {
    setLoadingBtn(true);
    shopService
      .setVerify(id)
      .then(() => {
        toast.success(t('successfully.updated'));
        setIsModalVisible(false);
        setText(null);
        setId(null);
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  const handleFeatured = () => {
    setLoadingBtn(true);
    shopService
      .setFeatured(id)
      .then(() => {
        toast.success(t('successfully.updated'));
        setIsModalVisible(false);
        setText(null);
        setId(null);
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFilterChange({ page });
  };

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.shop'));
    } else {
      setIsModalVisible(true);
      setText(t('delete.selected'));
    }
  };

  const handleChangeCustomModal = () => {
    switch (text) {
      case t('delete'):
      case t('delete.selected'):
        shopDelete();
        break;
      case t('set.verify.text'):
        handleVerify();
        break;
      case t('set.feature.text'):
        handleFeatured();
        break;
      default:
        break;
    }
  };

  const fetch = () => {
    dispatch(fetchShops(params));
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
      title={t('shops')}
      extra={
        <Space wrap>
          <Space wrap>
            <Button type='primary' onClick={goToAdd}>
              {t('add.shop')}
            </Button>
            <DeleteButton onClick={allDelete}>
              {t('delete.selected')}
            </DeleteButton>
          </Space>
          <FilterColumns columns={columns} setColumns={setColumns} />
        </Space>
      }
    >
      <div className='d-flex justify-content-between'>
        <SearchInput
          placeholder={t('search')}
          handleChange={(e) =>
            handleFilterChange({
              search: e,
              page: 1,
            })
          }
          defaultValue={filters.search}
          resetSearch={!filters.search}
          style={{ width: '200px' }}
        />
      </div>
      <Tabs
        className='mt-3'
        activeKey={filters.status}
        type='card'
        onChange={(key) => {
          handleFilterChange({ status: key, page: 1 });
        }}
      >
        {roles.map((item) => (
          <TabPane tab={t(item)} key={item} />
        ))}
      </Tabs>

      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={shops}
        loading={loading}
        pagination={{
          showSizeChanger: false,
          pageSize: meta?.per_page || 10,
          total: meta?.total || 0,
          current: meta?.current_page || 1,
        }}
        rowKey={(record) => record?.id}
        onChange={onChangePagination}
      />
      {Boolean(shopStatus) && (
        <ShopStatusModal
          data={shopStatus}
          handleCancel={() => setShopStatus(null)}
        />
      )}
      <CustomModal
        click={handleChangeCustomModal}
        text={text}
        loading={loadingBtn}
        setText={setId}
      />
    </Card>
  );
};

export default Shops;
