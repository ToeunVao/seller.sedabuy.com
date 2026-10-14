import { useContext, useEffect, useState } from 'react';
import { Button, Card, Space, Switch, Table } from 'antd';
import { Context } from 'context/context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setRefetch } from 'redux/slices/menu';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { fetchArea } from 'redux/slices/deliveryzone/area';
import SearchInput from 'components/search-input';
import useDidUpdate from 'helpers/useDidUpdate';
import areaService from 'services/deliveryzone/area';
import { useQueryParams } from 'helpers/useQueryParams';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import AreaForm from './area-form';

const Area = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const queryParams = useQueryParams();

  const { setIsModalVisible } = useContext(Context);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const {
    list,
    meta,
    loading,
    params: initialParams,
  } = useSelector((state) => state.deliveryArea, shallowEqual);

  const [selectedId, setSelectedId] = useState(false);
  const [visible, setVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [id, setId] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    search: '',
  });

  const params = {
    ...initialParams,
    page: filters.page,
    search: filters.search || undefined,
  };

  const columns = [
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: t('title'),
      dataIndex: 'translation',
      key: 'translation',
      render: (translation) => translation?.title || t('N/A'),
    },
    {
      title: t('active'),
      dataIndex: 'active',
      key: 'active',
      render: (active, row) => (
        <Switch
          key={row.id}
          onChange={() => handleActive(row.id)}
          checked={active}
          loading={Boolean(selectedId === row.id)}
        />
      ),
    },
    {
      title: t('options'),
      dataIndex: 'options',
      is_show: true,
      render: (_, row) => (
        <Space>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => handleEdit(row.id)}
          />
          <Button
            loading={Boolean(deleting === row.id)}
            icon={<DeleteOutlined onClick={() => handleDelete(row.id)} />}
          />
        </Space>
      ),
    },
  ];

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const handleActive = (id) => {
    setSelectedId(id);
    areaService
      .status(id)
      .then(() => {
        setIsModalVisible(false);
        dispatch(setRefetch(activeMenu));
        toast.success(t('successfully.updated'));
      })
      .finally(() => {
        setSelectedId(null);
      });
  };
  const handleDelete = (id) => {
    setDeleting(id);
    areaService
      .delete(id)
      .then(() => {
        dispatch(setRefetch(activeMenu));
        toast.success(t('successfully.deleted'));
      })
      .finally(() => {
        setDeleting(false);
      });
  };
  const handleEdit = (id) => {
    setVisible(true);
    setId(id);
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const handleFilter = (key, value) => {
    if (key === 'search') {
      if (value?.length) {
        queryParams.set(key, value);
      } else {
        queryParams.reset(key);
      }
    }
  };

  const fetch = () => {
    dispatch(fetchArea(params));
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
      title={t('areas')}
      extra={
        <Space>
          <SearchInput
            placeholder={t('search')}
            handleChange={(search) => handleFiltersChange({ search, page: 1 })}
            defaultValue={filters.search}
            resetSearch={!filters.search}
          />
          <Button type='primary' onClick={() => setVisible(true)}>
            {t('add.area')}
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={list}
        pagination={{
          showSizeChanger: false,
          pageSize: meta.per_page || 10,
          total: meta.total || 0,
          current: meta?.current_page || 1,
        }}
        rowKey={(record) => record.id}
        loading={loading}
        onChange={onChangePagination}
      />
      <AreaForm
        visible={visible}
        setVisible={setVisible}
        id={id}
        setId={setId}
      />
    </Card>
  );
};

export default Area;
