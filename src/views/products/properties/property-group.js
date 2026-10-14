import { useEffect, useState, useContext } from 'react';
import { Button, Card, Divider, Space, Table } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import propertyService from 'services/property';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchPropertyGroups } from 'redux/slices/propertyGroup';
import { disableRefetch, setRefetch } from 'redux/slices/menu';
import PropertyGroupModal from './property-group-modal';
import DeleteButton from 'components/delete-button';
import PropertyGroupShowModal from './property-group-show-modal';
import FilterColumns from 'components/filter-column';
import CustomModal from 'components/modal';
import { Context } from 'context/context';
import SearchInput from 'components/search-input';
import useDidUpdate from 'helpers/useDidUpdate';

export default function PropertyGroup() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { setIsModalVisible } = useContext(Context);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { propertyGroups, meta, loading } = useSelector(
    (state) => state.propertyGroup,
    shallowEqual,
  );

  const [id, setId] = useState(null);
  const [show, setShow] = useState(null);
  const [modal, setModal] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [text, setText] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    search: '',
  });
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
      key: 'translation',
      is_show: true,
      render: (translation) => translation?.title,
    },
    {
      title: t('options'),
      is_show: true,
      render: (record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setShow(record.id)} />
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => setModal(record)}
          />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setIsModalVisible(true);
              setId([record.id]);
              setText(true);
            }}
          />
        </Space>
      ),
    },
  ]);

  const params = {
    search: filters.search || undefined,
    perPage: 10,
    page: filters.page,
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const handleCancel = () => {
    setShow(null);
    setModal(null);
  };

  const onDeleteExtra = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    propertyService
      .deleteGroup(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setId(null);
        setLoadingBtn(false);
        setIsModalVisible(false);
      });
  };

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.property.group'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const fetch = () => {
    dispatch(fetchPropertyGroups(params));
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    fetch();
  }, []);

  useDidUpdate(() => {
    fetch();
  }, [filters]);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetch();
    }
  }, [activeMenu.refetch]);

  return (
    <Card>
      <Space wrap>
        <SearchInput
          placeholder={t('search')}
          handleChange={(search) => handleFiltersChange({ search, page: 1 })}
          defaultValue={filters.search}
          resetSearch={!filters.search}
          style={{ width: 200 }}
        />
        <FilterColumns columns={columns} setColumns={setColumns} />
        <DeleteButton onClick={allDelete}>{t('delete.selected')}</DeleteButton>
        <Button type='primary' onClick={() => setModal({})}>
          {t('add.property')}
        </Button>
      </Space>
      <Divider />
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        loading={loading}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={propertyGroups}
        rowKey={(record) => record.id}
        pagination={{
          pageSize: params.perPage,
          page: activeMenu.data?.page || 1,
          total: meta.total,
          defaultCurrent: activeMenu.data?.page,
          current: activeMenu.data?.page,
        }}
        onChange={onChangePagination}
      />
      {Boolean(modal) && (
        <PropertyGroupModal modal={modal} handleCancel={handleCancel} />
      )}
      <CustomModal
        click={onDeleteExtra}
        text={text ? t('delete') : t('delete.selected')}
        loading={loadingBtn}
        setText={setId}
      />
      {Boolean(show) && (
        <PropertyGroupShowModal open={show} handleClose={handleCancel} />
      )}
    </Card>
  );
}
