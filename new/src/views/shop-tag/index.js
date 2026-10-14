import { useContext, useEffect, useState } from 'react';
import { Button, Card, Space, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import CustomModal from 'components/modal';
import { Context } from 'context/context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import shopTagService from 'services/shopTag';
import { fetchShopTag } from 'redux/slices/shopTag';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import DeleteButton from 'components/delete-button';
import FilterColumns from 'components/filter-column';
import useDidUpdate from 'helpers/useDidUpdate';

const colors = ['blue', 'red', 'gold', 'volcano', 'cyan', 'lime'];

const ShopTag = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setIsModalVisible } = useContext(Context);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { shopTag, meta, loading } = useSelector(
    (state) => state.shopTag,
    shallowEqual,
  );
  const [id, setId] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
  });
  const params = {
    perPage: 10,
    page: filters.page,
  };
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
      title: t('translations'),
      dataIndex: 'locales',
      key: 'locales',
      is_show: true,
      render: (locales) => (
        <Space>
          {locales?.map((item, index) => (
            <Tag color={[colors[index]]} className='text-uppercase'>
              {item}
            </Tag>
          ))}
        </Space>
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
          <Button icon={<CopyOutlined />} onClick={() => goToClone(row)} />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setIsModalVisible(true);
              setId([row.id]);
            }}
          />
        </Space>
      ),
    },
  ]);

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const goToAddBanners = () => {
    dispatch(
      addMenu({
        id: 'shop-tag/add',
        url: 'shop-tag/add',
        name: t('add.shop.tag'),
      }),
    );
    navigate('/shop-tag/add');
  };

  const goToEdit = (row) => {
    dispatch(
      addMenu({
        url: `shop-tag/${row.id}`,
        id: 'shop_tag_edit',
        name: t('edit.shop.tag'),
      }),
    );
    navigate(`/shop-tag/${row.id}`);
  };

  const goToClone = (row) => {
    dispatch(
      addMenu({
        url: `shop-tag/clone/${row.id}`,
        id: 'shop_tag_clone',
        name: t('clone.shop.tag'),
      }),
    );
    navigate(`/shop-tag/clone/${row.id}`);
  };

  const tagDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    shopTagService
      .delete(params)
      .then(() => {
        dispatch(setRefetch(activeMenu));
        toast.success(t('successfully.deleted'));
        setIsModalVisible(false);
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.shop.tag'));
    } else {
      setIsModalVisible(true);
    }
  };

  const fetch = () => {
    dispatch(fetchShopTag(params));
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
      title={t('shop.tags')}
      extra={
        <Space wrap>
          <Button type='primary' onClick={goToAddBanners}>
            {t('add.tag')}
          </Button>
          <DeleteButton onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <FilterColumns setColumns={setColumns} columns={columns} />
        </Space>
      }
    >
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={shopTag}
        pagination={{
          showSizeChanger: false,
          total: meta?.total || 0,
          current: meta?.current_page || 1,
          pageSize: meta?.per_page || 10,
        }}
        rowKey={(record) => record.id}
        loading={loading}
        onChange={onChangePagination}
      />
      <CustomModal
        click={tagDelete}
        text={t('delete')}
        loading={loadingBtn}
        setText={setId}
      />
    </Card>
  );
};

export default ShopTag;
